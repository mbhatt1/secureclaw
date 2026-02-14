import type { SecurityCoachAuditLog } from "./audit.js";
import type { SecurityCoachEngine, CoachAlert } from "./engine.js";
import type { AlertHistoryStore } from "./history.js";
import type { CoachMetrics } from "./metrics.js";
import type { ThreatMatchInput } from "./patterns.js";
import type { SiemDispatcher } from "./siem/dispatcher.js";
import type { AlertThrottle } from "./throttle.js";
import {
  auditAlertCreated,
  auditAlertResolved,
  auditAlertExpired,
  auditAutoDecision,
} from "./audit.js";
import {
  SECURITY_COACH_EVENTS,
  type SecurityCoachAlertEvent,
  type SecurityCoachTipEvent,
} from "./events.js";
import { createAlertSiemEvent, createDecisionSiemEvent } from "./siem/dispatcher.js";
import { buildContextKey } from "./throttle.js";

// ---------------------------------------------------------------------------
// Secret redaction
// ---------------------------------------------------------------------------

/** Redact common secret patterns from a string before logging/broadcasting. */
function redactSecrets(text: string | undefined): string | undefined {
  if (!text) {
    return text;
  }
  return (
    text
      // Bearer tokens
      .replace(/(Bearer\s+)[^\s"']+/gi, "$1[REDACTED]")
      // Authorization headers in curl/wget
      .replace(/([-]-header\s+["']?Authorization:\s*)[^\s"']+/gi, "$1[REDACTED]")
      .replace(/(-H\s+["']?Authorization:\s*)[^\s"']+/gi, "$1[REDACTED]")
      // API keys in common header formats
      .replace(
        /([-]-header\s+["']?[Xx][-_][Aa][Pp][Ii][-_][Kk][Ee][Yy]:\s*)[^\s"']+/gi,
        "$1[REDACTED]",
      )
      .replace(/(-H\s+["']?[Xx][-_][Aa][Pp][Ii][-_][Kk][Ee][Yy]:\s*)[^\s"']+/gi, "$1[REDACTED]")
      // Environment variable assignments with secret-looking names
      .replace(
        /((?:API_KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL|AUTH|ACCESS_KEY|PRIVATE_KEY)\s*=\s*)[^\s;]+/gi,
        "$1[REDACTED]",
      )
      // MySQL/Postgres password flags
      .replace(/(-p)([^\s]+)/g, "$1[REDACTED]")
      .replace(/(--password[=\s]+)[^\s]+/gi, "$1[REDACTED]")
      // AWS keys (AKIA...)
      .replace(/\b(AKIA[0-9A-Z]{16})\b/g, "[REDACTED_AWS_KEY]")
      // Generic long hex/base64 tokens (40+ chars that look like tokens)
      .replace(/\b([A-Za-z0-9+/]{40,}={0,2})\b/g, (match) => {
        // Only redact if it looks like a token (high entropy, no spaces)
        if (/^[A-Za-z0-9+/=_-]+$/.test(match) && match.length >= 40) {
          return "[REDACTED_TOKEN]";
        }
        return match;
      })
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Broadcast function signature — matches the gateway's event broadcaster.
 * `dropIfSlow` hints that the event is non-critical and can be discarded
 * if the broadcast channel is backed up.
 */
export type SecurityCoachBroadcastFn = (
  event: string,
  payload: unknown,
  opts?: { dropIfSlow?: boolean },
) => void;

// ---------------------------------------------------------------------------
// Param extractors
// ---------------------------------------------------------------------------

/**
 * Extracts the command string from bash/exec/shell tool params.
 *
 * Checks common param shapes across different tool implementations:
 *   - `params.command`       (Bash, exec)
 *   - `params.cmd`           (some shell wrappers)
 *   - `params.script`        (script-runner tools)
 *   - `params.shell_command` (shell_command variant)
 *   - `params.exec`          (exec variant)
 *   - `params.shell`         (shell variant)
 *   - `params.bash_command`  (bash_command variant)
 *   - `params.run`           (run variant)
 *   - `params.execute`       (execute variant)
 *   - `params.sh`            (sh variant)
 *
 * Falls back to a heuristic scan of all string values for shell metacharacters.
 */
export function extractCommand(
  _toolName: string,
  params: Record<string, unknown>,
): string | undefined {
  for (const key of [
    "command",
    "cmd",
    "script",
    "shell_command",
    "exec",
    "shell",
    "bash_command",
    "run",
    "execute",
    "sh",
  ] as const) {
    const val = params[key];
    if (typeof val === "string" && val.length > 0) {
      return val;
    }
  }

  // Heuristic fallback: scan all string values for shell metacharacters.
  for (const val of Object.values(params)) {
    if (typeof val === "string" && val.length > 0 && /[|><;`]|\$\(/.test(val)) {
      return val;
    }
  }

  return undefined;
}

/**
 * Extracts a file path from read/write/edit tool params.
 *
 * Checks common param shapes:
 *   - `params.file_path`    (Read, Write, Edit tools)
 *   - `params.filePath`     (camelCase variant)
 *   - `params.path`         (generic)
 *   - `params.filename`     (filename variant)
 *   - `params.file`         (file variant)
 *   - `params.target_path`  (target_path variant)
 *   - `params.source_path`  (source_path variant)
 *   - `params.dest`         (dest variant)
 *   - `params.destination`  (destination variant)
 *   - `params.src`          (src variant)
 *   - `params.target`       (target variant)
 *   - `params.filepath`     (lowercase variant)
 *
 * Falls back to a heuristic scan of all string values for path-like patterns.
 */
export function extractFilePath(
  _toolName: string,
  params: Record<string, unknown>,
): string | undefined {
  for (const key of [
    "file_path",
    "filePath",
    "path",
    "filename",
    "file",
    "target_path",
    "source_path",
    "dest",
    "destination",
    "src",
    "target",
    "filepath",
  ] as const) {
    const val = params[key];
    if (typeof val === "string" && val.length > 0) {
      return val;
    }
  }

  // Heuristic fallback: scan all string values for path-like patterns.
  for (const val of Object.values(params)) {
    if (typeof val === "string" && val.length > 0 && (val.startsWith("/") || val.startsWith("~"))) {
      return val;
    }
  }

  return undefined;
}

/**
 * Extracts a URL from web_fetch/curl/http tool params.
 *
 * Checks common param shapes:
 *   - `params.url`        (WebFetch, curl)
 *   - `params.uri`        (alternative naming)
 *   - `params.href`       (href variant)
 *   - `params.endpoint`   (endpoint variant)
 *   - `params.target_url` (target_url variant)
 *   - `params.link`       (link variant)
 *   - `params.address`    (address variant)
 *   - `params.remote`     (remote variant)
 *   - `params.server`     (server variant)
 *
 * Falls back to a heuristic scan of all string values for URL-like patterns.
 */
export function extractUrl(_toolName: string, params: Record<string, unknown>): string | undefined {
  for (const key of [
    "url",
    "uri",
    "href",
    "endpoint",
    "target_url",
    "link",
    "address",
    "remote",
    "server",
  ] as const) {
    const val = params[key];
    if (typeof val === "string" && val.length > 0) {
      return val;
    }
  }

  // Heuristic fallback: scan all string values for URL-like patterns.
  for (const val of Object.values(params)) {
    if (
      typeof val === "string" &&
      val.length > 0 &&
      (val.startsWith("http://") || val.startsWith("https://"))
    ) {
      return val;
    }
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Alert mapping helper
// ---------------------------------------------------------------------------

/**
 * Maps an engine `CoachAlert` + call context into the broadcast event shape.
 */
function alertToEvent(
  alert: CoachAlert,
  context: SecurityCoachAlertEvent["context"],
): SecurityCoachAlertEvent {
  return {
    id: alert.id,
    level: alert.level,
    title: alert.title,
    coachMessage: alert.coachMessage,
    recommendation: alert.recommendation,
    threats: alert.threats.map((t) => ({
      patternId: t.pattern.id,
      category: t.pattern.category,
      severity: t.pattern.severity,
      title: t.pattern.title,
      coaching: t.pattern.coaching,
    })),
    requiresDecision: alert.requiresDecision,
    createdAtMs: alert.createdAt,
    expiresAtMs: alert.expiresAt,
    context,
  };
}

// ---------------------------------------------------------------------------
// Hook factory
// ---------------------------------------------------------------------------

/**
 * Creates hook handlers that wire the security coach into the agent
 * tool/message lifecycle.
 *
 * These are called from the gateway's tool execution and message delivery
 * pipelines. Unlike plugin hooks (which are registered via the plugin
 * registry), these are core feature hooks invoked directly from the
 * existing hook runner invocation points.
 */
export function createSecurityCoachHooks(
  engine: SecurityCoachEngine,
  broadcast: SecurityCoachBroadcastFn,
  opts?: {
    auditLog?: SecurityCoachAuditLog;
    throttle?: AlertThrottle;
    metrics?: CoachMetrics;
    history?: AlertHistoryStore;
    siem?: SiemDispatcher;
  },
) {
  const auditLog = opts?.auditLog;
  const throttle = opts?.throttle;
  const metrics = opts?.metrics;
  const history = opts?.history;
  const siem = opts?.siem;

  // Track evaluations so we can call throttle.cleanup() periodically
  // to prevent unbounded memory growth in cooldown/dedup maps.
  let evalsSinceCleanup = 0;
  const CLEANUP_INTERVAL = 50; // cleanup every 50 evaluations

  // -----------------------------------------------------------------------
  // before_tool_call
  // -----------------------------------------------------------------------

  /**
   * Called before a tool executes. Evaluates the tool call against threat
   * patterns maintained by the security coach engine.
   *
   * Returns a block decision if threats are found and the user has not
   * approved, or `undefined` to let the tool call proceed.
   */
  async function beforeToolCall(event: {
    toolName: string;
    params: Record<string, unknown>;
    agentId?: string;
    sessionKey?: string;
  }): Promise<{ block: boolean; blockReason?: string } | undefined> {
    // Periodically clean up expired throttle entries to prevent memory leaks.
    if (throttle) {
      evalsSinceCleanup++;
      if (evalsSinceCleanup >= CLEANUP_INTERVAL) {
        throttle.cleanup();
        evalsSinceCleanup = 0;
      }
    }

    // 1. Build ThreatMatchInput from the tool call params.
    const input: ThreatMatchInput = {
      toolName: event.toolName,
      command: extractCommand(event.toolName, event.params),
      filePath: extractFilePath(event.toolName, event.params),
      url: extractUrl(event.toolName, event.params),
      params: event.params,
    };

    // 2. Run engine evaluation (pattern matching + rule store lookup).
    const result = await engine.evaluate(input);

    // 3. No threats, or auto-allowed by a saved rule — proceed silently.
    if (result.allowed && !result.alert) {
      // Record auto-decision in audit + metrics if a rule fired.
      if (result.autoDecision && auditLog) {
        const patternId = result.autoPatternId ?? "unknown";
        auditAutoDecision(auditLog, patternId, result.autoDecision, {
          toolName: event.toolName,
          command: redactSecrets(input.command),
        });
        metrics?.recordAutoDecision({ decision: result.autoDecision, patternId });
      }
      return undefined;
    }

    // 4. An alert was generated — broadcast to the UI.
    if (result.alert) {
      // Throttle check: suppress if too frequent.
      const topThreat = result.alert.threats[0];
      const topPatternId = topThreat?.pattern?.id ?? "unknown";
      const contextKey = buildContextKey({
        toolName: event.toolName,
        command: input.command,
      });

      if (throttle?.shouldThrottle(topPatternId, contextKey)) {
        // Suppressed by throttle — silently allow for non-blocking,
        // or deny for blocking alerts.
        return result.alert.requiresDecision
          ? { block: true, blockReason: "Security Coach: alert suppressed (rate limited)" }
          : undefined;
      }

      // Update throttle state.
      throttle?.recordAlert(topPatternId, contextKey);
      throttle?.setPendingCount(engine.getPendingAlerts().length);

      // Audit: alert created.
      if (auditLog) {
        auditAlertCreated(auditLog, result.alert);
      }

      // Metrics: alert created.
      metrics?.recordAlert({
        level: result.alert.level,
        severity: topThreat?.pattern?.severity ?? "info",
        category: topThreat?.pattern?.category ?? "general",
        patternIds: result.alert.threats.map((t) => t.pattern.id),
      });

      // SIEM: dispatch alert event.
      if (siem) {
        siem.dispatch(
          createAlertSiemEvent(
            {
              id: result.alert.id,
              level: result.alert.level,
              title: result.alert.title,
              threats: result.alert.threats.map((t) => ({
                patternId: t.pattern.id,
                category: t.pattern.category,
                severity: t.pattern.severity,
                title: t.pattern.title,
              })),
              coachMessage: result.alert.coachMessage,
              recommendation: result.alert.recommendation,
            },
            { toolName: event.toolName, command: redactSecrets(input.command) },
          ),
        );
      }

      const alertPayload = alertToEvent(result.alert, {
        toolName: event.toolName,
        command: redactSecrets(input.command),
        agentId: event.agentId,
        sessionKey: event.sessionKey,
      });

      broadcast(
        SECURITY_COACH_EVENTS.ALERT_REQUESTED,
        { ...alertPayload, targetSessionKey: event.sessionKey },
        { dropIfSlow: true },
      );

      // If the alert requires an explicit user decision, wait for it.
      if (result.alert.requiresDecision) {
        const alertCreatedAt = result.alert.createdAt;
        const decision = await engine.waitForDecision(result.alert.id, {
          sessionKey: event.sessionKey,
        });
        const resolvedAtMs = Date.now();
        const durationMs = resolvedAtMs - alertCreatedAt;

        // Update throttle pending count after resolution.
        throttle?.setPendingCount(engine.getPendingAlerts().length);

        if (!decision || decision === "deny") {
          // Audit: resolved/expired.
          if (auditLog) {
            if (!decision) {
              auditAlertExpired(auditLog, result.alert.id);
            } else {
              auditAlertResolved(auditLog, result.alert.id, decision);
            }
          }

          // Metrics: record decision.
          metrics?.recordDecision({
            decision: decision ?? "expired",
            durationMs,
            severity: topThreat?.pattern?.severity ?? "info",
            category: topThreat?.pattern?.category ?? "general",
          });

          // History: record resolved alert.
          history?.record({
            id: result.alert.id,
            level: result.alert.level,
            title: result.alert.title,
            severity: topThreat?.pattern?.severity ?? "info",
            category: topThreat?.pattern?.category ?? "general",
            patternIds: result.alert.threats.map((t) => t.pattern.id),
            decision: decision ?? null,
            resolvedBy: null,
            createdAtMs: alertCreatedAt,
            resolvedAtMs,
            durationMs,
          });

          // SIEM: dispatch decision event.
          if (siem) {
            siem.dispatch(createDecisionSiemEvent(result.alert.id, decision ?? "expired"));
          }

          return {
            block: true,
            blockReason: `Security Coach: ${result.alert.title}`,
          };
        }

        // Allowed — audit + metrics + history + SIEM.
        if (auditLog) {
          auditAlertResolved(auditLog, result.alert.id, decision);
        }
        metrics?.recordDecision({
          decision,
          durationMs,
          severity: topThreat?.pattern?.severity ?? "info",
          category: topThreat?.pattern?.category ?? "general",
        });
        history?.record({
          id: result.alert.id,
          level: result.alert.level,
          title: result.alert.title,
          severity: topThreat?.pattern?.severity ?? "info",
          category: topThreat?.pattern?.category ?? "general",
          patternIds: result.alert.threats.map((t) => t.pattern.id),
          decision,
          resolvedBy: null,
          createdAtMs: alertCreatedAt,
          resolvedAtMs,
          durationMs,
        });
        if (siem) {
          siem.dispatch(createDecisionSiemEvent(result.alert.id, decision));
        }

        // "allow-once", "allow-always", or "learn-more" — proceed.
        return undefined;
      }

      // Non-blocking alert (inform level) — just notify, don't block.
      return undefined;
    }

    // 5. Denied by a saved rule (no alert generated, but not allowed).
    if (!result.allowed) {
      // Record auto-deny in audit + metrics.
      if (result.autoDecision === "deny" && auditLog) {
        const patternId = result.autoPatternId ?? "unknown";
        auditAutoDecision(auditLog, patternId, "deny", {
          toolName: event.toolName,
          command: redactSecrets(input.command),
        });
        metrics?.recordAutoDecision({ decision: "deny", patternId });
      }
      return {
        block: true,
        blockReason: "Security Coach: blocked by saved rule",
      };
    }

    return undefined;
  }

  // -----------------------------------------------------------------------
  // after_tool_call
  // -----------------------------------------------------------------------

  /**
   * Called after a tool executes. Used for educational coaching tips.
   *
   * When educational mode is enabled, this checks for "teaching moment"
   * opportunities — e.g. after a chmod call, it might send a tip about
   * file permission best practices.
   *
   * This is fire-and-forget; it never blocks the pipeline.
   */
  async function afterToolCall(event: {
    toolName: string;
    params: Record<string, unknown>;
    result?: unknown;
    error?: string;
    durationMs?: number;
  }): Promise<void> {
    // Skip if educational mode is disabled.
    if (!engine.getConfig().educationalMode) {
      return;
    }

    // Build the same ThreatMatchInput so we can check for educational
    // patterns even when the operation was allowed.
    const input: ThreatMatchInput = {
      toolName: event.toolName,
      command: extractCommand(event.toolName, event.params),
      filePath: extractFilePath(event.toolName, event.params),
      url: extractUrl(event.toolName, event.params),
      params: event.params,
    };

    // Run a lightweight evaluation. If the engine is disabled or there are
    // no matches we simply return.
    const result = await engine.evaluate(input);

    // If an alert was generated that is informational (not requiring a
    // decision), broadcast it as a coaching tip.
    if (result.alert && !result.alert.requiresDecision) {
      const tip: SecurityCoachTipEvent = {
        id: result.alert.id,
        title: result.alert.title,
        message: result.alert.coachMessage,
        category: result.alert.threats[0]?.pattern.category ?? "general",
        severity: result.alert.threats[0]?.pattern.severity ?? "info",
        autoDismissMs: 10_000,
      };

      broadcast(SECURITY_COACH_EVENTS.TIP, tip, { dropIfSlow: true });

      // Metrics: record educational tip.
      metrics?.recordTip();
    }
  }

  // -----------------------------------------------------------------------
  // message_sending (before)
  // -----------------------------------------------------------------------

  /**
   * Called before a message is sent. Checks for social engineering patterns
   * or sensitive content in outgoing messages.
   *
   * Returns a cancel decision if threats are found and the user denies,
   * or `undefined` to let the message through.
   */
  async function beforeMessageSending(event: {
    content: string;
    to?: string;
    channelId?: string;
  }): Promise<{ cancel: boolean; reason?: string } | undefined> {
    const input: ThreatMatchInput = {
      content: event.content,
      channelId: event.channelId,
      direction: "outbound",
    };

    const result = await engine.evaluate(input);

    // No threats — allow silently.
    if (result.allowed && !result.alert) {
      return undefined;
    }

    // Alert that requires user decision.
    if (result.alert?.requiresDecision) {
      const alertPayload = alertToEvent(result.alert, {
        toolName: undefined,
        command: undefined,
        agentId: undefined,
        sessionKey: undefined,
      });

      broadcast(SECURITY_COACH_EVENTS.ALERT_REQUESTED, alertPayload, { dropIfSlow: true });

      const decision = await engine.waitForDecision(result.alert.id);

      if (!decision || decision === "deny") {
        return {
          cancel: true,
          reason: `Security Coach: ${result.alert.title}`,
        };
      }

      // User approved — let it through.
      return undefined;
    }

    // Non-blocking alert — broadcast tip but don't cancel.
    if (result.alert) {
      const alertPayload = alertToEvent(result.alert, undefined);
      broadcast(SECURITY_COACH_EVENTS.ALERT_REQUESTED, alertPayload, { dropIfSlow: true });
      return undefined;
    }

    // Denied by saved rule, no alert.
    if (!result.allowed) {
      return {
        cancel: true,
        reason: "Security Coach: blocked by saved rule",
      };
    }

    return undefined;
  }

  // -----------------------------------------------------------------------
  // on_inbound_channel_message
  // -----------------------------------------------------------------------

  /**
   * Called when a message arrives from any integration channel (WhatsApp,
   * Slack, Discord, Telegram, Signal, iMessage, etc.).
   *
   * Scans the message for scams, phishing, social engineering, and other
   * threats, then broadcasts an alert to the UI so the coach can warn the
   * user.  This is fire-and-forget — it never blocks the message pipeline.
   */
  async function onInboundChannelMessage(event: {
    content: string;
    channelId: string;
    senderId?: string;
    senderName?: string;
    conversationId?: string;
    accountId?: string;
  }): Promise<{ cancel: boolean; reason?: string } | undefined> {
    const input: ThreatMatchInput = {
      content: event.content,
      channelId: event.channelId,
      senderId: event.senderId,
      senderName: event.senderName,
      direction: "inbound",
    };

    const result = await engine.evaluate(input);

    if (result.alert) {
      const senderLabel = event.senderName
        ? `${event.senderName} (${event.senderId ?? "unknown"})`
        : (event.senderId ?? "unknown sender");

      const alertPayload = alertToEvent(result.alert, {
        toolName: undefined,
        command: undefined,
        agentId: undefined,
        sessionKey: undefined,
        channelId: event.channelId,
        senderId: event.senderId,
        senderName: senderLabel,
        conversationId: event.conversationId,
      });

      broadcast(SECURITY_COACH_EVENTS.ALERT_REQUESTED, alertPayload, { dropIfSlow: true });

      // If the alert requires a decision (blocking-level threat), signal cancellation.
      if (result.alert.requiresDecision) {
        return {
          cancel: true,
          reason: `Security Coach: ${result.alert.title}`,
        };
      }
    }

    // Denied by a saved rule (no alert generated, but not allowed).
    if (!result.allowed && !result.alert) {
      return {
        cancel: true,
        reason: "Security Coach: blocked by saved rule",
      };
    }

    return undefined;
  }

  // -----------------------------------------------------------------------
  // on_outbound_channel_message
  // -----------------------------------------------------------------------

  /**
   * Called before a message is sent through any integration channel.
   *
   * Scans the outbound message for accidental credential/PII sharing
   * and broadcasts a warning.  Non-blocking — just informs the user.
   */
  async function onOutboundChannelMessage(event: {
    content: string;
    channelId: string;
    to?: string;
  }): Promise<{ cancel: boolean; reason?: string } | undefined> {
    const input: ThreatMatchInput = {
      content: event.content,
      channelId: event.channelId,
      direction: "outbound",
    };

    const result = await engine.evaluate(input);

    if (result.alert) {
      const alertPayload = alertToEvent(result.alert, {
        toolName: undefined,
        command: undefined,
        agentId: undefined,
        sessionKey: undefined,
        channelId: event.channelId,
        conversationId: event.to,
      });

      broadcast(SECURITY_COACH_EVENTS.ALERT_REQUESTED, alertPayload, { dropIfSlow: true });

      // If the alert requires a decision (e.g. credential leak detected), signal cancellation.
      if (result.alert.requiresDecision) {
        return {
          cancel: true,
          reason: `Security Coach: ${result.alert.title}`,
        };
      }
    }

    // Denied by a saved rule (no alert generated, but not allowed).
    if (!result.allowed && !result.alert) {
      return {
        cancel: true,
        reason: "Security Coach: blocked by saved rule",
      };
    }

    return undefined;
  }

  // -----------------------------------------------------------------------
  // Public surface
  // -----------------------------------------------------------------------

  return {
    beforeToolCall,
    afterToolCall,
    beforeMessageSending,
    onInboundChannelMessage,
    onOutboundChannelMessage,
  };
}

export type SecurityCoachHooks = ReturnType<typeof createSecurityCoachHooks>;
