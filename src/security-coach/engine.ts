import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { resolveStateDir } from "../config/paths.js";
import { assertNotSymlink } from "./utils.js";
import type {
  ThreatMatch,
  ThreatMatchInput,
  ThreatSeverity,
} from "./patterns.js";
import { matchThreats } from "./patterns.js";
import type { SecurityCoachRuleStore, RuleDecision } from "./rules.js";
import { generateCoachMessage } from "./persona.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CoachAlertLevel = "block" | "warn" | "inform";

export type CoachAlert = {
  id: string;
  threats: ThreatMatch[];
  level: CoachAlertLevel;
  title: string;
  coachMessage: string;
  recommendation: string;
  /** How long the user has to decide (ms) */
  timeoutMs: number;
  createdAt: number;
  expiresAt: number;
  /** Whether this requires user action to proceed */
  requiresDecision: boolean;
};

export type CoachDecision =
  | "allow-once"
  | "allow-always"
  | "deny"
  | "learn-more";

export type CoachConfig = {
  /** Whether the security coach is enabled */
  enabled: boolean;
  /** Minimum severity to show alerts: "critical" | "high" | "medium" | "low" | "info" */
  minSeverity: ThreatSeverity;
  /** Whether to block on critical threats or just warn */
  blockOnCritical: boolean;
  /** Timeout for user decisions (ms, default 60000) */
  decisionTimeoutMs: number;
  /** Whether to show educational info even for allowed operations */
  educationalMode: boolean;
};

export const DEFAULT_COACH_CONFIG: CoachConfig = {
  enabled: true,
  minSeverity: "medium",
  blockOnCritical: true,
  decisionTimeoutMs: 60_000,
  educationalMode: true,
};

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Numeric weight for each severity level — higher means more severe.
 */
const SEVERITY_RANK: Record<ThreatSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

const MAX_PENDING_ALERTS = 100;
const MAX_PENDING_PER_SESSION = 20;

type PendingEntry = {
  alert: CoachAlert;
  resolve: (decision: CoachDecision | null) => void;
  timer: ReturnType<typeof setTimeout>;
  sessionKey?: string;
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class SecurityCoachEngine {
  private config: CoachConfig;
  private configPath: string;
  private rules: SecurityCoachRuleStore;
  private pendingAlerts: Map<string, PendingEntry> = new Map();
  private pendingPerSession: Map<string, number> = new Map();

  constructor(
    config?: Partial<CoachConfig>,
    rules?: SecurityCoachRuleStore,
    stateDir?: string,
  ) {
    this.config = { ...DEFAULT_COACH_CONFIG, ...config };
    this.configPath = path.join(stateDir ?? resolveStateDir(), "security-coach-config.json");
    // The rule store is expected to be provided; fall back to a minimal
    // no-op implementation so callers can omit it in tests / simple setups.
    // Safety: the engine only calls `this.rules.lookup()` — the no-op stub
    // satisfies that contract.  The `as unknown as` cast is intentional.
    this.rules = rules ?? ({
      lookup(): RuleDecision | null {
        return null;
      },
    } as unknown as SecurityCoachRuleStore);
    this.loadConfig();
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Evaluate an activity and determine if coaching is needed.
   *
   * 1. Run `matchThreats(input)` to find matching patterns.
   * 2. Filter by `config.minSeverity`.
   * 3. Check the rule store for existing allow/deny rules.
   * 4. If a rule allows  -> `{ allowed: true,  alert: null, autoDecision }`.
   * 5. If a rule denies  -> `{ allowed: false, alert: null, autoDecision }`.
   * 6. If no rule + threats -> build alert, `{ allowed: false, alert, autoDecision: null }`.
   * 7. If no threats       -> `{ allowed: true,  alert: null, autoDecision: null }`.
   */
  async evaluate(input: ThreatMatchInput): Promise<{
    allowed: boolean;
    alert: CoachAlert | null;
    autoDecision: RuleDecision | null;
    /** Pattern ID that triggered the auto-decision (for audit logging). */
    autoPatternId: string | null;
  }> {
    if (!this.config.enabled) {
      return { allowed: true, alert: null, autoDecision: null, autoPatternId: null };
    }

    // 1. Match threats
    const allThreats = matchThreats(input);

    // 2. Filter by minimum severity
    const minRank = SEVERITY_RANK[this.config.minSeverity];
    const threats = allThreats.filter(
      (t) => SEVERITY_RANK[t.pattern.severity] >= minRank,
    );

    // 7. No relevant threats — allow silently.
    if (threats.length === 0) {
      return { allowed: true, alert: null, autoDecision: null, autoPatternId: null };
    }

    // 3. Check for an existing rule. We use the highest-severity threat as
    //    the representative when querying the rule store.
    const topThreat = threats.reduce((a, b) =>
      SEVERITY_RANK[b.pattern.severity] > SEVERITY_RANK[a.pattern.severity] ? b : a,
    );

    const autoDecision: RuleDecision | null = this.rules.lookup(
      topThreat.pattern.id,
      topThreat.pattern.title,
    );

    // 4. Rule says allow
    if (autoDecision === "allow") {
      return { allowed: true, alert: null, autoDecision, autoPatternId: topThreat.pattern.id };
    }

    // 5. Rule says deny
    if (autoDecision === "deny") {
      return { allowed: false, alert: null, autoDecision, autoPatternId: topThreat.pattern.id };
    }

    // 6. No rule — build an alert so the UI can prompt the user.
    const alert = this.buildAlert(threats);
    return { allowed: false, alert, autoDecision: null, autoPatternId: null };
  }

  /**
   * Wait for a user decision on a pending alert.
   *
   * Returns a promise that resolves when `resolve()` is called or the
   * timeout expires (in which case it resolves to `null` — deny by default).
   */
  async waitForDecision(
    alertId: string,
    opts?: { sessionKey?: string },
  ): Promise<CoachDecision | null> {
    // Global cap
    if (this.pendingAlerts.size >= MAX_PENDING_ALERTS) {
      // Reject new alerts when at capacity — fail closed.
      return null;
    }

    // Per-session cap
    const session = opts?.sessionKey ?? "__global__";
    const sessionCount = this.pendingPerSession.get(session) ?? 0;
    if (sessionCount >= MAX_PENDING_PER_SESSION) {
      return null;
    }

    const existing = this.pendingAlerts.get(alertId);
    if (existing) {
      // Already waiting — return a new promise that shares the same lifecycle.
      // This mirrors how ExecApprovalManager handles duplicate waits.
      return new Promise<CoachDecision | null>((resolve) => {
        const prev = existing.resolve;
        existing.resolve = (d) => {
          prev(d);
          resolve(d);
        };
      });
    }

    // Increment per-session counter
    this.pendingPerSession.set(session, sessionCount + 1);

    const alert = this.getAlert(alertId);
    const timeoutMs = alert?.timeoutMs ?? this.config.decisionTimeoutMs;

    return new Promise<CoachDecision | null>((resolve) => {
      const timer = setTimeout(() => {
        const entry = this.pendingAlerts.get(alertId);
        this.pendingAlerts.delete(alertId);
        // Decrement per-session counter on timeout
        if (entry?.sessionKey) {
          const count = this.pendingPerSession.get(entry.sessionKey) ?? 0;
          if (count > 0) this.pendingPerSession.set(entry.sessionKey, count - 1);
        } else {
          const count = this.pendingPerSession.get("__global__") ?? 0;
          if (count > 0) this.pendingPerSession.set("__global__", count - 1);
        }
        resolve(null);
      }, timeoutMs);

      this.pendingAlerts.set(alertId, {
        alert: alert ?? this.buildPlaceholderAlert(alertId),
        resolve,
        timer,
        sessionKey: opts?.sessionKey,
      });
    });
  }

  /**
   * Resolve a pending alert with the user's decision.
   *
   * Returns `true` if the alert was pending and has been resolved, `false`
   * if no such pending alert exists.
   */
  resolve(
    alertId: string,
    decision: CoachDecision,
    opts?: { sessionKey?: string },
  ): boolean {
    const entry = this.pendingAlerts.get(alertId);
    if (!entry) {
      return false;
    }

    // Session affinity: if the alert was created with a session key,
    // the resolver must also provide a matching session key.
    if (entry.sessionKey) {
      if (!opts?.sessionKey) {
        return false; // Cannot resolve session-bound alert without session key
      }
      if (entry.sessionKey !== opts.sessionKey) {
        return false;
      }
    }

    clearTimeout(entry.timer);
    this.pendingAlerts.delete(alertId);

    // Decrement per-session counter
    if (entry.sessionKey) {
      const count = this.pendingPerSession.get(entry.sessionKey) ?? 0;
      if (count > 0) this.pendingPerSession.set(entry.sessionKey, count - 1);
    } else {
      const count = this.pendingPerSession.get("__global__") ?? 0;
      if (count > 0) this.pendingPerSession.set("__global__", count - 1);
    }

    entry.resolve(decision);
    return true;
  }

  /** Clear all pending alerts and their timers. */
  shutdown(): void {
    for (const [id, entry] of this.pendingAlerts) {
      clearTimeout(entry.timer);
      entry.resolve(null);
    }
    this.pendingAlerts.clear();
    this.pendingPerSession.clear();
  }

  /** Get all currently pending alerts. */
  getPendingAlerts(): CoachAlert[] {
    return Array.from(this.pendingAlerts.values()).map((e) => e.alert);
  }

  /** Get a single alert by ID (only if still pending). */
  getAlert(alertId: string): CoachAlert | null {
    return this.pendingAlerts.get(alertId)?.alert ?? null;
  }

  /** Get the current configuration. */
  getConfig(): CoachConfig {
    return { ...this.config };
  }

  /** Load persisted configuration from disk (synchronous). */
  loadConfig(): void {
    try {
      const raw = fs.readFileSync(this.configPath, "utf-8");
      const saved = JSON.parse(raw) as Partial<CoachConfig>;
      // Only merge known fields
      if (typeof saved.enabled === "boolean") this.config.enabled = saved.enabled;
      if (typeof saved.minSeverity === "string") {
        const validSeverities: string[] = ["critical", "high", "medium", "low", "info"];
        if (validSeverities.includes(saved.minSeverity)) {
          this.config.minSeverity = saved.minSeverity as ThreatSeverity;
        }
      }
      if (typeof saved.blockOnCritical === "boolean") this.config.blockOnCritical = saved.blockOnCritical;
      if (typeof saved.decisionTimeoutMs === "number") {
        if (saved.decisionTimeoutMs >= 5000 && saved.decisionTimeoutMs <= 300000) {
          this.config.decisionTimeoutMs = saved.decisionTimeoutMs;
        } else {
          console.warn(`[security-coach] WARNING: ignoring invalid decisionTimeoutMs from config: ${saved.decisionTimeoutMs}`);
        }
      }
      if (typeof saved.educationalMode === "boolean") this.config.educationalMode = saved.educationalMode;

      // Warn about security-critical config overrides from disk
      if (saved.enabled === false) {
        console.warn("[security-coach] WARNING: loaded config has security coach DISABLED — verify this is intentional");
      }
      if (saved.blockOnCritical === false) {
        console.warn("[security-coach] WARNING: loaded config has blockOnCritical DISABLED");
      }
    } catch {
      // File doesn't exist or is corrupt — use defaults.
    }
  }

  /** Persist current configuration to disk (atomic write). */
  async saveConfig(): Promise<void> {
    const dir = path.dirname(this.configPath);
    await fsp.mkdir(dir, { recursive: true, mode: 0o700 });
    const tmp = `${this.configPath}.${Date.now()}.tmp`;
    try {
      await fsp.writeFile(tmp, JSON.stringify(this.config, null, 2) + "\n", "utf-8");
      await fsp.chmod(tmp, 0o600);
      assertNotSymlink(this.configPath);
      await fsp.rename(tmp, this.configPath);
    } catch (err) {
      try { await fsp.unlink(tmp); } catch { /* ignore */ }
      throw err;
    }
  }

  /** Update configuration at runtime. */
  updateConfig(partial: Partial<CoachConfig>): void {
    this.config = { ...this.config, ...partial };
    void this.saveConfig().catch(() => { /* best-effort */ });
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /** Map a threat severity to the alert level shown to the user. */
  private severityToAlertLevel(severity: ThreatSeverity): CoachAlertLevel {
    switch (severity) {
      case "critical":
        return this.config.blockOnCritical ? "block" : "warn";
      case "high":
        return "warn";
      case "medium":
        return "warn";
      case "low":
        return "inform";
      case "info":
        return "inform";
      default:
        return "inform";
    }
  }

  /** Build a `CoachAlert` from a set of threat matches. */
  private buildAlert(threats: ThreatMatch[]): CoachAlert {
    // Use the highest severity across all matches to drive alert level.
    const topSeverity = threats.reduce<ThreatSeverity>(
      (worst, t) =>
        SEVERITY_RANK[t.pattern.severity] > SEVERITY_RANK[worst]
          ? t.pattern.severity
          : worst,
      "info",
    );

    const level = this.severityToAlertLevel(topSeverity);
    const now = Date.now();
    const timeoutMs = this.config.decisionTimeoutMs;

    // Map ThreatMatch[] to the flat shape expected by generateCoachMessage.
    const threatData = threats.map((t) => ({
      patternId: t.pattern.id,
      category: t.pattern.category,
      severity: t.pattern.severity,
      title: t.pattern.title,
      coaching: t.pattern.coaching,
    }));

    const { title, message, recommendation } = generateCoachMessage(
      threatData,
      level,
    );

    return {
      id: randomUUID(),
      threats,
      level,
      title,
      coachMessage: message,
      recommendation,
      timeoutMs,
      createdAt: now,
      expiresAt: now + timeoutMs,
      requiresDecision: level === "block" || level === "warn",
    };
  }

  /**
   * Construct a minimal placeholder alert for `waitForDecision` when called
   * with an ID that is not yet tracked (e.g. the alert was produced
   * externally and only the ID was forwarded).
   */
  private buildPlaceholderAlert(alertId: string): CoachAlert {
    const now = Date.now();
    const timeoutMs = this.config.decisionTimeoutMs;

    return {
      id: alertId,
      threats: [],
      level: "warn",
      title: "Pending security review",
      coachMessage: "",
      recommendation: "",
      timeoutMs,
      createdAt: now,
      expiresAt: now + timeoutMs,
      requiresDecision: true,
    };
  }
}
