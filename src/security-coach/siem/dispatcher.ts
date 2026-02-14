// ---------------------------------------------------------------------------
// Security Coach — SIEM Dispatcher
//
// Routing layer that receives security events from the coach and forwards
// them to external SIEM systems (Splunk, Datadog, Microsoft Sentinel).
// Events are batched per destination and flushed on size or time thresholds.
// All errors are swallowed and reported via an optional `onError` callback —
// the dispatcher never throws.
// ---------------------------------------------------------------------------

import { hostname } from "node:os";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SiemEvent = {
  timestamp: string; // ISO 8601
  eventType: string; // "security.coach.alert" | "security.coach.decision" | "security.coach.hygiene" etc.
  severity: string; // critical | high | medium | low | info
  source: "secureclaw-security-coach";
  host?: string; // machine hostname
  alertId?: string;
  title?: string;
  message?: string;
  decision?: string;
  resolvedBy?: string;
  category?: string;
  patternId?: string;
  threats?: Array<{
    patternId: string;
    category: string;
    severity: string;
    title: string;
  }>;
  context?: Record<string, unknown>;
  tags?: string[];
};

export type SiemDestination = {
  type: "splunk" | "datadog" | "sentinel";
  enabled: boolean;
  /** Endpoint URL */
  url: string;
  /** Auth token / API key */
  token: string;
  /** Optional: only forward events matching these severities */
  severityFilter?: string[];
  /** Optional: only forward these event types */
  eventTypeFilter?: string[];
  /** Batch size before flushing (default: 10) */
  batchSize?: number;
  /** Max time before flushing batch (ms, default: 5000) */
  flushIntervalMs?: number;
};

export type SiemConfig = {
  enabled: boolean;
  destinations: SiemDestination[];
  /** Include full threat details in events (default: true) */
  includeDetails: boolean;
  /** Include alert context (tool, command, channel info) */
  includeContext: boolean;
};

export type SiemAdapter = {
  name: string;
  formatEvent(event: SiemEvent): unknown;
  formatBatch(
    events: SiemEvent[],
  ): { url: string; headers: Record<string, string>; body: string };
};

export type SiemDispatcherStats = {
  eventsDispatched: number;
  eventsDropped: number;
  batchesSent: number;
  batchesFailed: number;
  lastDispatchAtMs: number;
  lastErrorAtMs: number;
  lastError?: string;
  perDestination: Record<
    string,
    { sent: number; failed: number; queued: number }
  >;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Build a stable key for a destination so we can maintain per-dest state. */
function destKey(dest: SiemDestination): string {
  return `${dest.type}::${dest.url}`;
}

/** Default hostname, resolved once at module load. */
const LOCAL_HOST = hostname();

/** Retry delay for failed batch delivery (ms). */
const RETRY_DELAY_MS = 5_000;

/** Maximum events per destination queue (prevents unbounded memory growth). */
const MAX_QUEUE_SIZE = 1_000;

// ---------------------------------------------------------------------------
// Destination Queue
// ---------------------------------------------------------------------------

type DestinationQueue = {
  dest: SiemDestination;
  events: SiemEvent[];
  timer: ReturnType<typeof setTimeout> | null;
  stats: { sent: number; failed: number };
};

// ---------------------------------------------------------------------------
// SiemDispatcher
// ---------------------------------------------------------------------------

export class SiemDispatcher {
  private config: SiemConfig;
  private adapters: Map<string, SiemAdapter> = new Map();
  private adapterFactories: Map<string, (dest: SiemDestination) => SiemAdapter> = new Map();
  private queues: Map<string, DestinationQueue> = new Map();
  private stats: SiemDispatcherStats;
  private stopped = false;

  /** Optional error callback — receives errors instead of throwing. */
  onError?: (error: Error, context?: string) => void;

  constructor(config: SiemConfig) {
    this.config = { ...config, destinations: [...config.destinations] };
    this.stats = {
      eventsDispatched: 0,
      eventsDropped: 0,
      batchesSent: 0,
      batchesFailed: 0,
      lastDispatchAtMs: 0,
      lastErrorAtMs: 0,
      perDestination: {},
    };

    this.initQueues();
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /** Register a SIEM adapter instance (splunk, datadog, sentinel). */
  registerAdapter(type: string, adapter: SiemAdapter): void {
    this.adapters.set(type, adapter);
  }

  /**
   * Register an adapter factory for a destination type.
   *
   * Unlike `registerAdapter` (which registers a fixed instance), a factory
   * creates a fresh adapter from the destination's actual URL and token each
   * time a batch is flushed.  This is the preferred registration method when
   * destinations may be configured at runtime.
   */
  registerAdapterFactory(type: string, factory: (dest: SiemDestination) => SiemAdapter): void {
    this.adapterFactories.set(type, factory);
  }

  /**
   * Queue an event for delivery to all enabled destinations.
   *
   * Events are filtered per-destination by severity and event type before
   * being added to the queue. If the global config is disabled or the
   * dispatcher has been shut down, the event is silently dropped.
   */
  dispatch(event: SiemEvent): void {
    if (!this.config.enabled || this.stopped) {
      return;
    }

    this.stats.eventsDispatched++;
    this.stats.lastDispatchAtMs = Date.now();

    for (const [key, queue] of this.queues) {
      const { dest } = queue;
      if (!dest.enabled) continue;

      // Severity filter
      if (
        dest.severityFilter &&
        dest.severityFilter.length > 0 &&
        !dest.severityFilter.includes(event.severity)
      ) {
        continue;
      }

      // Event type filter
      if (
        dest.eventTypeFilter &&
        dest.eventTypeFilter.length > 0 &&
        !dest.eventTypeFilter.includes(event.eventType)
      ) {
        continue;
      }

      if (queue.events.length >= MAX_QUEUE_SIZE) {
        this.stats.eventsDropped++;
        continue; // Drop the event — queue is full
      }

      queue.events.push(event);

      const batchSize = dest.batchSize ?? 10;
      if (queue.events.length >= batchSize) {
        // Flush immediately — batch is full.
        void this.flushQueue(key);
      } else if (!queue.timer) {
        // Start the flush timer.
        const interval = dest.flushIntervalMs ?? 5_000;
        queue.timer = setTimeout(() => {
          void this.flushQueue(key);
        }, interval);
      }
    }
  }

  /** Force-flush all pending batches. */
  async flush(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const key of this.queues.keys()) {
      promises.push(this.flushQueue(key));
    }
    await Promise.all(promises);
  }

  /** Flush all pending batches and stop all timers. */
  async shutdown(): Promise<void> {
    this.stopped = true;
    await Promise.race([
      this.flush(),
      new Promise<void>((resolve) => setTimeout(resolve, 15_000)),
    ]);

    // Clear any remaining timers (safety net).
    for (const queue of this.queues.values()) {
      if (queue.timer) {
        clearTimeout(queue.timer);
        queue.timer = null;
      }
    }
  }

  /** Return current dispatcher statistics. */
  getStats(): SiemDispatcherStats {
    // Rebuild perDestination with live queue sizes.
    const perDestination: SiemDispatcherStats["perDestination"] = {};
    for (const [key, queue] of this.queues) {
      perDestination[key] = {
        sent: queue.stats.sent,
        failed: queue.stats.failed,
        queued: queue.events.length,
      };
    }

    return { ...this.stats, perDestination };
  }

  /** Update the dispatcher configuration at runtime. */
  updateConfig(config: Partial<SiemConfig>): void {
    if (config.destinations !== undefined) {
      this.config.destinations = [...config.destinations];
    }
    if (config.enabled !== undefined) {
      this.config.enabled = config.enabled;
    }
    if (config.includeDetails !== undefined) {
      this.config.includeDetails = config.includeDetails;
    }
    if (config.includeContext !== undefined) {
      this.config.includeContext = config.includeContext;
    }

    // Re-initialize queues so new destinations get picked up and removed
    // destinations are flushed.
    this.initQueues();
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  /** Initialize (or re-initialize) per-destination queues. */
  private initQueues(): void {
    const activeKeys = new Set<string>();

    for (const dest of this.config.destinations) {
      const key = destKey(dest);
      activeKeys.add(key);

      if (!this.queues.has(key)) {
        this.queues.set(key, {
          dest,
          events: [],
          timer: null,
          stats: { sent: 0, failed: 0 },
        });
      } else {
        // Update the destination reference (config may have changed).
        const existing = this.queues.get(key)!;
        existing.dest = dest;
      }
    }

    // Clean up queues for removed destinations.
    for (const [key, queue] of this.queues) {
      if (!activeKeys.has(key)) {
        if (queue.timer) {
          clearTimeout(queue.timer);
        }
        this.queues.delete(key);
      }
    }
  }

  /**
   * Flush a single destination queue.
   *
   * On failure, retries once after {@link RETRY_DELAY_MS}. If the retry
   * also fails, the batch is dropped and the error is logged.
   */
  private async flushQueue(key: string): Promise<void> {
    const queue = this.queues.get(key);
    if (!queue || queue.events.length === 0) return;

    // Clear the timer.
    if (queue.timer) {
      clearTimeout(queue.timer);
      queue.timer = null;
    }

    // Drain the queue.
    const batch = queue.events.splice(0);

    // Prefer a factory (creates an adapter with the destination's actual
    // URL/token) over a fixed adapter instance.
    const factory = this.adapterFactories.get(queue.dest.type);
    const adapter = factory
      ? factory(queue.dest)
      : this.adapters.get(queue.dest.type);

    if (!adapter) {
      this.recordError(
        new Error(
          `No adapter registered for SIEM type "${queue.dest.type}"`,
        ),
        key,
      );
      this.stats.eventsDropped += batch.length;
      queue.stats.failed += batch.length;
      return;
    }

    const sendBatch = async (): Promise<boolean> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      try {
        const { url, headers, body } = adapter.formatBatch(batch);

        // Use the destination URL as the base — the adapter may override.
        const targetUrl = url || queue.dest.url;

        const response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            ...headers,
            "User-Agent": "secureclaw-security-coach-siem/1.0",
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `SIEM delivery failed: ${response.status} ${response.statusText}`,
          );
        }

        return true;
      } catch (err) {
        clearTimeout(timeoutId);
        return false;
      }
    };

    // First attempt.
    const ok = await sendBatch();
    if (ok) {
      this.stats.batchesSent++;
      queue.stats.sent += batch.length;
      return;
    }

    // Retry once after delay.
    await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS));

    const retryOk = await sendBatch();
    if (retryOk) {
      this.stats.batchesSent++;
      queue.stats.sent += batch.length;
      return;
    }

    // Both attempts failed — drop the batch.
    this.stats.batchesFailed++;
    this.stats.eventsDropped += batch.length;
    queue.stats.failed += batch.length;
    this.recordError(
      new Error(
        `Failed to deliver batch of ${batch.length} event(s) to ${queue.dest.type} at ${queue.dest.url} after retry`,
      ),
      key,
    );
  }

  /** Record an error in stats and notify the callback. */
  private recordError(error: Error, context?: string): void {
    this.stats.lastErrorAtMs = Date.now();
    this.stats.lastError = error.message;

    try {
      this.onError?.(error, context);
    } catch {
      // Swallow callback errors — the dispatcher must never throw.
    }
  }
}

// ---------------------------------------------------------------------------
// Event Factory Helpers
// ---------------------------------------------------------------------------

/** Strip potentially sensitive fields from SIEM event context. */
function sanitizeContext(ctx: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!ctx) return ctx;
  const sanitized = { ...ctx };
  // Remove fields that may contain secrets
  delete sanitized.command;
  delete sanitized.content;
  delete sanitized.params;
  delete sanitized.sessionKey;
  // Keep safe metadata
  // toolName, agentId, channelId, direction are safe to send
  return sanitized;
}

/**
 * Convenience factory for creating a generic SIEM event.
 */
export function createSiemEvent(opts: {
  eventType: string;
  severity: string;
  alertId?: string;
  title?: string;
  message?: string;
  decision?: string;
  resolvedBy?: string;
  category?: string;
  patternId?: string;
  threats?: Array<{
    patternId: string;
    category: string;
    severity: string;
    title: string;
  }>;
  context?: Record<string, unknown>;
  tags?: string[];
}): SiemEvent {
  return {
    timestamp: new Date().toISOString(),
    eventType: opts.eventType,
    severity: opts.severity,
    source: "secureclaw-security-coach",
    host: LOCAL_HOST,
    alertId: opts.alertId,
    title: opts.title,
    message: opts.message,
    decision: opts.decision,
    resolvedBy: opts.resolvedBy,
    category: opts.category,
    patternId: opts.patternId,
    threats: opts.threats,
    context: sanitizeContext(opts.context),
    tags: opts.tags,
  };
}

/**
 * Create a SIEM event from a security coach alert.
 *
 * Maps the coach's internal alert structure to the flat SIEM event format
 * suitable for forwarding to Splunk / Datadog / Sentinel.
 */
export function createAlertSiemEvent(
  alert: {
    id: string;
    level: string;
    title: string;
    threats: Array<{
      patternId: string;
      category: string;
      severity: string;
      title: string;
    }>;
    coachMessage?: string;
    recommendation?: string;
  },
  context?: Record<string, unknown>,
): SiemEvent {
  // Derive the overall severity from the alert level.
  const severityMap: Record<string, string> = {
    block: "critical",
    warn: "high",
    inform: "medium",
  };
  const severity = severityMap[alert.level] ?? "medium";

  // Pick the top-level category from the first threat (if any).
  const topThreat = alert.threats[0];

  return createSiemEvent({
    eventType: "security.coach.alert",
    severity,
    alertId: alert.id,
    title: alert.title,
    message: alert.coachMessage,
    category: topThreat?.category,
    patternId: topThreat?.patternId,
    threats: alert.threats,
    context,
    tags: [
      `level:${alert.level}`,
      `severity:${severity}`,
      ...(topThreat ? [`category:${topThreat.category}`] : []),
    ],
  });
}

/**
 * Create a SIEM event for an alert decision / resolution.
 */
export function createDecisionSiemEvent(
  alertId: string,
  decision: string,
  resolvedBy?: string,
): SiemEvent {
  return createSiemEvent({
    eventType: "security.coach.decision",
    severity: "info",
    alertId,
    decision,
    resolvedBy,
    title: `Alert ${alertId} resolved: ${decision}`,
    tags: [`decision:${decision}`],
  });
}
