import { html, nothing } from "lit";
import type { AppViewState } from "../app-view-state.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** State slice that the security-coach controller will merge into AppViewState. */
export type SecurityCoachViewState = {
  securityCoachEnabled: boolean;
  securityCoachAlerts: SecurityCoachAlertUI[];
  securityCoachBusy: boolean;
  securityCoachError: string | null;
  securityCoachCharacterState: string;
  securityCoachSpeech: {
    message: string;
    style: string;
    autoDismissMs: number;
  } | null;
  securityCoachMinimized: boolean;
  securityCoachStats: {
    alertsBlocked: number;
    alertsAllowed: number;
    rulesCount: number;
  } | null;
  handleSecurityCoachDecision: (alertId: string, decision: string) => void;
  handleSecurityCoachToggle: (minimized: boolean) => void;
  handleSecurityCoachDismiss: (alertId: string) => void;
};

export type SecurityCoachAlertUI = {
  id: string;
  level: "block" | "warn" | "inform";
  title: string;
  coachMessage: string;
  recommendation: string;
  requiresDecision: boolean;
  createdAtMs: number;
  expiresAtMs: number;
  threats: Array<{
    patternId: string;
    category: string;
    severity: string;
    title: string;
    coaching: string;
  }>;
  context?: {
    toolName?: string;
    command?: string;
    agentId?: string;
    sessionKey?: string;
    channelId?: string;
    senderId?: string;
    senderName?: string;
    conversationId?: string;
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRemaining(ms: number): string {
  const remaining = Math.max(0, ms);
  const totalSeconds = Math.floor(remaining / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}

function severityLabel(level: SecurityCoachAlertUI["level"]): string {
  switch (level) {
    case "block":
      return "Blocked";
    case "warn":
      return "Warning";
    case "inform":
      return "Info";
  }
}

// ---------------------------------------------------------------------------
// Sub-renderers
// ---------------------------------------------------------------------------

type CoachState = AppViewState & Partial<SecurityCoachViewState>;

function renderMinimizedCoach(state: CoachState, alertCount: number) {
  return html`
    <div
      class="security-coach security-coach--minimized"
      @click=${() => state.handleSecurityCoachToggle?.(false)}
      role="button"
      tabindex="0"
      aria-label="Expand security coach"
    >
      <div class="coach-character coach-character--minimized">
        <svg
          class="coach-shield-icon"
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      ${alertCount > 0
        ? html`<span class="coach-badge">${alertCount}</span>`
        : nothing}
    </div>
  `;
}

function renderThreatDetails(threats: SecurityCoachAlertUI["threats"]) {
  if (!threats.length) {
    return nothing;
  }
  return html`
    <details class="coach-threat-details">
      <summary>Threat details (${threats.length})</summary>
      <ul class="coach-threat-list">
        ${threats.map(
          (t) => html`
            <li class="coach-threat-item">
              <div class="coach-threat-header">
                <span class="coach-threat-title">${t.title}</span>
                <span class="coach-threat-severity">${t.severity}</span>
              </div>
              <div class="coach-threat-category">${t.category}</div>
              <div class="coach-threat-coaching">${t.coaching}</div>
            </li>
          `,
        )}
      </ul>
    </details>
  `;
}

function renderAlertContext(context: SecurityCoachAlertUI["context"]) {
  if (!context) {
    return nothing;
  }
  const rows: Array<{ label: string; value: string | undefined }> = [
    { label: "Channel", value: context.channelId },
    { label: "From", value: context.senderName },
    { label: "Chat", value: context.conversationId },
    { label: "Tool", value: context.toolName },
    { label: "Command", value: context.command },
    { label: "Agent", value: context.agentId },
    { label: "Session", value: context.sessionKey },
  ];
  const visible = rows.filter((r) => r.value);
  if (!visible.length) {
    return nothing;
  }
  return html`
    <div class="coach-alert-context">
      ${visible.map(
        (r) => html`
          <div class="coach-context-row">
            <span class="coach-context-label">${r.label}</span>
            <span class="coach-context-value mono">${r.value}</span>
          </div>
        `,
      )}
    </div>
  `;
}

function renderBlockingAlert(
  state: CoachState,
  alert: SecurityCoachAlertUI,
  queueCount: number,
) {
  const remainingMs = alert.expiresAtMs - Date.now();
  const remaining =
    remainingMs > 0
      ? `expires in ${formatRemaining(remainingMs)}`
      : "expired";
  const busy = state.securityCoachBusy ?? false;

  return html`
    <div class="coach-overlay" role="dialog" aria-modal="true" aria-live="polite">
      <div class="coach-alert-card coach-severity--block">
        <div class="coach-alert-header">
          <div class="coach-character coach-character--alert">
            <svg
              class="coach-shield-icon"
              viewBox="0 0 24 24"
              width="32"
              height="32"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div class="coach-alert-header-text">
            <div class="coach-alert-title">
              <span class="coach-severity-badge coach-severity--block">
                ${severityLabel("block")}
              </span>
              ${alert.title}
            </div>
            <div class="coach-alert-sub">${remaining}</div>
          </div>
          ${queueCount > 1
            ? html`<div class="coach-queue-indicator">${queueCount} pending</div>`
            : nothing}
        </div>

        <div class="coach-message">${alert.coachMessage}</div>

        ${renderAlertContext(alert.context)}

        <div class="coach-recommendation">${alert.recommendation}</div>

        ${renderThreatDetails(alert.threats)}

        ${state.securityCoachError
          ? html`<div class="coach-error">${state.securityCoachError}</div>`
          : nothing}

        <div class="coach-actions">
          <button
            class="btn primary"
            ?disabled=${busy}
            @click=${() =>
              state.handleSecurityCoachDecision?.(alert.id, "allow-once")}
          >
            Allow Once
          </button>
          <button
            class="btn"
            ?disabled=${busy}
            @click=${() =>
              state.handleSecurityCoachDecision?.(alert.id, "allow-always")}
          >
            Always Allow
          </button>
          <button
            class="btn danger"
            ?disabled=${busy}
            @click=${() =>
              state.handleSecurityCoachDecision?.(alert.id, "deny")}
          >
            Deny
          </button>
          <button
            class="btn"
            ?disabled=${busy}
            @click=${() =>
              state.handleSecurityCoachDecision?.(alert.id, "learn-more")}
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderSpeechBubble(
  speech: NonNullable<SecurityCoachViewState["securityCoachSpeech"]>,
) {
  return html`
    <div class="coach-bubble coach-bubble--${speech.style}">
      <span class="coach-bubble-text">${speech.message}</span>
    </div>
  `;
}

function renderWarnInformCard(state: CoachState, alert: SecurityCoachAlertUI) {
  const busy = state.securityCoachBusy ?? false;
  return html`
    <div class="coach-alert-card coach-severity--${alert.level}">
      <div class="coach-alert-header">
        <div class="coach-alert-title">
          <span class="coach-severity-badge coach-severity--${alert.level}">
            ${severityLabel(alert.level)}
          </span>
          ${alert.title}
        </div>
      </div>

      <div class="coach-message">${alert.coachMessage}</div>

      ${renderAlertContext(alert.context)}

      <div class="coach-recommendation">${alert.recommendation}</div>

      ${renderThreatDetails(alert.threats)}

      ${state.securityCoachError
        ? html`<div class="coach-error">${state.securityCoachError}</div>`
        : nothing}

      ${alert.requiresDecision
        ? html`
            <div class="coach-actions">
              <button
                class="btn primary"
                ?disabled=${busy}
                @click=${() =>
                  state.handleSecurityCoachDecision?.(alert.id, "allow-once")}
              >
                Allow Once
              </button>
              <button
                class="btn danger"
                ?disabled=${busy}
                @click=${() =>
                  state.handleSecurityCoachDecision?.(alert.id, "deny")}
              >
                Deny
              </button>
            </div>
          `
        : html`
            <div class="coach-actions">
              <button
                class="btn"
                @click=${() =>
                  state.handleSecurityCoachDismiss?.(alert.id)}
              >
                Dismiss
              </button>
            </div>
          `}
    </div>
  `;
}

function renderFloatingCoach(
  state: CoachState,
  currentAlert: SecurityCoachAlertUI | null,
  characterState: string,
) {
  const speech = state.securityCoachSpeech ?? null;
  return html`
    <div class="security-coach">
      ${currentAlert
        ? renderWarnInformCard(state, currentAlert)
        : nothing}

      ${speech && !currentAlert ? renderSpeechBubble(speech) : nothing}

      <div
        class="coach-character coach-character--${characterState}"
        @click=${() => state.handleSecurityCoachToggle?.(true)}
        role="button"
        tabindex="0"
        aria-label="Minimize security coach"
      >
        <svg
          class="coach-shield-icon"
          viewBox="0 0 24 24"
          width="32"
          height="32"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Main render entry-point
// ---------------------------------------------------------------------------

export function renderSecurityCoach(
  state: AppViewState & Partial<SecurityCoachViewState>,
) {
  // If coach is disabled, render nothing
  if (!state.securityCoachEnabled) {
    return nothing;
  }

  const alerts = state.securityCoachAlerts ?? [];
  const currentAlert = alerts[0] ?? null;
  const isBlocking = currentAlert?.level === "block";
  const characterState = state.securityCoachCharacterState ?? "idle";
  const minimized = state.securityCoachMinimized ?? false;

  // If minimized and no blocking alert, render just the mini character with badge
  if (minimized && !isBlocking) {
    return renderMinimizedCoach(state, alerts.length);
  }

  // If there's a blocking alert, render the full overlay
  if (isBlocking && currentAlert) {
    return renderBlockingAlert(state, currentAlert, alerts.length);
  }

  // If there's a non-blocking alert or speech bubble, render the floating coach
  return renderFloatingCoach(state, currentAlert, characterState);
}
