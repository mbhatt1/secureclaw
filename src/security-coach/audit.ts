// ---------------------------------------------------------------------------
// Security Coach — Immutable Audit Trail
//
// Append-only JSONL audit log for enterprise compliance (SOC 2, ISO 27001).
// Every alert, decision, rule change, and config mutation is recorded as an
// immutable line in `{stateDir}/security-coach-audit.jsonl`.
//
// Design invariants:
//   - Append-only: we never rewrite existing lines (fs.appendFileSync).
//   - Crash-safe: audit failures are swallowed — logging must never take
//     down the host process.
//   - Restrictive perms: 0o600 on files, 0o700 on directories.
//   - Rotation: files over 10 MB are renamed with a timestamp suffix.
// ---------------------------------------------------------------------------

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { resolveStateDir } from "../config/paths.js";
import { assertNotSymlink } from "./utils.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditEntry = {
  ts: number; // epoch ms
  type:
    | "alert.created"
    | "alert.resolved"
    | "alert.expired"
    | "alert.auto_allowed"
    | "alert.auto_denied"
    | "rule.created"
    | "rule.deleted"
    | "config.updated"
    | "hygiene.scan";
  alertId?: string;
  level?: string; // block | warn | inform
  title?: string;
  severity?: string;
  category?: string;
  decision?: string; // allow-once, allow-always, deny, learn-more
  resolvedBy?: string; // client display name / ID
  ruleId?: string;
  patternId?: string;
  configDiff?: Record<string, unknown>; // for config changes
  findingsCount?: number; // for hygiene scans
  context?: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUDIT_FILENAME = "security-coach-audit.jsonl";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const DIR_MODE = 0o700;
const FILE_MODE = 0o600;

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export class SecurityCoachAuditLog {
  private filePath: string;
  private dir: string;
  private rotating = false;
  private droppedEntries = 0;

  constructor(stateDir?: string) {
    const dir = stateDir ?? resolveStateDir();
    this.dir = dir;
    this.filePath = path.join(dir, AUDIT_FILENAME);
  }

  // -----------------------------------------------------------------------
  // Write
  // -----------------------------------------------------------------------

  /**
   * Synchronously append an audit entry as a single JSON line.
   *
   * Uses `fs.appendFileSync` so the write is atomic at the OS level for
   * small payloads (single line of JSON). We never open the file for
   * truncation — this is strictly append-only.
   *
   * All errors are swallowed: audit logging must never crash the host.
   */
  append(entry: AuditEntry): void {
    try {
      // Ensure the directory exists.
      if (!fs.existsSync(this.dir)) {
        fs.mkdirSync(this.dir, { recursive: true, mode: DIR_MODE });
      }

      const line = JSON.stringify(entry) + "\n";
      assertNotSymlink(this.filePath);
      fs.appendFileSync(this.filePath, line, { encoding: "utf-8", mode: FILE_MODE });

      // Best-effort permission enforcement on the file. On some platforms
      // the mode flag to appendFileSync is only applied at creation time,
      // so we chmod explicitly when the file already existed.
      try {
        fs.chmodSync(this.filePath, FILE_MODE);
      } catch {
        // ignore
      }
    } catch {
      // Silently continue — audit logging must not crash the host process.
      this.droppedEntries++;
    }
  }

  /** Returns the number of entries that were dropped due to write failures. */
  getDroppedCount(): number {
    return this.droppedEntries;
  }

  // -----------------------------------------------------------------------
  // Query
  // -----------------------------------------------------------------------

  /**
   * Read and filter audit entries.
   *
   * Filtering options:
   *   - `since` — only entries with `ts >= since` (epoch ms)
   *   - `until` — only entries with `ts <= until` (epoch ms)
   *   - `type`  — only entries matching this event type
   *   - `limit` — return at most this many entries (most recent first)
   */
  async query(opts: {
    since?: number;
    until?: number;
    type?: string;
    limit?: number;
  }): Promise<AuditEntry[]> {
    try {
      let content: string;
      try {
        content = await fsp.readFile(this.filePath, "utf-8");
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "ENOENT") {
          return [];
        }
        throw err;
      }

      const lines = content.split("\n").filter((l) => l.trim().length > 0);
      let entries: AuditEntry[] = [];

      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as AuditEntry;
          entries.push(entry);
        } catch {
          // Skip malformed lines — partial writes, corruption, etc.
        }
      }

      // Apply filters.
      if (opts.since !== undefined) {
        entries = entries.filter((e) => e.ts >= opts.since!);
      }
      if (opts.until !== undefined) {
        entries = entries.filter((e) => e.ts <= opts.until!);
      }
      if (opts.type !== undefined) {
        entries = entries.filter((e) => e.type === opts.type);
      }

      // Most recent first.
      entries.sort((a, b) => b.ts - a.ts);

      // Apply limit.
      if (opts.limit !== undefined && opts.limit > 0) {
        entries = entries.slice(0, opts.limit);
      }

      return entries;
    } catch {
      // Graceful degradation — return empty on any unexpected error.
      return [];
    }
  }

  // -----------------------------------------------------------------------
  // Rotation
  // -----------------------------------------------------------------------

  /**
   * Rotate the audit log when it exceeds 10 MB.
   *
   * The current file is renamed to `security-coach-audit.{timestamp}.jsonl`
   * and a fresh file is started. This preserves the full history while
   * keeping the active file small for query performance.
   */
  async rotateIfNeeded(): Promise<void> {
    if (this.rotating) {
      return;
    } // Already rotating — prevent concurrent rotations.
    this.rotating = true;
    try {
      let stat: fs.Stats;
      try {
        stat = await fsp.stat(this.filePath);
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "ENOENT") {
          return; // Nothing to rotate.
        }
        throw err;
      }

      if (stat.size < MAX_FILE_SIZE_BYTES) {
        return; // Under threshold.
      }

      const timestamp = Date.now();
      const rotatedName = `security-coach-audit.${timestamp}.jsonl`;
      const rotatedPath = path.join(this.dir, rotatedName);

      assertNotSymlink(this.filePath);
      await fsp.rename(this.filePath, rotatedPath);

      // Ensure the rotated file keeps restrictive permissions.
      try {
        await fsp.chmod(rotatedPath, FILE_MODE);
      } catch {
        // ignore
      }
    } catch {
      // Silently continue — rotation failure should not crash the host.
    } finally {
      this.rotating = false;
    }
  }
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Log when an alert is created by the security coach engine.
 */
export function auditAlertCreated(
  log: SecurityCoachAuditLog,
  alert: {
    id: string;
    level: string;
    title: string;
    threats?: Array<{
      pattern: { severity: string; category: string };
    }>;
  },
): void {
  const topThreat = alert.threats?.[0];
  log.append({
    ts: Date.now(),
    type: "alert.created",
    alertId: alert.id,
    level: alert.level,
    title: alert.title,
    severity: topThreat?.pattern.severity,
    category: topThreat?.pattern.category,
  });
}

/**
 * Log when a user resolves an alert with a decision.
 */
export function auditAlertResolved(
  log: SecurityCoachAuditLog,
  alertId: string,
  decision: string,
  resolvedBy?: string,
  context?: Record<string, unknown>,
): void {
  log.append({
    ts: Date.now(),
    type: "alert.resolved",
    alertId,
    decision,
    resolvedBy,
    context,
  });
}

/**
 * Log when an alert expires without a user decision (timeout).
 */
export function auditAlertExpired(log: SecurityCoachAuditLog, alertId: string): void {
  log.append({
    ts: Date.now(),
    type: "alert.expired",
    alertId,
  });
}

/**
 * Log when an existing rule automatically allows or denies an operation.
 */
export function auditAutoDecision(
  log: SecurityCoachAuditLog,
  patternId: string,
  decision: string,
  context?: Record<string, unknown>,
): void {
  const type: AuditEntry["type"] =
    decision === "allow" ? "alert.auto_allowed" : "alert.auto_denied";

  log.append({
    ts: Date.now(),
    type,
    patternId,
    decision,
    context,
  });
}

/**
 * Log when a new security coach rule is created.
 */
export function auditRuleCreated(
  log: SecurityCoachAuditLog,
  rule: {
    id: string;
    patternId: string;
    decision: string;
  },
): void {
  log.append({
    ts: Date.now(),
    type: "rule.created",
    ruleId: rule.id,
    patternId: rule.patternId,
    decision: rule.decision,
  });
}

/**
 * Log when a security coach rule is deleted.
 */
export function auditRuleDeleted(log: SecurityCoachAuditLog, ruleId: string): void {
  log.append({
    ts: Date.now(),
    type: "rule.deleted",
    ruleId,
  });
}

/**
 * Log when the security coach configuration is updated.
 */
export function auditConfigUpdated(
  log: SecurityCoachAuditLog,
  diff: Record<string, unknown>,
): void {
  log.append({
    ts: Date.now(),
    type: "config.updated",
    configDiff: diff,
  });
}

/**
 * Log when a hygiene scan is executed, recording how many findings were produced.
 */
export function auditHygieneScan(log: SecurityCoachAuditLog, findingsCount: number): void {
  log.append({
    ts: Date.now(),
    type: "hygiene.scan",
    findingsCount,
  });
}
