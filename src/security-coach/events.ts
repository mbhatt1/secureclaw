// ─── Gateway Broadcast Events ───────────────────────────────────────────

/** Broadcast when the security coach detects a threat and needs user input */
export type SecurityCoachAlertEvent = {
  id: string;
  level: "block" | "warn" | "inform";
  title: string;
  coachMessage: string;
  recommendation: string;
  threats: Array<{
    patternId: string;
    category: string;
    severity: string;
    title: string;
    coaching: string;
  }>;
  requiresDecision: boolean;
  createdAtMs: number;
  expiresAtMs: number;
  context?: {
    toolName?: string;
    command?: string;
    agentId?: string;
    sessionKey?: string;
    /** Integration channel (e.g. "whatsapp", "slack", "discord"). */
    channelId?: string;
    /** Sender identifier for inbound channel messages. */
    senderId?: string;
    /** Sender display name for inbound channel messages. */
    senderName?: string;
    /** Conversation / chat ID. */
    conversationId?: string;
  };
};

/** Broadcast when the user resolves a security coach alert */
export type SecurityCoachResolvedEvent = {
  id: string;
  decision: "allow-once" | "allow-always" | "deny" | "learn-more";
  resolvedBy?: string | null;
  ts: number;
};

/** Broadcast for educational/info coaching tips (non-blocking) */
export type SecurityCoachTipEvent = {
  id: string;
  title: string;
  message: string;
  category: string;
  severity: string;
  autoDismissMs: number;
};

/** Broadcast for security coach status updates */
export type SecurityCoachStatusEvent = {
  enabled: boolean;
  alertsBlocked: number;
  alertsAllowed: number;
  rulesCount: number;
  lastAlertAt: number | null;
};

// ─── Event Names (Constants) ────────────────────────────────────────────

export const SECURITY_COACH_EVENTS = {
  ALERT_REQUESTED: "security.coach.alert.requested",
  ALERT_RESOLVED: "security.coach.alert.resolved",
  TIP: "security.coach.tip",
  STATUS: "security.coach.status",
  COACH_SPEAK: "security.coach.speak",
} as const;

// ─── Coach Character States ─────────────────────────────────────────────

export type CoachCharacterState =
  | "idle" // Normal state, small and unobtrusive
  | "alert" // Attention needed - bouncing/glowing
  | "blocking" // Actively blocking something dangerous
  | "coaching" // Speaking/teaching the user
  | "celebrating" // User made a good security decision
  | "thinking" // Analyzing something
  | "sleeping"; // Coach is disabled/paused

export type SecurityCoachSpeakEvent = {
  characterState: CoachCharacterState;
  message: string;
  /** Speech bubble style */
  bubbleStyle: "speech" | "thought" | "alert" | "tip";
  /** Auto-dismiss timeout (0 = manual dismiss) */
  autoDismissMs: number;
  /** Action buttons to show */
  actions?: Array<{
    label: string;
    action: string;
    style: "primary" | "secondary" | "danger";
  }>;
};

// ─── RPC Method Params ──────────────────────────────────────────────────

/** Params for security.coach.resolve RPC method */
export type SecurityCoachResolveParams = {
  id: string;
  decision: "allow-once" | "allow-always" | "deny" | "learn-more";
};

/** Params for security.coach.config.get RPC method */
export type SecurityCoachConfigGetParams = Record<string, never>;

/** Params for security.coach.config.update RPC method */
export type SecurityCoachConfigUpdateParams = {
  enabled?: boolean;
  minSeverity?: string;
  blockOnCritical?: boolean;
  decisionTimeoutMs?: number;
  educationalMode?: boolean;
};

/** Params for security.coach.rules.list RPC method */
export type SecurityCoachRulesListParams = Record<string, never>;

/** Params for security.coach.rules.delete RPC method */
export type SecurityCoachRulesDeleteParams = {
  ruleId: string;
};

/** Params for security.coach.status RPC method */
export type SecurityCoachStatusParams = Record<string, never>;
