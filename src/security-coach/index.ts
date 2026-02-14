// ---------------------------------------------------------------------------
// Security Coach — Barrel Export
// ---------------------------------------------------------------------------

export { SecurityCoachEngine, DEFAULT_COACH_CONFIG } from "./engine.js";
export type { CoachAlert, CoachAlertLevel, CoachConfig, CoachDecision } from "./engine.js";

export { SecurityCoachRuleStore } from "./rules.js";
export type { SecurityCoachRule, RuleDecision, RulesFile } from "./rules.js";

export { matchThreats, THREAT_PATTERNS } from "./patterns.js";
export type {
  ThreatCategory,
  ThreatMatch,
  ThreatMatchInput,
  ThreatPattern,
  ThreatSeverity,
} from "./patterns.js";

export { SECURITY_COACH_EVENTS } from "./events.js";
export type {
  SecurityCoachAlertEvent,
  SecurityCoachResolvedEvent,
  SecurityCoachTipEvent,
  SecurityCoachStatusEvent,
  SecurityCoachSpeakEvent,
  CoachCharacterState,
  SecurityCoachResolveParams,
  SecurityCoachConfigGetParams,
  SecurityCoachConfigUpdateParams,
  SecurityCoachRulesListParams,
  SecurityCoachRulesDeleteParams,
  SecurityCoachStatusParams,
} from "./events.js";

export { createSecurityCoachHooks, extractCommand, extractFilePath, extractUrl } from "./hooks.js";
export type { SecurityCoachHooks, SecurityCoachBroadcastFn } from "./hooks.js";

export { setGlobalSecurityCoachHooks, getGlobalSecurityCoachHooks } from "./global.js";

export {
  generateCoachMessage,
  generateCelebration,
  generateTip,
  getCharacterState,
  getIdleQuip,
  COACH_PERSONALITY,
} from "./persona.js";
export type { CoachPersonality } from "./persona.js";

export { runHygieneCheck, broadcastHygieneFindings } from "./hygiene.js";
export type { HygieneFinding, HygieneCategory, HygieneScanInput } from "./hygiene.js";

// Enterprise modules
export { SecurityCoachAuditLog } from "./audit.js";
export type { AuditEntry } from "./audit.js";
export {
  auditAlertCreated,
  auditAlertResolved,
  auditAlertExpired,
  auditAutoDecision,
  auditRuleCreated,
  auditRuleDeleted,
  auditConfigUpdated,
  auditHygieneScan,
} from "./audit.js";

export { AlertThrottle, DEFAULT_THROTTLE_CONFIG, buildContextKey } from "./throttle.js";
export type { ThrottleConfig, ThrottleStats } from "./throttle.js";

export { CoachMetrics } from "./metrics.js";
export type { CoachMetricsSnapshot } from "./metrics.js";

export { AlertHistoryStore } from "./history.js";
export type { AlertHistoryEntry } from "./history.js";

export { SiemDispatcher, createSiemEvent, createAlertSiemEvent, createDecisionSiemEvent } from "./siem/dispatcher.js";
export type { SiemEvent, SiemDestination, SiemConfig, SiemAdapter, SiemDispatcherStats } from "./siem/dispatcher.js";

export { createSplunkAdapter } from "./siem/splunk.js";
export { createDatadogAdapter } from "./siem/datadog.js";
export { createSentinelAdapter } from "./siem/sentinel.js";

export {
  exportRules,
  exportConfig,
  exportAll,
  serializeBundle,
  exportToFile,
  parseBundle,
  importFromFile,
  validateBundle,
  mergeRules,
  ExportValidationError,
} from "./export.js";
export type { ExportBundle } from "./export.js";
