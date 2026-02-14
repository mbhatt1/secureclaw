// ---------------------------------------------------------------------------
// Security Coach — Microsoft Sentinel (Azure Monitor) SIEM Adapter
//
// Formats security coach events for the Azure Monitor Logs Ingestion API
// using Data Collection Rules (DCR) and custom log tables.
//
// Reference:
//   https://learn.microsoft.com/en-us/azure/azure-monitor/logs/logs-ingestion-api-overview
//
// Log Analytics naming conventions:
//   _s  = string
//   _g  = GUID
//   _d  = number / double
//   _b  = boolean
//   _t  = datetime
// ---------------------------------------------------------------------------

import type { SiemAdapter, SiemDestination, SiemEvent } from "./dispatcher.js";

// ---------------------------------------------------------------------------
// Sentinel severity mapping
// ---------------------------------------------------------------------------

/**
 * Map severity labels to Sentinel numeric severity levels.
 *
 *   critical -> 1
 *   high     -> 2
 *   medium   -> 3
 *   low      -> 4
 *   info     -> 5
 */
const SEVERITY_LEVEL: Record<string, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
  info: 5,
};

// ---------------------------------------------------------------------------
// Log entry type
// ---------------------------------------------------------------------------

/**
 * Shape of a single log entry sent to the Logs Ingestion API.
 *
 * Field suffixes follow the Log Analytics custom log naming convention so
 * Azure will index them with the correct data type.
 */
type SentinelLogEntry = {
  TimeGenerated: string;
  Computer: string;
  EventType_s: string;
  Severity_s: string;
  Severity_d: number;
  AlertId_g: string;
  Title_s: string;
  Message_s: string;
  Decision_s: string;
  ResolvedBy_s: string;
  Category_s: string;
  PatternId_s: string;
  Source_s: string;
  Threats_s: string;
  Context_s: string;
  Tags_s: string;
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Convert a single `SiemEvent` into a Sentinel custom-log record.
 */
function formatSentinelEntry(event: SiemEvent): SentinelLogEntry {
  return {
    TimeGenerated: event.timestamp,
    Computer: event.host ?? "",
    EventType_s: event.eventType,
    Severity_s: event.severity,
    Severity_d: SEVERITY_LEVEL[event.severity] ?? 5,
    AlertId_g: event.alertId ?? "",
    Title_s: event.title ?? "",
    Message_s: event.message ?? "",
    Decision_s: event.decision ?? "",
    ResolvedBy_s: event.resolvedBy ?? "",
    Category_s: event.category ?? "",
    PatternId_s: event.patternId ?? "",
    Source_s: event.source,
    Threats_s: event.threats ? JSON.stringify(event.threats) : "",
    Context_s: event.context ? JSON.stringify(event.context) : "",
    Tags_s: event.tags ? event.tags.join(",") : "",
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a Microsoft Sentinel adapter that formats events for the Azure
 * Monitor Logs Ingestion API.
 *
 * The `destination.url` should be the full Data Collection Endpoint URL
 * including the DCR rule ID, stream name, and api-version query parameter,
 * e.g.:
 *
 *   https://<dce>.ingest.monitor.azure.com/dataCollectionRules/<ruleId>/streams/<streamName>?api-version=2023-01-01
 *
 * The `destination.token` is a Bearer token (typically obtained via Azure AD
 * / Entra ID OAuth2 client-credentials flow).
 */
export function createSentinelAdapter(destination: SiemDestination): SiemAdapter {
  return {
    name: "sentinel",

    formatEvent(event: SiemEvent): SentinelLogEntry {
      return formatSentinelEntry(event);
    },

    formatBatch(events: SiemEvent[]): {
      url: string;
      headers: Record<string, string>;
      body: string;
    } {
      const entries = events.map(formatSentinelEntry);

      return {
        url: destination.url,
        headers: {
          Authorization: `Bearer ${destination.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entries),
      };
    },
  };
}
