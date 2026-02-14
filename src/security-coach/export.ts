import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { CoachConfig } from "./engine.js";
import { THREAT_PATTERNS } from "./patterns.js";
import type { SecurityCoachRule } from "./rules.js";
import { resolveStateDir } from "../config/paths.js";
import { assertNotSymlink } from "./utils.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExportBundle = {
  version: 1;
  exportedAt: string; // ISO 8601
  exportedFrom: string; // hostname
  config?: CoachConfig;
  rules?: SecurityCoachRule[];
  /** Optional metadata (comments, tags, etc.) */
  metadata?: {
    description?: string;
    environment?: string; // e.g. "production", "staging"
    tags?: string[];
  };
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ExportValidationError extends Error {
  constructor(public issues: string[]) {
    super(`Invalid export bundle: ${issues.join("; ")}`);
    this.name = "ExportValidationError";
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Type guard that validates the shape and field types of an unknown value
 * as an `ExportBundle`.
 */
export function validateBundle(bundle: unknown): bundle is ExportBundle {
  if (bundle === null || typeof bundle !== "object") {
    return false;
  }

  const b = bundle as Record<string, unknown>;

  if (b.version !== 1) {
    return false;
  }
  if (typeof b.exportedAt !== "string") {
    return false;
  }
  if (typeof b.exportedFrom !== "string") {
    return false;
  }

  // Validate config (optional)
  if (b.config !== undefined) {
    if (!isValidConfig(b.config)) {
      return false;
    }
  }

  // Validate rules (optional)
  if (b.rules !== undefined) {
    if (!Array.isArray(b.rules)) {
      return false;
    }
    for (const rule of b.rules) {
      if (!isValidRule(rule)) {
        return false;
      }
    }
  }

  // Validate metadata (optional)
  if (b.metadata !== undefined) {
    if (!isValidMetadata(b.metadata)) {
      return false;
    }
  }

  return true;
}

function isValidConfig(config: unknown): config is CoachConfig {
  if (config === null || typeof config !== "object") {
    return false;
  }
  const c = config as Record<string, unknown>;

  if (typeof c.enabled !== "boolean") return false;
  if (typeof c.blockOnCritical !== "boolean") return false;
  if (typeof c.educationalMode !== "boolean") return false;

  // Validate minSeverity is a known severity level
  if (typeof c.minSeverity !== "string") return false;
  const validSeverities = ["critical", "high", "medium", "low", "info"];
  if (!validSeverities.includes(c.minSeverity)) return false;

  // Validate decisionTimeoutMs is within acceptable bounds
  if (typeof c.decisionTimeoutMs !== "number") return false;
  if (c.decisionTimeoutMs < 5000 || c.decisionTimeoutMs > 300000) return false;

  return true;
}

function isValidRule(rule: unknown): rule is SecurityCoachRule {
  if (rule === null || typeof rule !== "object") {
    return false;
  }
  const r = rule as Record<string, unknown>;
  if (typeof r.id !== "string") return false;
  if (typeof r.patternId !== "string") return false;
  if (r.matchValue !== undefined && typeof r.matchValue !== "string") return false;
  if (r.decision !== "allow" && r.decision !== "deny") return false;
  if (typeof r.createdAt !== "number") return false;
  if (typeof r.expiresAt !== "number") return false;
  if (typeof r.hitCount !== "number") return false;
  if (typeof r.lastHitAt !== "number") return false;
  if (r.note !== undefined && typeof r.note !== "string") return false;

  // Reject wildcard allow rules (no matchValue) — too dangerous to import.
  if (r.decision === "allow" && (!r.matchValue || (typeof r.matchValue === "string" && r.matchValue.trim() === ""))) {
    return false;
  }

  // Reject allow rules for critical-severity patterns — they should never be importable.
  if (r.decision === "allow") {
    const pattern = THREAT_PATTERNS.find((p) => p.id === r.patternId);
    if (pattern && pattern.severity === "critical") {
      return false;
    }
  }

  return true;
}

function isValidMetadata(
  metadata: unknown,
): metadata is ExportBundle["metadata"] {
  if (metadata === null || typeof metadata !== "object") {
    return false;
  }
  const m = metadata as Record<string, unknown>;
  if (m.description !== undefined && typeof m.description !== "string") return false;
  if (m.environment !== undefined && typeof m.environment !== "string") return false;
  if (m.tags !== undefined) {
    if (!Array.isArray(m.tags)) return false;
    for (const tag of m.tags) {
      if (typeof tag !== "string") return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Path safety
// ---------------------------------------------------------------------------

/** Ensure a file path is within the allowed base directory. */
function assertSafePath(filePath: string, baseDir?: string): void {
  const base = baseDir ?? resolveStateDir();
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(base) + path.sep) && resolved !== path.resolve(base)) {
    throw new Error(`Path traversal denied: ${filePath} is outside ${base}`);
  }
}

// ---------------------------------------------------------------------------
// Export functions
// ---------------------------------------------------------------------------

/**
 * Create an export bundle containing rules only.
 *
 * Rule hit statistics (`hitCount`, `lastHitAt`) are reset to zero in the
 * exported bundle since they are instance-specific runtime data.
 */
export function exportRules(rules: SecurityCoachRule[]): ExportBundle {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    exportedFrom: os.hostname(),
    rules: rules.map((rule) => ({
      ...rule,
      hitCount: 0,
      lastHitAt: 0,
    })),
  };
}

/** Create an export bundle containing config only. */
export function exportConfig(config: CoachConfig): ExportBundle {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    exportedFrom: os.hostname(),
    config: { ...config },
  };
}

/** Create a full export bundle with rules, config, and optional metadata. */
export function exportAll(
  rules: SecurityCoachRule[],
  config: CoachConfig,
  metadata?: ExportBundle["metadata"],
): ExportBundle {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    exportedFrom: os.hostname(),
    config: { ...config },
    rules: rules.map((rule) => ({
      ...rule,
      hitCount: 0,
      lastHitAt: 0,
    })),
    ...(metadata !== undefined ? { metadata } : {}),
  };
}

/** Serialize an export bundle to a formatted JSON string. */
export function serializeBundle(bundle: ExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}

/**
 * Write an export bundle to a file using an atomic write pattern
 * (write to a temp file in the same directory, then rename).
 */
export async function exportToFile(
  bundle: ExportBundle,
  filePath: string,
): Promise<void> {
  assertSafePath(filePath);
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  const tmp = path.join(dir, `${path.basename(filePath)}.${randomUUID()}.tmp`);
  try {
    await fs.writeFile(tmp, serializeBundle(bundle) + "\n", "utf-8");
    await fs.chmod(tmp, 0o600);
    assertNotSymlink(filePath);
    await fs.rename(tmp, filePath);
  } catch (err) {
    try {
      await fs.unlink(tmp);
    } catch {
      // ignore cleanup failure
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Import functions
// ---------------------------------------------------------------------------

/**
 * Parse a raw JSON string into a validated `ExportBundle`.
 *
 * Throws `ExportValidationError` if the string is not valid JSON or
 * fails structural validation.
 */
export function parseBundle(raw: string): ExportBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ExportValidationError(["Invalid JSON"]);
  }

  const issues = collectValidationIssues(parsed);
  if (issues.length > 0) {
    throw new ExportValidationError(issues);
  }

  return parsed as ExportBundle;
}

/** Read a file and parse its contents as an `ExportBundle`. */
export async function importFromFile(filePath: string): Promise<ExportBundle> {
  assertSafePath(filePath);
  const raw = await fs.readFile(filePath, "utf-8");
  return parseBundle(raw);
}

/**
 * Merge imported rules into an existing rule set.
 *
 * For every imported rule, a new UUID is generated, `hitCount` is reset to 0,
 * and `lastHitAt` is reset to 0. The `createdAt` timestamp is set to the
 * current time. Fields `patternId`, `matchValue`, `decision`, `expiresAt`,
 * and `note` are preserved from the imported rule.
 *
 * Strategies:
 *  - `replace`: imported rules replace all existing rules.
 *  - `merge`:   imported rules are merged; on a `patternId`+`matchValue`
 *               conflict the imported rule wins.
 *  - `append`:  imported rules are appended; duplicates (same
 *               `patternId`+`matchValue`) are skipped.
 */
export function mergeRules(
  existing: SecurityCoachRule[],
  imported: SecurityCoachRule[],
  strategy: "replace" | "merge" | "append",
): SecurityCoachRule[] {
  const preparedImported = imported.map(prepareImportedRule);

  switch (strategy) {
    case "replace":
      return preparedImported;

    case "merge": {
      // Start with existing rules, then override with imported on conflict.
      const result = new Map<string, SecurityCoachRule>();
      for (const rule of existing) {
        result.set(ruleKey(rule), rule);
      }
      for (const rule of preparedImported) {
        result.set(ruleKey(rule), rule);
      }
      return Array.from(result.values());
    }

    case "append": {
      const existingKeys = new Set(existing.map(ruleKey));
      const appended = preparedImported.filter(
        (rule) => !existingKeys.has(ruleKey(rule)),
      );
      return [...existing, ...appended];
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Build a deduplication key from patternId + matchValue. */
function ruleKey(rule: SecurityCoachRule): string {
  return `${rule.patternId}\0${rule.matchValue ?? ""}`;
}

/**
 * Prepare an imported rule: generate a new UUID, reset runtime counters,
 * and set `createdAt` to now.
 */
function prepareImportedRule(rule: SecurityCoachRule): SecurityCoachRule {
  return {
    id: randomUUID(),
    patternId: rule.patternId,
    matchValue: rule.matchValue,
    decision: rule.decision,
    createdAt: Date.now(),
    expiresAt: rule.expiresAt,
    hitCount: 0,
    lastHitAt: 0,
    note: rule.note,
  };
}

/**
 * Collect all structural/type validation issues for a parsed value.
 * Returns an empty array when the value is a valid `ExportBundle`.
 */
function collectValidationIssues(value: unknown): string[] {
  const issues: string[] = [];

  if (value === null || typeof value !== "object") {
    issues.push("Bundle must be a non-null object");
    return issues;
  }

  const b = value as Record<string, unknown>;

  if (b.version !== 1) {
    issues.push("Unsupported or missing version (expected 1)");
  }
  if (typeof b.exportedAt !== "string") {
    issues.push("Missing or invalid exportedAt (expected ISO 8601 string)");
  }
  if (typeof b.exportedFrom !== "string") {
    issues.push("Missing or invalid exportedFrom (expected string)");
  }

  // Config validation
  if (b.config !== undefined) {
    if (b.config === null || typeof b.config !== "object") {
      issues.push("config must be an object");
    } else {
      const c = b.config as Record<string, unknown>;
      if (typeof c.enabled !== "boolean") issues.push("config.enabled must be a boolean");
      if (typeof c.minSeverity !== "string") issues.push("config.minSeverity must be a string");
      if (typeof c.blockOnCritical !== "boolean") issues.push("config.blockOnCritical must be a boolean");
      if (typeof c.decisionTimeoutMs !== "number") issues.push("config.decisionTimeoutMs must be a number");
      if (typeof c.educationalMode !== "boolean") issues.push("config.educationalMode must be a boolean");
    }
  }

  // Rules validation
  if (b.rules !== undefined) {
    if (!Array.isArray(b.rules)) {
      issues.push("rules must be an array");
    } else {
      for (let i = 0; i < b.rules.length; i++) {
        const rule = b.rules[i] as Record<string, unknown> | null;
        if (rule === null || typeof rule !== "object") {
          issues.push(`rules[${i}] must be an object`);
          continue;
        }
        if (typeof rule.id !== "string") issues.push(`rules[${i}].id must be a string`);
        if (typeof rule.patternId !== "string") issues.push(`rules[${i}].patternId must be a string`);
        if (rule.matchValue !== undefined && typeof rule.matchValue !== "string") {
          issues.push(`rules[${i}].matchValue must be a string if present`);
        }
        if (rule.decision !== "allow" && rule.decision !== "deny") {
          issues.push(`rules[${i}].decision must be "allow" or "deny"`);
        }
        if (typeof rule.createdAt !== "number") issues.push(`rules[${i}].createdAt must be a number`);
        if (typeof rule.expiresAt !== "number") issues.push(`rules[${i}].expiresAt must be a number`);
        if (typeof rule.hitCount !== "number") issues.push(`rules[${i}].hitCount must be a number`);
        if (typeof rule.lastHitAt !== "number") issues.push(`rules[${i}].lastHitAt must be a number`);
        if (rule.note !== undefined && typeof rule.note !== "string") {
          issues.push(`rules[${i}].note must be a string if present`);
        }
      }
    }
  }

  // Metadata validation
  if (b.metadata !== undefined) {
    if (b.metadata === null || typeof b.metadata !== "object") {
      issues.push("metadata must be an object");
    } else {
      const m = b.metadata as Record<string, unknown>;
      if (m.description !== undefined && typeof m.description !== "string") {
        issues.push("metadata.description must be a string");
      }
      if (m.environment !== undefined && typeof m.environment !== "string") {
        issues.push("metadata.environment must be a string");
      }
      if (m.tags !== undefined) {
        if (!Array.isArray(m.tags)) {
          issues.push("metadata.tags must be an array");
        } else {
          for (let i = 0; i < m.tags.length; i++) {
            if (typeof m.tags[i] !== "string") {
              issues.push(`metadata.tags[${i}] must be a string`);
            }
          }
        }
      }
    }
  }

  return issues;
}
