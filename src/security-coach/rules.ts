import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { resolveStateDir } from "../config/paths.js";
import { assertNotSymlink } from "./utils.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RuleDecision = "allow" | "deny";

export type SecurityCoachRule = {
  id: string;
  /** Pattern ID or glob that this rule matches */
  patternId: string;
  /** Optional: specific command/content the rule applies to */
  matchValue?: string;
  /** The user's decision */
  decision: RuleDecision;
  /** When the rule was created */
  createdAt: number;
  /** When the rule expires (0 = never) */
  expiresAt: number;
  /** How many times this rule has been applied */
  hitCount: number;
  /** Last time this rule was applied */
  lastHitAt: number;
  /** User-provided note */
  note?: string;
};

export type RulesFile = {
  version: 1;
  rules: SecurityCoachRule[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RULES_FILENAME = "security-coach-rules.json";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export class SecurityCoachRuleStore {
  private rules: SecurityCoachRule[] = [];
  private filePath: string;
  private dirty = false;
  private savePromise: Promise<void> = Promise.resolve();

  private onWarning: ((msg: string) => void) | null;

  constructor(stateDir?: string, onWarning?: (msg: string) => void) {
    const dir = stateDir ?? resolveStateDir();
    this.filePath = path.join(dir, RULES_FILENAME);
    this.onWarning = onWarning ?? null;
  }

  // -----------------------------------------------------------------------
  // Persistence
  // -----------------------------------------------------------------------

  /** Load rules from disk. */
  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(raw) as RulesFile;
      if (parsed && parsed.version === 1 && Array.isArray(parsed.rules)) {
        this.rules = parsed.rules;
      } else {
        this.rules = [];
      }
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "ENOENT") {
        this.rules = [];
        return;
      }
      // Warn about data loss from corruption
      const msg = `security-coach: rules file at ${this.filePath} is corrupt or unreadable (${String(err)}). Starting with empty rules — previous rules may be lost.`;
      this.onWarning?.(msg);
      // Before resetting to empty, preserve the corrupt file
      try {
        const backupPath = `${this.filePath}.corrupt.${Date.now()}`;
        await fs.copyFile(this.filePath, backupPath);
        this.onWarning?.(`security-coach: backed up corrupt rules file to ${backupPath}`);
      } catch {
        // Can't backup — continue anyway.
      }
      this.rules = [];
    }
    this.dirty = false;
  }

  /** Save rules to disk (serialized — each save waits for the previous one). */
  async save(): Promise<void> {
    // Chain saves to prevent concurrent writes.
    this.savePromise = this.savePromise.then(() => this.doSave()).catch(() => {});
    return this.savePromise;
  }

  /** Internal: atomic write to temp file, then rename. */
  private async doSave(): Promise<void> {
    const data: RulesFile = {
      version: 1,
      rules: this.rules,
    };

    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });

    const tmp = path.join(dir, `${path.basename(this.filePath)}.${crypto.randomUUID()}.tmp`);
    try {
      await fs.writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, { encoding: "utf-8" });
      await fs.chmod(tmp, 0o600);
      assertNotSymlink(this.filePath);
      await fs.rename(tmp, this.filePath);
    } catch (err) {
      // Best-effort cleanup of the temp file on failure.
      try {
        await fs.unlink(tmp);
      } catch {
        // ignore
      }
      throw err;
    }

    this.dirty = false;
  }

  // -----------------------------------------------------------------------
  // Query
  // -----------------------------------------------------------------------

  /**
   * Find a matching rule for a pattern ID and optional match value.
   *
   * Lookup priority:
   *   1. Exact match on both `patternId` **and** `matchValue`.
   *   2. Pattern-only match (rule has no `matchValue` set).
   *
   * Expired rules are still returned -- the calling engine decides whether
   * to honour them.
   */
  findRule(patternId: string, matchValue?: string): SecurityCoachRule | null {
    let patternOnly: SecurityCoachRule | null = null;

    for (const rule of this.rules) {
      if (rule.patternId !== patternId) {
        continue;
      }

      // Exact match on both fields -- return immediately.
      if (matchValue !== undefined && rule.matchValue === matchValue) {
        return rule;
      }

      // Pattern-only match (rule applies to any value for this pattern).
      if (rule.matchValue === undefined && patternOnly === null) {
        patternOnly = rule;
      }
    }

    return patternOnly;
  }

  // -----------------------------------------------------------------------
  // Mutation
  // -----------------------------------------------------------------------

  /** Add a new rule. */
  addRule(
    rule: Omit<SecurityCoachRule, "id" | "createdAt" | "hitCount" | "lastHitAt">,
  ): SecurityCoachRule {
    const now = Date.now();
    const newRule: SecurityCoachRule = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: now,
      hitCount: 0,
      lastHitAt: 0,
    };
    this.rules.push(newRule);
    this.dirty = true;
    return newRule;
  }

  /** Remove a rule by ID. Returns `true` if a rule was removed. */
  removeRule(ruleId: string): boolean {
    const idx = this.rules.findIndex((r) => r.id === ruleId);
    if (idx < 0) {
      return false;
    }
    this.rules.splice(idx, 1);
    this.dirty = true;
    return true;
  }

  /** Get all rules. */
  getAllRules(): SecurityCoachRule[] {
    return this.rules.slice();
  }

  /**
   * Clear expired rules.
   * Returns the number of rules that were removed.
   */
  pruneExpired(): number {
    const now = Date.now();
    const before = this.rules.length;
    this.rules = this.rules.filter((r) => r.expiresAt === 0 || r.expiresAt > now);
    const removed = before - this.rules.length;
    if (removed > 0) {
      this.dirty = true;
    }
    return removed;
  }

  /** Record a rule hit (increment hitCount, update lastHitAt). */
  recordHit(ruleId: string): void {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (!rule) {
      return;
    }
    rule.hitCount += 1;
    rule.lastHitAt = Date.now();
    this.dirty = true;
  }

  // -----------------------------------------------------------------------
  // Lookup (used by the engine)
  // -----------------------------------------------------------------------

  /**
   * Look up whether a saved rule covers the given pattern + match value.
   *
   * Returns the stored decision if a non-expired rule exists, `null` otherwise.
   * Records a hit on the matched rule as a side effect.
   */
  lookup(patternId: string, matchValue?: string): RuleDecision | null {
    const rule = this.findRule(patternId, matchValue);
    if (!rule) {
      return null;
    }
    // Expired rules are ignored.
    if (rule.expiresAt !== 0 && rule.expiresAt <= Date.now()) {
      return null;
    }
    this.recordHit(rule.id);
    return rule.decision;
  }

  // -----------------------------------------------------------------------
  // Reporting
  // -----------------------------------------------------------------------

  /** Export rules summary for UI display. */
  getSummary(): { total: number; allows: number; denies: number; expired: number } {
    const now = Date.now();
    let allows = 0;
    let denies = 0;
    let expired = 0;

    for (const rule of this.rules) {
      if (rule.decision === "allow") {
        allows++;
      } else {
        denies++;
      }
      if (rule.expiresAt !== 0 && rule.expiresAt <= now) {
        expired++;
      }
    }

    return { total: this.rules.length, allows, denies, expired };
  }
}
