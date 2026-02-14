// ---------------------------------------------------------------------------
// Security Coach -- Alert History Archive
//
// Persists resolved alerts to disk as an append-only JSONL file and provides
// query capabilities for historical analysis and reporting.
//
// Design invariants:
//   - Append-only: we never rewrite existing lines (fs.appendFileSync).
//   - Crash-safe: write failures are swallowed -- history must never take
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

export type AlertHistoryEntry = {
  id: string;
  level: string; // block | warn | inform
  title: string;
  severity: string; // critical | high | medium | low | info
  category: string;
  patternIds: string[];
  decision: string | null; // null = expired without decision
  resolvedBy: string | null;
  createdAtMs: number;
  resolvedAtMs: number;
  durationMs: number; // time from creation to resolution
  context?: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HISTORY_FILENAME = "security-coach-history.jsonl";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const DIR_MODE = 0o700;
const FILE_MODE = 0o600;

// ---------------------------------------------------------------------------
// AlertHistoryStore
// ---------------------------------------------------------------------------

export class AlertHistoryStore {
  private filePath: string;
  private dir: string;
  private rotating = false;
  private droppedEntries = 0;

  constructor(stateDir?: string) {
    const dir = stateDir ?? resolveStateDir();
    this.dir = dir;
    this.filePath = path.join(dir, HISTORY_FILENAME);
  }

  // -----------------------------------------------------------------------
  // Write
  // -----------------------------------------------------------------------

  /**
   * Synchronously append a history entry as a single JSON line.
   *
   * Uses `fs.appendFileSync` so the write is atomic at the OS level for
   * small payloads (single line of JSON). We never open the file for
   * truncation -- this is strictly append-only.
   *
   * All errors are swallowed: history logging must never crash the host.
   */
  record(entry: AlertHistoryEntry): void {
    try {
      // Ensure the directory exists.
      if (!fs.existsSync(this.dir)) {
        fs.mkdirSync(this.dir, { recursive: true, mode: DIR_MODE });
      }

      const line = JSON.stringify(entry) + "\n";
      assertNotSymlink(this.filePath);
      fs.appendFileSync(this.filePath, line, {
        encoding: "utf-8",
        mode: FILE_MODE,
      });

      // Best-effort permission enforcement on the file. On some platforms
      // the mode flag to appendFileSync is only applied at creation time,
      // so we chmod explicitly when the file already existed.
      try {
        fs.chmodSync(this.filePath, FILE_MODE);
      } catch {
        // ignore
      }
    } catch {
      // Silently continue -- history logging must not crash the host process.
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
   * Read and filter history entries.
   *
   * Filtering options:
   *   - `since`    -- only entries with `resolvedAtMs >= since` (epoch ms)
   *   - `until`    -- only entries with `resolvedAtMs <= until` (epoch ms)
   *   - `level`    -- only entries matching this alert level
   *   - `severity` -- only entries matching this severity
   *   - `decision` -- only entries matching this decision
   *   - `category` -- only entries matching this category
   *   - `limit`    -- return at most this many entries
   *   - `offset`   -- skip this many entries before applying limit
   *
   * Returns `{ entries, total }` where `total` is the count of entries
   * matching all filters (before pagination).
   */
  async query(opts: {
    since?: number;
    until?: number;
    level?: string;
    severity?: string;
    decision?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: AlertHistoryEntry[]; total: number }> {
    try {
      let content: string;
      try {
        content = await fsp.readFile(this.filePath, "utf-8");
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "ENOENT") {
          return { entries: [], total: 0 };
        }
        throw err;
      }

      const lines = content.split("\n").filter((l) => l.trim().length > 0);
      let entries: AlertHistoryEntry[] = [];

      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as AlertHistoryEntry;
          entries.push(entry);
        } catch {
          // Skip malformed lines -- partial writes, corruption, etc.
        }
      }

      // Apply filters.
      if (opts.since !== undefined) {
        entries = entries.filter((e) => e.resolvedAtMs >= opts.since!);
      }
      if (opts.until !== undefined) {
        entries = entries.filter((e) => e.resolvedAtMs <= opts.until!);
      }
      if (opts.level !== undefined) {
        entries = entries.filter((e) => e.level === opts.level);
      }
      if (opts.severity !== undefined) {
        entries = entries.filter((e) => e.severity === opts.severity);
      }
      if (opts.decision !== undefined) {
        entries = entries.filter((e) => e.decision === opts.decision);
      }
      if (opts.category !== undefined) {
        entries = entries.filter((e) => e.category === opts.category);
      }

      // Most recent first.
      entries.sort((a, b) => b.resolvedAtMs - a.resolvedAtMs);

      // Total matching count (before pagination).
      const total = entries.length;

      // Apply offset.
      if (opts.offset !== undefined && opts.offset > 0) {
        entries = entries.slice(opts.offset);
      }

      // Apply limit.
      if (opts.limit !== undefined && opts.limit > 0) {
        entries = entries.slice(0, opts.limit);
      }

      return { entries, total };
    } catch {
      // Graceful degradation -- return empty on any unexpected error.
      return { entries: [], total: 0 };
    }
  }

  /**
   * Shorthand for fetching the last N resolved entries (most recent first).
   */
  async getRecentEntries(limit: number): Promise<AlertHistoryEntry[]> {
    const result = await this.query({ limit });
    return result.entries;
  }

  // -----------------------------------------------------------------------
  // Rotation
  // -----------------------------------------------------------------------

  /**
   * Rotate the history file when it exceeds 10 MB.
   *
   * The current file is renamed to `security-coach-history.{timestamp}.jsonl`
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
      const rotatedName = `security-coach-history.${timestamp}.jsonl`;
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
      // Silently continue -- rotation failure should not crash the host.
    } finally {
      this.rotating = false;
    }
  }
}
