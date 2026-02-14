// ---------------------------------------------------------------------------
// Security Coach — Datadog Logs API Adapter
//
// Formats security coach events for the Datadog Logs API (v2) and builds
// batch payloads ready to be dispatched by the SIEM dispatcher.
//
// API reference: https://docs.datadoghq.com/api/latest/logs/#send-logs
// ---------------------------------------------------------------------------

import { hostname } from "node:os";

import type {
  SiemAdapter,
  SiemEvent,
  SiemDestination,
} from "./dispatcher.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_DATADOG_URL = "https://http-intake.logs.datadoghq.com";
const LOGS_API_PATH = "/api/v2/logs";

// ---------------------------------------------------------------------------
// Severity → Datadog status mapping
// ---------------------------------------------------------------------------

/**
 * Map Security Coach severity levels to Datadog log statuses.
 *
 *   critical → "critical"
 *   high     → "error"
 *   medium   → "warn"
 *   low      → "info"
 *   info     → "debug"
 */
const SEVERITY_TO_STATUS: Record<string, string> = {
  critical: "critical",
  high: "error",
  medium: "warn",
  low: "info",
  info: "debug",
};

function mapSeverityToStatus(severity: string): string {
  return SEVERITY_TO_STATUS[severity.toLowerCase()] ?? "info";
}

// ---------------------------------------------------------------------------
// Tag builder
// ---------------------------------------------------------------------------

/**
 * Build the `ddtags` string from an event.
 *
 * Always includes baseline tags (`env:production`, `service:openclaw`,
 * `security_coach:true`). Adds `severity:<value>` and `category:<value>`
 * when present, then appends any explicit `event.tags`.
 *
 * Result is a comma-separated `key:value` string per the Datadog convention.
 */
function buildDdTags(event: SiemEvent): string {
  const tags: string[] = [
    "env:production",
    "service:openclaw",
    "security_coach:true",
  ];

  if (event.severity) {
    tags.push(`severity:${event.severity}`);
  }
  if (event.category) {
    tags.push(`category:${event.category}`);
  }

  if (event.tags) {
    for (const tag of event.tags) {
      tags.push(tag);
    }
  }

  return tags.join(",");
}

// ---------------------------------------------------------------------------
// URL resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the intake URL for the Datadog Logs API.
 *
 * If the destination URL already contains a pathname (anything beyond `/`),
 * it is used as-is. Otherwise `/api/v2/logs` is appended.
 */
function resolveUrl(destination: SiemDestination): string {
  const base = destination.url || DEFAULT_DATADOG_URL;

  try {
    const parsed = new URL(base);
    // If the path is empty or just "/", append the logs API path.
    if (parsed.pathname === "/" || parsed.pathname === "") {
      return base.replace(/\/+$/, "") + LOGS_API_PATH;
    }
    return base;
  } catch {
    // If the URL is malformed, append the path and hope for the best.
    return base.replace(/\/+$/, "") + LOGS_API_PATH;
  }
}

// ---------------------------------------------------------------------------
// Format a single event
// ---------------------------------------------------------------------------

/**
 * Convert a `SiemEvent` into the Datadog JSON log object shape.
 */
function formatEvent(event: SiemEvent): Record<string, unknown> {
  const log: Record<string, unknown> = {
    ddsource: "openclaw-security-coach",
    ddtags: buildDdTags(event),
    hostname: event.host ?? hostname(),
    message: `Security Coach: ${event.title ?? event.eventType}`,
    service: "openclaw-security-coach",
    status: mapSeverityToStatus(event.severity),
    event_type: event.eventType,
    severity: event.severity,
  };

  // Conditionally attach optional fields so we don't send `undefined` values.
  if (event.alertId !== undefined) {
    log.alert_id = event.alertId;
  }
  if (event.category !== undefined) {
    log.category = event.category;
  }
  if (event.decision !== undefined) {
    log.decision = event.decision;
  }
  if (event.resolvedBy !== undefined) {
    log.resolved_by = event.resolvedBy;
  }
  if (event.patternId !== undefined) {
    log.pattern_id = event.patternId;
  }
  if (event.threats !== undefined && event.threats.length > 0) {
    log.threats = event.threats;
  }
  if (event.context !== undefined) {
    log.context = event.context;
  }
  if (event.timestamp !== undefined) {
    log.timestamp = event.timestamp;
  }

  return log;
}

// ---------------------------------------------------------------------------
// Public factory
// ---------------------------------------------------------------------------

/**
 * Create a Datadog Logs API adapter for the SIEM dispatcher.
 *
 * The returned adapter formats events per the Datadog v2 Logs API spec and
 * builds batch payloads (JSON arrays) with the appropriate headers.
 */
export function createDatadogAdapter(destination: SiemDestination): SiemAdapter {
  const url = resolveUrl(destination);

  return {
    name: "datadog",

    formatEvent(event: SiemEvent): unknown {
      return formatEvent(event);
    },

    formatBatch(events: SiemEvent[]): {
      url: string;
      headers: Record<string, string>;
      body: string;
    } {
      const logs = events.map((e) => formatEvent(e));

      return {
        url,
        headers: {
          "DD-API-KEY": destination.token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logs),
      };
    },
  };
}
