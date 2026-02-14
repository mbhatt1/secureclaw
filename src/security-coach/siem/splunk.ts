// ---------------------------------------------------------------------------
// SIEM Adapter — Splunk HEC (HTTP Event Collector)
//
// Formats security-coach events for ingestion via the Splunk HEC JSON
// endpoint (`/services/collector/event`).  Each event is wrapped in the
// standard HEC envelope with epoch-second timestamps, and batches are
// encoded as newline-delimited JSON (no array wrapper).
//
// Reference:
//   https://docs.splunk.com/Documentation/Splunk/latest/Data/FormateventsforHTTPEventCollector
// ---------------------------------------------------------------------------

import type { SiemAdapter, SiemDestination, SiemEvent } from "./dispatcher.js";

// ---------------------------------------------------------------------------
// Severity Mapping
// ---------------------------------------------------------------------------

/**
 * Map security-coach severity strings to Splunk numeric severity values.
 *
 * Splunk uses a 1-10 scale where lower numbers are more severe:
 *   critical → 1, high → 2, medium → 4, low → 6, info → 8
 */
const SEVERITY_MAP: Record<string, number> = {
  critical: 1,
  high: 2,
  medium: 4,
  low: 6,
  info: 8,
};

function mapSeverity(severity: string): number {
  return SEVERITY_MAP[severity.toLowerCase()] ?? 8;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert an ISO 8601 timestamp to a Unix epoch in seconds with millisecond
 * precision (e.g. `1694000000.123`).  Returns the current time if the input
 * cannot be parsed.
 */
function toEpochSeconds(isoTimestamp: string): number {
  const ms = Date.parse(isoTimestamp);
  if (Number.isNaN(ms)) {
    return Date.now() / 1000;
  }
  // Round to 3 decimal places (millisecond precision).
  return Math.round((ms / 1000) * 1000) / 1000;
}

/**
 * Ensure the destination URL ends with the HEC event endpoint path.
 * If the URL already contains `/services/collector`, it is returned as-is.
 */
function resolveHecUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  if (trimmed.includes("/services/collector")) {
    return trimmed;
  }
  return `${trimmed}/services/collector/event`;
}

// ---------------------------------------------------------------------------
// HEC Event Formatting
// ---------------------------------------------------------------------------

/**
 * Build a Splunk HEC envelope for a single {@link SiemEvent}.
 *
 * The returned object is the top-level JSON that HEC expects:
 * ```json
 * {
 *   "time": 1694000000.123,
 *   "host": "machine-name",
 *   "source": "openclaw-security-coach",
 *   "sourcetype": "_json",
 *   "index": "main",
 *   "event": { ... }
 * }
 * ```
 */
function formatHecEvent(event: SiemEvent): Record<string, unknown> {
  // Build the inner `event` payload — include all meaningful fields from the
  // SiemEvent, omitting undefined values so the JSON stays clean.
  const inner: Record<string, unknown> = {
    eventType: event.eventType,
    severity: event.severity,
    splunkSeverity: mapSeverity(event.severity),
  };

  if (event.alertId !== undefined) inner.alertId = event.alertId;
  if (event.title !== undefined) inner.title = event.title;
  if (event.message !== undefined) inner.message = event.message;
  if (event.decision !== undefined) inner.decision = event.decision;
  if (event.resolvedBy !== undefined) inner.resolvedBy = event.resolvedBy;
  if (event.category !== undefined) inner.category = event.category;
  if (event.patternId !== undefined) inner.patternId = event.patternId;
  if (event.threats !== undefined) inner.threats = event.threats;
  if (event.context !== undefined) inner.context = event.context;
  if (event.tags !== undefined) inner.tags = event.tags;

  return {
    time: toEpochSeconds(event.timestamp),
    host: event.host ?? "unknown",
    source: event.source,
    sourcetype: "_json",
    index: "main",
    event: inner,
  };
}

// ---------------------------------------------------------------------------
// Adapter Factory
// ---------------------------------------------------------------------------

/**
 * Create a {@link SiemAdapter} that targets a Splunk HEC endpoint.
 *
 * @param destination - The SIEM destination configuration for Splunk.
 * @returns A `SiemAdapter` whose `formatBatch` produces newline-delimited
 *          HEC JSON suitable for `POST /services/collector/event`.
 */
export function createSplunkAdapter(destination: SiemDestination): SiemAdapter {
  const hecUrl = resolveHecUrl(destination.url);

  return {
    name: "splunk",

    /**
     * Format a single event into the Splunk HEC envelope structure.
     */
    formatEvent(event: SiemEvent): unknown {
      return formatHecEvent(event);
    },

    /**
     * Format a batch of events for a single HEC HTTP request.
     *
     * Splunk HEC accepts multiple events in one request as
     * newline-delimited JSON objects (no array wrapper, no trailing
     * newline required — but one is harmless and keeps concat simple).
     */
    formatBatch(events: SiemEvent[]): {
      url: string;
      headers: Record<string, string>;
      body: string;
    } {
      const body = events
        .map((e) => JSON.stringify(formatHecEvent(e)))
        .join("\n");

      return {
        url: hecUrl,
        headers: {
          Authorization: `Splunk ${destination.token}`,
          "Content-Type": "application/json",
        },
        body,
      };
    },
  };
}
