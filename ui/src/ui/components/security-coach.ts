import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

type CoachAlert = {
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
};

type CoachCharacterState =
  | "idle"
  | "alert"
  | "blocking"
  | "coaching"
  | "celebrating"
  | "thinking"
  | "sleeping";

@customElement("security-coach")
export class SecurityCoach extends LitElement {
  @property({ type: Boolean }) enabled = true;
  @property({ type: String }) characterState: CoachCharacterState = "idle";

  @state() private alerts: CoachAlert[] = [];
  @state() private currentAlert: CoachAlert | null = null;
  @state() private speechBubble: { message: string; style: string } | null = null;
  @state() private minimized = false;
  @state() private busy = false;
  @state() private showDetails = false;
  @state() private countdown = "";

  private countdownTimer?: ReturnType<typeof setInterval>;
  private speechDismissTimer?: ReturnType<typeof setTimeout>;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  connectedCallback() {
    super.connectedCallback();
    this.startCountdownTimer();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.clearCountdownTimer();
    this.clearSpeechDismissTimer();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  addAlert(alert: CoachAlert) {
    this.alerts = [...this.alerts, alert];
    if (!this.currentAlert) {
      this.presentNextAlert();
    }
    // Transition to the appropriate character state based on alert level.
    if (alert.level === "block") {
      this.setCharacterState("blocking");
    } else if (alert.level === "warn") {
      this.setCharacterState("alert");
    } else {
      this.setCharacterState("coaching");
    }
  }

  removeAlert(alertId: string) {
    this.alerts = this.alerts.filter((a) => a.id !== alertId);
    if (this.currentAlert?.id === alertId) {
      this.currentAlert = null;
      this.showDetails = false;
      this.presentNextAlert();
    }
  }

  showSpeech(message: string, style: string, autoDismissMs?: number) {
    this.clearSpeechDismissTimer();
    this.speechBubble = { message, style };
    if (autoDismissMs && autoDismissMs > 0) {
      this.speechDismissTimer = setTimeout(() => {
        this.speechBubble = null;
      }, autoDismissMs);
    }
  }

  setCharacterState(state: CoachCharacterState) {
    this.characterState = state;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private presentNextAlert() {
    if (this.alerts.length > 0) {
      this.currentAlert = this.alerts[0];
      this.showDetails = false;
    } else {
      this.currentAlert = null;
      this.showDetails = false;
      if (this.characterState !== "celebrating") {
        this.setCharacterState("idle");
      }
    }
  }

  private startCountdownTimer() {
    this.clearCountdownTimer();
    this.countdownTimer = setInterval(() => {
      if (!this.currentAlert) {
        this.countdown = "";
        return;
      }
      const remaining = this.currentAlert.expiresAtMs - Date.now();
      if (remaining <= 0) {
        this.countdown = "Expired";
        return;
      }
      const totalSeconds = Math.ceil(remaining / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      this.countdown =
        minutes > 0
          ? `${minutes}:${String(seconds).padStart(2, "0")}`
          : `${seconds}s`;
    }, 250);
  }

  private clearCountdownTimer() {
    if (this.countdownTimer !== undefined) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }
  }

  private clearSpeechDismissTimer() {
    if (this.speechDismissTimer !== undefined) {
      clearTimeout(this.speechDismissTimer);
      this.speechDismissTimer = undefined;
    }
  }

  private emitDecision(alertId: string, decision: string) {
    this.busy = true;
    this.dispatchEvent(
      new CustomEvent("security-coach-decision", {
        detail: { alertId, decision },
        bubbles: true,
        composed: true,
      }),
    );
    this.removeAlert(alertId);
    this.busy = false;
    // Brief celebration on allow/deny
    this.setCharacterState("celebrating");
    setTimeout(() => {
      if (this.characterState === "celebrating") {
        this.setCharacterState(this.alerts.length > 0 ? "alert" : "idle");
      }
    }, 1200);
  }

  private emitDismiss(alertId: string) {
    this.dispatchEvent(
      new CustomEvent("security-coach-dismiss", {
        detail: { alertId },
        bubbles: true,
        composed: true,
      }),
    );
    this.removeAlert(alertId);
  }

  private toggleMinimized() {
    this.minimized = !this.minimized;
    this.dispatchEvent(
      new CustomEvent("security-coach-toggle", {
        detail: { minimized: this.minimized },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  private severityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case "critical":
        return "var(--danger, #ef4444)";
      case "high":
        return "var(--warn, #f59e0b)";
      case "medium":
        return "#eab308";
      case "low":
        return "var(--info, #3b82f6)";
      default:
        return "var(--muted, #71717a)";
    }
  }

  private levelColor(level: "block" | "warn" | "inform"): string {
    switch (level) {
      case "block":
        return "var(--danger, #ef4444)";
      case "warn":
        return "var(--warn, #f59e0b)";
      case "inform":
        return "var(--info, #3b82f6)";
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  render() {
    if (!this.enabled) return nothing;

    if (this.minimized) {
      return html`
        <div class="coach-minimized" @click=${this.toggleMinimized}>
          <span class="coach-mini-icon">🛡️</span>
          ${this.alerts.length > 0
            ? html`<span class="badge">${this.alerts.length}</span>`
            : nothing}
        </div>
      `;
    }

    return html`
      <div class="coach-container">
        ${this.renderSpeechBubble()}
        ${this.renderAlertCard()}
        ${this.renderCharacter()}
      </div>
    `;
  }

  private renderCharacter() {
    const stateClass = this.characterState;
    return html`
      <div class="coach-character ${stateClass}" @click=${this.handleCharacterClick}>
        <span class="coach-icon" role="img" aria-label="Security Coach">🛡️</span>
        ${this.characterState === "coaching"
          ? html`<span class="speech-indicator">💬</span>`
          : nothing}
        ${this.characterState === "thinking"
          ? html`<span class="thinking-dots">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </span>`
          : nothing}
        ${this.characterState === "celebrating"
          ? html`<span class="sparkle">✨</span>`
          : nothing}
        ${this.characterState === "sleeping"
          ? html`<span class="zzz">💤</span>`
          : nothing}
        <button
          class="minimize-btn"
          @click=${(e: Event) => {
            e.stopPropagation();
            this.toggleMinimized();
          }}
          aria-label="Minimize security coach"
          title="Minimize"
        >
          ×
        </button>
      </div>
    `;
  }

  private handleCharacterClick() {
    if (!this.currentAlert && !this.speechBubble) {
      const tips = [
        "Always review tool arguments before approving!",
        "Check file paths -- is that where you expect?",
        "Network requests can exfiltrate data. Stay alert!",
        "I am watching for suspicious patterns.",
        "Environment variables may contain secrets.",
        "Clipboard access can leak sensitive info.",
      ];
      const tip = tips[Math.floor(Math.random() * tips.length)];
      this.showSpeech(tip, "tip", 4000);
      this.setCharacterState("coaching");
      setTimeout(() => {
        if (this.characterState === "coaching" && !this.currentAlert) {
          this.setCharacterState("idle");
        }
      }, 4200);
    }
  }

  private renderSpeechBubble() {
    if (!this.speechBubble) return nothing;
    return html`
      <div class="speech-bubble speech-${this.speechBubble.style}">
        <p class="speech-text">${this.speechBubble.message}</p>
        <button
          class="speech-close"
          @click=${() => {
            this.clearSpeechDismissTimer();
            this.speechBubble = null;
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
        <div class="speech-tail"></div>
      </div>
    `;
  }

  private renderAlertCard() {
    const alert = this.currentAlert;
    if (!alert) return nothing;

    const borderColor = this.levelColor(alert.level);

    return html`
      <div
        class="alert-card"
        style="--alert-border-color: ${borderColor}"
      >
        <div class="alert-header">
          <span class="alert-level-badge" style="background: ${borderColor}">
            ${alert.level.toUpperCase()}
          </span>
          <span class="alert-title">${alert.title}</span>
          ${this.countdown
            ? html`<span class="alert-countdown" title="Time remaining">⏱ ${this.countdown}</span>`
            : nothing}
          <button
            class="alert-close"
            @click=${() => this.emitDismiss(alert.id)}
            aria-label="Dismiss alert"
            title="Dismiss"
          >
            ×
          </button>
        </div>

        <div class="alert-body">
          <p class="coach-message">${alert.coachMessage}</p>
          <p class="recommendation">${alert.recommendation}</p>
        </div>

        ${alert.threats.length > 0
          ? html`
              <button class="details-toggle" @click=${this.toggleDetails}>
                ${this.showDetails ? "▾ Hide threats" : "▸ Show threats"} (${alert.threats.length})
              </button>
              ${this.showDetails
                ? html`
                    <div class="threat-list">
                      ${alert.threats.map(
                        (t) => html`
                          <div class="threat-item">
                            <span
                              class="severity-dot"
                              style="background: ${this.severityColor(t.severity)}"
                              title=${t.severity}
                            ></span>
                            <div class="threat-info">
                              <span class="threat-title">${t.title}</span>
                              <span class="threat-category">${t.category}</span>
                              <p class="threat-coaching">${t.coaching}</p>
                            </div>
                          </div>
                        `,
                      )}
                    </div>
                  `
                : nothing}
            `
          : nothing}

        ${alert.requiresDecision
          ? html`
              <div class="alert-actions">
                <button
                  class="action-btn allow-once"
                  ?disabled=${this.busy}
                  @click=${() => this.emitDecision(alert.id, "allow-once")}
                >
                  Allow Once
                </button>
                <button
                  class="action-btn always-allow"
                  ?disabled=${this.busy}
                  @click=${() => this.emitDecision(alert.id, "allow-always")}
                >
                  Always Allow
                </button>
                <button
                  class="action-btn deny"
                  ?disabled=${this.busy}
                  @click=${() => this.emitDecision(alert.id, "deny")}
                >
                  Deny
                </button>
                <button
                  class="action-btn learn-more"
                  ?disabled=${this.busy}
                  @click=${() => this.emitDecision(alert.id, "learn-more")}
                >
                  Learn More
                </button>
              </div>
            `
          : html`
              <div class="alert-actions">
                <button
                  class="action-btn dismiss"
                  @click=${() => this.emitDismiss(alert.id)}
                >
                  Dismiss
                </button>
              </div>
            `}
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  static styles = css`
    /* ---- Host ---- */
    :host {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: var(--font-body, sans-serif);
      color: var(--text, #e4e4e7);
      pointer-events: none;
    }

    * {
      box-sizing: border-box;
    }

    /* ---- Container ---- */
    .coach-container {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      pointer-events: auto;
    }

    /* ---- Character Avatar ---- */
    .coach-character {
      position: relative;
      width: 56px;
      height: 56px;
      border-radius: var(--radius-full, 9999px);
      background: var(--card, #181b22);
      border: 2px solid var(--border, #27272a);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: var(--shadow-lg, 0 12px 28px rgba(0, 0, 0, 0.35));
      transition:
        transform 300ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)),
        border-color 300ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)),
        box-shadow 300ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
      user-select: none;
      flex-shrink: 0;
    }

    .coach-character:hover {
      transform: scale(1.08);
      box-shadow:
        var(--shadow-lg, 0 12px 28px rgba(0, 0, 0, 0.35)),
        0 0 16px var(--accent-glow, rgba(255, 92, 92, 0.25));
    }

    .coach-icon {
      font-size: 26px;
      line-height: 1;
    }

    /* Idle -- subtle breathing */
    .coach-character.idle {
      animation: breathe 3s ease-in-out infinite;
    }

    @keyframes breathe {
      0%,
      100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.04);
      }
    }

    /* Alert -- bounce + glow */
    .coach-character.alert {
      border-color: var(--accent, #ff5c5c);
      animation: bounce-glow 0.6s var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1)) infinite
        alternate;
      box-shadow:
        var(--shadow-lg),
        0 0 20px var(--accent-glow, rgba(255, 92, 92, 0.25));
    }

    @keyframes bounce-glow {
      0% {
        transform: translateY(0) scale(1);
      }
      100% {
        transform: translateY(-6px) scale(1.06);
      }
    }

    /* Blocking -- pulsing red border */
    .coach-character.blocking {
      border-color: var(--danger, #ef4444);
      animation: pulse-block 1s ease-in-out infinite;
      box-shadow:
        var(--shadow-lg),
        0 0 24px var(--danger-muted, rgba(239, 68, 68, 0.75));
    }

    @keyframes pulse-block {
      0%,
      100% {
        border-color: var(--danger, #ef4444);
        box-shadow:
          var(--shadow-lg),
          0 0 12px var(--danger-subtle, rgba(239, 68, 68, 0.12));
      }
      50% {
        border-color: #ff0000;
        box-shadow:
          var(--shadow-lg),
          0 0 28px var(--danger-muted, rgba(239, 68, 68, 0.75));
      }
    }

    /* Coaching -- speech indicator */
    .coach-character.coaching {
      border-color: var(--accent-2, #14b8a6);
    }

    .speech-indicator {
      position: absolute;
      top: -4px;
      right: -4px;
      font-size: 14px;
      animation: pop-in 300ms var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1)) forwards;
    }

    @keyframes pop-in {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Celebrating -- spin + sparkle */
    .coach-character.celebrating {
      border-color: var(--ok, #22c55e);
      animation: celebrate-spin 0.8s var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
    }

    @keyframes celebrate-spin {
      0% {
        transform: rotate(0deg) scale(1);
      }
      40% {
        transform: rotate(360deg) scale(1.15);
      }
      100% {
        transform: rotate(360deg) scale(1);
      }
    }

    .sparkle {
      position: absolute;
      top: -8px;
      right: -8px;
      font-size: 16px;
      animation: sparkle-float 1s ease-out forwards;
    }

    @keyframes sparkle-float {
      0% {
        transform: translateY(0) scale(0.6);
        opacity: 1;
      }
      100% {
        transform: translateY(-16px) scale(1.2);
        opacity: 0;
      }
    }

    /* Thinking -- dots */
    .coach-character.thinking {
      border-color: var(--muted, #71717a);
    }

    .thinking-dots {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 3px;
    }

    .thinking-dots .dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--muted, #71717a);
      animation: dot-bounce 1.2s ease-in-out infinite;
    }

    .thinking-dots .dot:nth-child(2) {
      animation-delay: 0.15s;
    }

    .thinking-dots .dot:nth-child(3) {
      animation-delay: 0.3s;
    }

    @keyframes dot-bounce {
      0%,
      60%,
      100% {
        transform: translateY(0);
        opacity: 0.4;
      }
      30% {
        transform: translateY(-6px);
        opacity: 1;
      }
    }

    /* Sleeping */
    .coach-character.sleeping {
      border-color: var(--border, #27272a);
      opacity: 0.6;
    }

    .zzz {
      position: absolute;
      top: -8px;
      right: -6px;
      font-size: 14px;
      animation: zzz-float 2.5s ease-in-out infinite;
    }

    @keyframes zzz-float {
      0%,
      100% {
        transform: translateY(0) scale(0.9);
        opacity: 0.5;
      }
      50% {
        transform: translateY(-6px) scale(1.1);
        opacity: 1;
      }
    }

    /* Minimize button */
    .minimize-btn {
      position: absolute;
      top: -6px;
      left: -6px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1px solid var(--border, #27272a);
      background: var(--card, #181b22);
      color: var(--muted, #71717a);
      font-size: 12px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      transition: opacity 150ms ease-out;
      padding: 0;
    }

    .coach-character:hover .minimize-btn {
      opacity: 1;
    }

    .minimize-btn:hover {
      background: var(--bg-hover, #262a35);
      color: var(--text, #e4e4e7);
    }

    /* ---- Minimized Mode ---- */
    .coach-minimized {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full, 9999px);
      background: var(--card, #181b22);
      border: 2px solid var(--border, #27272a);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.25));
      pointer-events: auto;
      transition: transform 200ms var(--ease-out);
      user-select: none;
    }

    .coach-minimized:hover {
      transform: scale(1.1);
    }

    .coach-mini-icon {
      font-size: 18px;
      line-height: 1;
    }

    .badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 18px;
      height: 18px;
      border-radius: var(--radius-full, 9999px);
      background: var(--accent, #ff5c5c);
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      line-height: 1;
      animation: badge-pop 300ms var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
    }

    @keyframes badge-pop {
      0% {
        transform: scale(0);
      }
      100% {
        transform: scale(1);
      }
    }

    /* ---- Speech Bubble ---- */
    .speech-bubble {
      position: relative;
      max-width: 320px;
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      padding: 12px 16px;
      box-shadow: var(--shadow-lg, 0 12px 28px rgba(0, 0, 0, 0.35));
      animation: slide-up 300ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) forwards;
    }

    @keyframes slide-up {
      0% {
        opacity: 0;
        transform: translateY(8px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .speech-text {
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
      color: var(--text, #e4e4e7);
    }

    .speech-tail {
      position: absolute;
      bottom: -7px;
      right: 24px;
      width: 14px;
      height: 14px;
      background: var(--card, #181b22);
      border-right: 1px solid var(--border, #27272a);
      border-bottom: 1px solid var(--border, #27272a);
      transform: rotate(45deg);
    }

    .speech-close {
      position: absolute;
      top: 4px;
      right: 6px;
      width: 20px;
      height: 20px;
      background: none;
      border: none;
      color: var(--muted, #71717a);
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border-radius: var(--radius-sm, 6px);
    }

    .speech-close:hover {
      color: var(--text, #e4e4e7);
      background: var(--bg-hover, #262a35);
    }

    /* Speech style variants */
    .speech-tip {
      border-color: var(--accent-2, #14b8a6);
    }

    .speech-tip .speech-tail {
      border-right-color: var(--accent-2, #14b8a6);
      border-bottom-color: var(--accent-2, #14b8a6);
    }

    .speech-warning {
      border-color: var(--warn, #f59e0b);
    }

    .speech-warning .speech-tail {
      border-right-color: var(--warn, #f59e0b);
      border-bottom-color: var(--warn, #f59e0b);
    }

    .speech-danger {
      border-color: var(--danger, #ef4444);
    }

    .speech-danger .speech-tail {
      border-right-color: var(--danger, #ef4444);
      border-bottom-color: var(--danger, #ef4444);
    }

    /* ---- Alert Card ---- */
    .alert-card {
      width: 360px;
      background: var(--card, #181b22);
      border: 1px solid var(--alert-border-color, var(--border, #27272a));
      border-left: 3px solid var(--alert-border-color, var(--border, #27272a));
      border-radius: var(--radius-lg, 12px);
      box-shadow: var(--shadow-lg, 0 12px 28px rgba(0, 0, 0, 0.35));
      overflow: hidden;
      animation: slide-up 350ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)) forwards;
    }

    .alert-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border, #27272a);
      background: var(--bg-elevated, #1a1d25);
    }

    .alert-level-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: var(--radius-sm, 6px);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #fff;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .alert-title {
      flex: 1;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .alert-countdown {
      font-size: 11px;
      font-family: var(--mono, monospace);
      color: var(--muted, #71717a);
      flex-shrink: 0;
    }

    .alert-close {
      width: 22px;
      height: 22px;
      background: none;
      border: none;
      color: var(--muted, #71717a);
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border-radius: var(--radius-sm, 6px);
      flex-shrink: 0;
    }

    .alert-close:hover {
      color: var(--text, #e4e4e7);
      background: var(--bg-hover, #262a35);
    }

    .alert-body {
      padding: 12px;
    }

    .coach-message {
      margin: 0 0 8px;
      font-size: 13px;
      line-height: 1.5;
      color: var(--text, #e4e4e7);
    }

    .recommendation {
      margin: 0;
      font-size: 12px;
      line-height: 1.5;
      color: var(--muted, #71717a);
      font-style: italic;
    }

    /* ---- Threat Details ---- */
    .details-toggle {
      display: block;
      width: 100%;
      padding: 6px 12px;
      background: none;
      border: none;
      border-top: 1px solid var(--border, #27272a);
      color: var(--muted, #71717a);
      font-size: 11px;
      font-family: var(--font-body, sans-serif);
      cursor: pointer;
      text-align: left;
      transition: color 150ms ease-out;
    }

    .details-toggle:hover {
      color: var(--text, #e4e4e7);
      background: var(--bg-hover, #262a35);
    }

    .threat-list {
      padding: 4px 12px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      animation: slide-up 200ms var(--ease-out) forwards;
    }

    .threat-item {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }

    .severity-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 4px;
    }

    .threat-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .threat-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text, #e4e4e7);
    }

    .threat-category {
      font-size: 10px;
      font-family: var(--mono, monospace);
      color: var(--muted, #71717a);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .threat-coaching {
      margin: 2px 0 0;
      font-size: 12px;
      line-height: 1.4;
      color: var(--muted, #71717a);
    }

    /* ---- Action Buttons ---- */
    .alert-actions {
      display: flex;
      gap: 6px;
      padding: 8px 12px 12px;
      flex-wrap: wrap;
    }

    .action-btn {
      padding: 5px 12px;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--border, #27272a);
      background: var(--card, #181b22);
      color: var(--text, #e4e4e7);
      font-size: 12px;
      font-weight: 500;
      font-family: var(--font-body, sans-serif);
      cursor: pointer;
      transition:
        background 150ms ease-out,
        border-color 150ms ease-out,
        transform 100ms ease-out;
    }

    .action-btn:hover {
      background: var(--bg-hover, #262a35);
      border-color: var(--border-hover, #52525b);
    }

    .action-btn:active {
      transform: scale(0.97);
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .action-btn.allow-once {
      border-color: var(--ok, #22c55e);
      color: var(--ok, #22c55e);
    }

    .action-btn.allow-once:hover {
      background: var(--ok-subtle, rgba(34, 197, 94, 0.12));
    }

    .action-btn.always-allow {
      background: var(--ok, #22c55e);
      border-color: var(--ok, #22c55e);
      color: #fff;
    }

    .action-btn.always-allow:hover {
      background: var(--ok-muted, rgba(34, 197, 94, 0.75));
    }

    .action-btn.deny {
      border-color: var(--danger, #ef4444);
      color: var(--danger, #ef4444);
    }

    .action-btn.deny:hover {
      background: var(--danger-subtle, rgba(239, 68, 68, 0.12));
    }

    .action-btn.learn-more {
      color: var(--muted, #71717a);
    }

    .action-btn.dismiss {
      margin-left: auto;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "security-coach": SecurityCoach;
  }
}
