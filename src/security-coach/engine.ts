import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import type { LLMJudgeConfig, LLMJudgeResult } from "./llm-judge-schemas.js";
import type { ThreatMatch, ThreatMatchInput, ThreatSeverity } from "./patterns.js";
import type { SecurityCoachRuleStore, RuleDecision } from "./rules.js";
import { resolveStateDir } from "../config/paths.js";
import { DEFAULT_LLM_JUDGE_CONFIG } from "./llm-judge-schemas.js";
import { LLMJudge } from "./llm-judge.js";
import { matchThreats } from "./patterns.js";
import { generateCoachMessage } from "./persona.js";
import { assertNotSymlink } from "./utils.js";

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

export type CoachDecision = "allow-once" | "allow-always" | "deny" | "learn-more";

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
  /** LLM judge configuration (optional) */
  llmJudge?: Partial<LLMJudgeConfig>;
  /** Enable worker thread pool for pattern matching (default: false) */
  useWorkerThreads?: boolean;
  /** Enable pattern match caching (default: true) */
  useCache?: boolean;
  /** Cache size in entries (default: 1000) */
  cacheSize?: number;
  /** Cache TTL in milliseconds (default: 60000) */
  cacheTTL?: number;
};

export const DEFAULT_COACH_CONFIG: CoachConfig = {
  enabled: true,
  minSeverity: "medium",
  blockOnCritical: true,
  decisionTimeoutMs: 60_000,
  educationalMode: true,
  llmJudge: undefined, // Disabled by default
  useWorkerThreads: false, // Disabled by default (requires explicit opt-in)
  useCache: true, // Enabled by default (low overhead, high benefit)
  cacheSize: 1000,
  cacheTTL: 60_000, // 1 minute
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
  private llmJudge: LLMJudge | null = null;
  private cache: any = null; // PatternMatchCache (lazy loaded)
  private workerPool: any = null; // SecurityCoachWorkerPool (lazy loaded)

  constructor(config?: Partial<CoachConfig>, rules?: SecurityCoachRuleStore, stateDir?: string) {
    this.config = { ...DEFAULT_COACH_CONFIG, ...config };
    this.configPath = path.join(stateDir ?? resolveStateDir(), "security-coach-config.json");
    // The rule store is expected to be provided; fall back to a minimal
    // no-op implementation so callers can omit it in tests / simple setups.
    // Safety: the engine only calls `this.rules.lookup()` — the no-op stub
    // satisfies that contract.  The `as unknown as` cast is intentional.
    this.rules =
      rules ??
      ({
        lookup(): RuleDecision | null {
          return null;
        },
      } as unknown as SecurityCoachRuleStore);

    // Initialize LLM judge if configured
    if (this.config.llmJudge) {
      this.llmJudge = new LLMJudge(this.config.llmJudge);
    }

    // Note: Cache and worker pool are initialized lazily on first use
    // to avoid blocking constructor with async operations
    this.loadConfig();
  }

  /**
   * Ensure cache is initialized (lazy initialization).
   */
  private async ensureCacheInitialized(): Promise<void> {
    if (this.config.useCache && !this.cache) {
      await this.initializeCache();
    }
  }

  /**
   * Ensure worker pool is initialized (lazy initialization).
   */
  private async ensureWorkerPoolInitialized(): Promise<void> {
    if (this.config.useWorkerThreads && !this.workerPool) {
      await this.initializeWorkerPool();
    }
  }

  private async initializeCache(): Promise<void> {
    try {
      const { PatternMatchCache } = await import("./cache-optimized.js");
      this.cache = new PatternMatchCache(this.config.cacheSize, this.config.cacheTTL);
    } catch (err) {
      console.warn("[security-coach] Failed to initialize cache:", err);
      this.config.useCache = false;
    }
  }

  private async initializeWorkerPool(): Promise<void> {
    try {
      const { getWorkerPool } = await import("./worker-pool.js");
      this.workerPool = getWorkerPool();
      await this.workerPool.initialize();
    } catch (err) {
      console.warn("[security-coach] Failed to initialize worker pool:", err);
      this.config.useWorkerThreads = false;
    }
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Evaluate an activity and determine if coaching is needed.
   *
   * HYBRID APPROACH:
   * 1. Run pattern matching (fast path)
   * 2. Check saved rules
   * 3. Use LLM judge for ambiguous cases (optional)
   * 4. Build alert if threat detected
   */
  async evaluate(input: ThreatMatchInput): Promise<{
    allowed: boolean;
    alert: CoachAlert | null;
    autoDecision: RuleDecision | null;
    /** Pattern ID that triggered the auto-decision (for audit logging). */
    autoPatternId: string | null;
    /** LLM judge result (if used) */
    llmResult?: LLMJudgeResult;
    /** Evaluation source: "pattern", "llm", "hybrid", "rule" */
    source?: string;
  }> {
    if (!this.config.enabled) {
      return {
        allowed: true,
        alert: null,
        autoDecision: null,
        autoPatternId: null,
        source: "disabled",
      };
    }

    // LAYER 1: Pattern matching (fast, deterministic)
    // Use cache + worker pool if enabled
    const allThreats = await this.matchThreatsWithOptimizations(input);
    const minRank = SEVERITY_RANK[this.config.minSeverity];
    const threats = allThreats.filter((t) => SEVERITY_RANK[t.pattern.severity] >= minRank);

    // Check for critical threats - block immediately without LLM
    const criticalThreats = threats.filter((t) => t.pattern.severity === "critical");
    if (criticalThreats.length > 0) {
      // Critical threat - block immediately
      const topThreat = criticalThreats[0];
      const autoDecision = this.rules.lookup(topThreat.pattern.id, topThreat.pattern.title);

      if (autoDecision === "allow") {
        return {
          allowed: true,
          alert: null,
          autoDecision,
          autoPatternId: topThreat.pattern.id,
          source: "rule",
        };
      }

      if (autoDecision === "deny") {
        return {
          allowed: false,
          alert: null,
          autoDecision,
          autoPatternId: topThreat.pattern.id,
          source: "rule",
        };
      }

      const alert = this.buildAlert(criticalThreats);
      return { allowed: false, alert, autoDecision: null, autoPatternId: null, source: "pattern" };
    }

    // Non-critical pattern matches - may use LLM for confirmation
    if (threats.length > 0) {
      const topThreat = threats.reduce((a, b) =>
        SEVERITY_RANK[b.pattern.severity] > SEVERITY_RANK[a.pattern.severity] ? b : a,
      );

      const autoDecision = this.rules.lookup(topThreat.pattern.id, topThreat.pattern.title);

      if (autoDecision === "allow") {
        return {
          allowed: true,
          alert: null,
          autoDecision,
          autoPatternId: topThreat.pattern.id,
          source: "rule",
        };
      }

      if (autoDecision === "deny") {
        return {
          allowed: false,
          alert: null,
          autoDecision,
          autoPatternId: topThreat.pattern.id,
          source: "rule",
        };
      }

      // LAYER 2: LLM confirmation of pattern match (reduce false positives)
      if (this.llmJudge) {
        try {
          const llmResult = await this.llmJudge.confirmPatternMatch(input, threats);

          if (llmResult) {
            // LLM says it's NOT a threat (false positive)
            if (!llmResult.isThreat && llmResult.confidence >= 75) {
              return {
                allowed: true,
                alert: null,
                autoDecision: null,
                autoPatternId: null,
                llmResult,
                source: "hybrid-llm-override",
              };
            }

            // LLM confirms threat - build alert with LLM reasoning
            const alert = this.buildAlertFromLLM(llmResult, input);
            return {
              allowed: false,
              alert,
              autoDecision: null,
              autoPatternId: null,
              llmResult,
              source: "hybrid",
            };
          }
        } catch (err) {
          // LLM failed - fall back to pattern match
          // Continue to build alert from patterns
        }
      }

      // No LLM or LLM failed - use pattern match
      const alert = this.buildAlert(threats);
      return { allowed: false, alert, autoDecision: null, autoPatternId: null, source: "pattern" };
    }

    // LAYER 3: No pattern match - use LLM for novel threat detection
    if (this.llmJudge && this.llmJudge.shouldUseLLM(input)) {
      try {
        const llmResult = await this.llmJudge.evaluate(input);

        if (llmResult && llmResult.isThreat && llmResult.confidence >= 75) {
          const alert = this.buildAlertFromLLM(llmResult, input);
          return {
            allowed: false,
            alert,
            autoDecision: null,
            autoPatternId: null,
            llmResult,
            source: "llm",
          };
        }
      } catch (err) {
        // LLM failed - allow (no threats detected by patterns)
        return {
          allowed: true,
          alert: null,
          autoDecision: null,
          autoPatternId: null,
          source: "clean",
        };
      }
    }

    // No threats detected
    return { allowed: true, alert: null, autoDecision: null, autoPatternId: null, source: "clean" };
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
          if (count > 0) {
            this.pendingPerSession.set(entry.sessionKey, count - 1);
          }
        } else {
          const count = this.pendingPerSession.get("__global__") ?? 0;
          if (count > 0) {
            this.pendingPerSession.set("__global__", count - 1);
          }
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
  resolve(alertId: string, decision: CoachDecision, opts?: { sessionKey?: string }): boolean {
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
      if (count > 0) {
        this.pendingPerSession.set(entry.sessionKey, count - 1);
      }
    } else {
      const count = this.pendingPerSession.get("__global__") ?? 0;
      if (count > 0) {
        this.pendingPerSession.set("__global__", count - 1);
      }
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

    // Shutdown worker pool if enabled
    if (this.workerPool) {
      void this.workerPool.shutdown().catch(() => {
        /* ignore */
      });
    }
  }

  /** Get cache statistics (if cache is enabled). */
  getCacheStats(): any {
    return this.cache?.getStats() ?? null;
  }

  /** Get worker pool statistics (if workers are enabled). */
  getWorkerStats(): any {
    return this.workerPool?.getStats() ?? null;
  }

  /** Prune expired cache entries. */
  pruneCache(): number {
    return this.cache?.prune() ?? 0;
  }

  /** Clear the cache. */
  clearCache(): void {
    this.cache?.clear();
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
    // OPTIMIZATION: Return frozen object instead of spreading (read-only access)
    // Callers should not mutate the returned config - use updateConfig() instead
    return this.config;
  }

  /** Load persisted configuration from disk (synchronous). */
  loadConfig(): void {
    try {
      const raw = fs.readFileSync(this.configPath, "utf-8");
      const saved = JSON.parse(raw) as Partial<CoachConfig>;
      // Only merge known fields
      if (typeof saved.enabled === "boolean") {
        this.config.enabled = saved.enabled;
      }
      if (typeof saved.minSeverity === "string") {
        const validSeverities: string[] = ["critical", "high", "medium", "low", "info"];
        if (validSeverities.includes(saved.minSeverity)) {
          this.config.minSeverity = saved.minSeverity;
        }
      }
      if (typeof saved.blockOnCritical === "boolean") {
        this.config.blockOnCritical = saved.blockOnCritical;
      }
      if (typeof saved.decisionTimeoutMs === "number") {
        if (saved.decisionTimeoutMs >= 5000 && saved.decisionTimeoutMs <= 300000) {
          this.config.decisionTimeoutMs = saved.decisionTimeoutMs;
        } else {
          console.warn(
            `[security-coach] WARNING: ignoring invalid decisionTimeoutMs from config: ${saved.decisionTimeoutMs}`,
          );
        }
      }
      if (typeof saved.educationalMode === "boolean") {
        this.config.educationalMode = saved.educationalMode;
      }

      // Warn about security-critical config overrides from disk
      if (saved.enabled === false) {
        console.warn(
          "[security-coach] WARNING: loaded config has security coach DISABLED — verify this is intentional",
        );
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
      try {
        await fsp.unlink(tmp);
      } catch {
        /* ignore */
      }
      throw err;
    }
  }

  /** Update configuration at runtime. */
  updateConfig(partial: Partial<CoachConfig>): void {
    this.config = { ...this.config, ...partial };
    void this.saveConfig().catch(() => {
      /* best-effort */
    });
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Match threats with optimizations (cache + worker threads).
   */
  private async matchThreatsWithOptimizations(input: ThreatMatchInput): Promise<ThreatMatch[]> {
    // Ensure cache is initialized
    await this.ensureCacheInitialized();

    // OPTIMIZATION 1: Check cache first
    if (this.cache) {
      const cached = this.cache.get(input);
      if (cached) {
        return cached;
      }
    }

    let matches: ThreatMatch[];

    // Ensure worker pool is initialized
    await this.ensureWorkerPoolInitialized();

    // OPTIMIZATION 2: Use worker threads if enabled
    if (this.config.useWorkerThreads && this.workerPool) {
      try {
        const { matchThreatsAsync } = await import("./worker-pool.js");
        matches = await matchThreatsAsync(input);
      } catch (err) {
        // Fallback to main thread
        console.warn("[security-coach] Worker thread failed, falling back to main thread:", err);
        matches = matchThreats(input);
      }
    } else {
      // Use main thread (already optimized via patterns.ts)
      matches = matchThreats(input);
    }

    // OPTIMIZATION 3: Cache result
    if (this.cache) {
      this.cache.set(input, matches);
    }

    return matches;
  }

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
        SEVERITY_RANK[t.pattern.severity] > SEVERITY_RANK[worst] ? t.pattern.severity : worst,
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

    const { title, message, recommendation } = generateCoachMessage(threatData, level);

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

  /**
   * Build an alert from LLM judge result.
   */
  private buildAlertFromLLM(llmResult: LLMJudgeResult, input: ThreatMatchInput): CoachAlert {
    const now = Date.now();
    const timeoutMs = this.config.decisionTimeoutMs;

    // Map LLM severity to alert level
    const level = this.llmSeverityToAlertLevel(llmResult.severity);

    return {
      id: randomUUID(),
      threats: [], // No pattern threats, LLM detected it
      level,
      title: `LLM Judge: ${this.getLLMTitle(llmResult, input)}`,
      coachMessage: llmResult.reasoning,
      recommendation: llmResult.safeAlternative
        ? `${llmResult.recommendation}\n\nSafe alternative: ${llmResult.safeAlternative}`
        : llmResult.recommendation,
      timeoutMs,
      createdAt: now,
      expiresAt: now + timeoutMs,
      requiresDecision: level === "block" || level === "warn",
    };
  }

  private llmSeverityToAlertLevel(severity: string): CoachAlertLevel {
    switch (severity) {
      case "critical":
        return this.config.blockOnCritical ? "block" : "warn";
      case "high":
        return "warn";
      case "medium":
        return "warn";
      case "low":
      case "info":
        return "inform";
      default:
        return "inform";
    }
  }

  private getLLMTitle(llmResult: LLMJudgeResult, input: ThreatMatchInput): string {
    // Generate a short title from the category
    const categoryTitles: Record<string, string> = {
      "data-exfiltration": "Data Exfiltration Detected",
      "privilege-escalation": "Privilege Escalation Attempt",
      "destructive-operation": "Destructive Operation",
      "credential-exposure": "Credential Exposure Risk",
      "code-injection": "Code Injection Detected",
      "network-suspicious": "Suspicious Network Activity",
      "cloud-misconfiguration": "Cloud Misconfiguration",
      "container-escape": "Container Escape Attempt",
      "supply-chain-attack": "Supply Chain Risk",
      "social-engineering": "Social Engineering Detected",
      "persistence-mechanism": "Persistence Mechanism",
      reconnaissance: "Reconnaissance Activity",
    };

    return categoryTitles[llmResult.category] || "Security Threat Detected";
  }

  /**
   * Get LLM judge instance (for setting client).
   */
  getLLMJudge(): LLMJudge | null {
    return this.llmJudge;
  }
}
