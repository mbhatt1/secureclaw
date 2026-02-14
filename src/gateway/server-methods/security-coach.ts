import type { SecurityCoachAuditLog } from "../../security-coach/audit.js";
import type { SecurityCoachEngine } from "../../security-coach/engine.js";
import type { ExportBundle } from "../../security-coach/export.js";
import type { AlertHistoryStore } from "../../security-coach/history.js";
import type { HygieneScanInput } from "../../security-coach/hygiene.js";
import type { CoachMetrics } from "../../security-coach/metrics.js";
import type { SecurityCoachRuleStore } from "../../security-coach/rules.js";
import type { SiemDispatcher } from "../../security-coach/siem/dispatcher.js";
import type { GatewayClient, GatewayRequestHandlers, RespondFn } from "./types.js";
import { listChannelPlugins } from "../../channels/plugins/index.js";
import { loadConfig } from "../../config/config.js";
import { listDevicePairing } from "../../infra/device-pairing.js";
import { readExecApprovalsSnapshot } from "../../infra/exec-approvals.js";
import { listNodePairing } from "../../infra/node-pairing.js";
import {
  auditAlertResolved,
  auditRuleCreated,
  auditRuleDeleted,
  auditConfigUpdated,
  auditHygieneScan,
} from "../../security-coach/audit.js";
import { SECURITY_COACH_EVENTS } from "../../security-coach/events.js";
import { exportAll, exportRules, mergeRules, validateBundle } from "../../security-coach/export.js";
import { broadcastHygieneFindings, runHygieneCheck } from "../../security-coach/hygiene.js";
import { createDecisionSiemEvent } from "../../security-coach/siem/dispatcher.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";

const ADMIN_SCOPE = "operator.admin";
const SECURITY_COACH_SCOPE = "operator.security-coach";

/** Simple per-client rate limiter for security coach RPC methods. */
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 10_000; // 10 seconds
const RATE_LIMIT_MAX = 50; // max 50 calls per window

function isRateLimited(clientId: string | undefined): boolean {
  if (!clientId) {
    return false;
  } // Can't rate limit without identity
  const now = Date.now();
  let entry = rateLimitMap.get(clientId);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry = { count: 0, windowStart: now };
    rateLimitMap.set(clientId, entry);
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Periodic cleanup to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(key);
    }
  }
}, 60_000).unref();

/**
 * Returns `true` if the client is authorized for the given scope.
 * When the client lacks the required scope, an error response is sent
 * automatically and the function returns `false`.
 */
function requireScope(client: GatewayClient | null, scope: string, respond: RespondFn): boolean {
  if (!client?.connect) {
    respond(
      false,
      undefined,
      errorShape(ErrorCodes.INVALID_REQUEST, "unauthorized: insufficient scope for this operation"),
    );
    return false;
  }

  const scopes = Array.isArray(client.connect.scopes) ? client.connect.scopes : [];

  // Admin scope grants access to everything.
  if (scopes.includes(ADMIN_SCOPE)) {
    return true;
  }

  if (scopes.includes(scope)) {
    return true;
  }

  respond(
    false,
    undefined,
    errorShape(ErrorCodes.INVALID_REQUEST, "unauthorized: insufficient scope for this operation"),
  );
  return false;
}

export function createSecurityCoachHandlers(
  engine: SecurityCoachEngine,
  ruleStore: SecurityCoachRuleStore,
  opts?: {
    auditLog?: SecurityCoachAuditLog;
    metrics?: CoachMetrics;
    history?: AlertHistoryStore;
    siem?: SiemDispatcher;
  },
): GatewayRequestHandlers {
  const auditLog = opts?.auditLog;
  const metrics = opts?.metrics;
  const history = opts?.history;
  const siem = opts?.siem;
  return {
    // -----------------------------------------------------------------------
    // Resolve a pending security alert (user clicked allow/deny in the UI)
    // -----------------------------------------------------------------------
    "security.coach.resolve": async ({ params, respond, client, context }) => {
      if (!requireScope(client, SECURITY_COACH_SCOPE, respond)) {
        return;
      }

      const clientId = client?.connect?.client?.id;
      if (isRateLimited(clientId)) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "rate limited"));
        return;
      }

      if (typeof params.id !== "string" || params.id.trim().length === 0) {
        respond(
          false,
          undefined,
          errorShape(
            ErrorCodes.INVALID_REQUEST,
            "invalid security.coach.resolve params: missing or empty id",
          ),
        );
        return;
      }

      if (typeof params.decision !== "string") {
        respond(
          false,
          undefined,
          errorShape(
            ErrorCodes.INVALID_REQUEST,
            "invalid security.coach.resolve params: missing decision",
          ),
        );
        return;
      }

      const decision = params.decision;
      if (
        decision !== "allow-once" &&
        decision !== "allow-always" &&
        decision !== "deny" &&
        decision !== "learn-more"
      ) {
        respond(
          false,
          undefined,
          errorShape(
            ErrorCodes.INVALID_REQUEST,
            "invalid security.coach.resolve params: decision must be allow-once, allow-always, deny, or learn-more",
          ),
        );
        return;
      }

      const id = params.id.trim();

      // Capture the alert data BEFORE resolving — resolve() deletes
      // the alert from the pending map, so getAlert() would return null
      // after resolve.
      const alertSnapshot = engine.getAlert(id);

      // Use the client ID as a session key proxy for session affinity.
      const sessionKey = client?.connect?.client?.id;
      const ok = engine.resolve(
        id,
        decision as "allow-once" | "allow-always" | "deny" | "learn-more",
        { sessionKey },
      );

      if (!ok) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "unknown alert id"));
        return;
      }

      const resolvedBy = client?.connect?.client?.displayName ?? client?.connect?.client?.id;

      // Audit: resolved.
      if (auditLog) {
        auditAlertResolved(auditLog, id, decision, resolvedBy ?? undefined);
      }

      // SIEM: dispatch decision event.
      siem?.dispatch(createDecisionSiemEvent(id, decision, resolvedBy ?? undefined));

      // When the user chooses "allow-always", persist a rule so the same
      // operation is auto-allowed in the future.
      if (decision === "allow-always") {
        const topThreat = alertSnapshot?.threats?.[0];
        if (topThreat) {
          const newRule = ruleStore.addRule({
            patternId: topThreat.pattern.id,
            matchValue: topThreat.pattern.title,
            decision: "allow",
            expiresAt: 0,
          });
          // Audit: rule created.
          if (auditLog) {
            auditRuleCreated(auditLog, newRule);
          }
          // Best-effort persist to disk.
          void ruleStore.save().catch((err) => {
            context.logGateway?.error?.(`security coach: failed to save rule: ${String(err)}`);
          });
        }
      }

      // OPTIMIZATION: Pre-construct payload to avoid object spread overhead
      const resolvePayload = {
        id,
        decision,
        resolvedBy: resolvedBy ?? null,
        ts: Date.now(),
      };
      context.broadcast(SECURITY_COACH_EVENTS.ALERT_RESOLVED, resolvePayload, { dropIfSlow: true });

      respond(true, { ok: true }, undefined);
    },

    // -----------------------------------------------------------------------
    // Get current security coach config
    // -----------------------------------------------------------------------
    "security.coach.config.get": async ({ respond, client }) => {
      if (!requireScope(client, SECURITY_COACH_SCOPE, respond)) {
        return;
      }

      try {
        const config = engine.getConfig();
        respond(true, { config }, undefined);
      } catch (err) {
        respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "failed to get config"));
      }
    },

    // -----------------------------------------------------------------------
    // Update security coach config
    // -----------------------------------------------------------------------
    "security.coach.config.update": async ({ params, respond, client }) => {
      if (!requireScope(client, ADMIN_SCOPE, respond)) {
        return;
      }

      const clientId = client?.connect?.client?.id;
      if (isRateLimited(clientId)) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "rate limited"));
        return;
      }

      const patch: Record<string, unknown> = {};

      if (typeof params.enabled === "boolean") {
        patch.enabled = params.enabled;
      }
      if (typeof params.minSeverity === "string") {
        const validSeverities = ["critical", "high", "medium", "low", "info"];
        if (!validSeverities.includes(params.minSeverity)) {
          respond(
            false,
            undefined,
            errorShape(
              ErrorCodes.INVALID_REQUEST,
              `invalid minSeverity: must be one of ${validSeverities.join(", ")}`,
            ),
          );
          return;
        }
        patch.minSeverity = params.minSeverity;
      }
      if (typeof params.blockOnCritical === "boolean") {
        patch.blockOnCritical = params.blockOnCritical;
      }
      if (typeof params.decisionTimeoutMs === "number") {
        if (params.decisionTimeoutMs < 5000 || params.decisionTimeoutMs > 300000) {
          respond(
            false,
            undefined,
            errorShape(
              ErrorCodes.INVALID_REQUEST,
              "decisionTimeoutMs must be between 5000 and 300000",
            ),
          );
          return;
        }
        patch.decisionTimeoutMs = params.decisionTimeoutMs;
      }
      if (typeof params.educationalMode === "boolean") {
        patch.educationalMode = params.educationalMode;
      }

      if (Object.keys(patch).length === 0) {
        respond(
          false,
          undefined,
          errorShape(
            ErrorCodes.INVALID_REQUEST,
            "invalid security.coach.config.update params: no valid fields provided",
          ),
        );
        return;
      }

      try {
        engine.updateConfig(patch);
        // Audit: config updated.
        if (auditLog) {
          auditConfigUpdated(auditLog, patch);
        }
        const config = engine.getConfig();
        respond(true, { config }, undefined);
      } catch (err) {
        respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "failed to update config"));
      }
    },

    // -----------------------------------------------------------------------
    // List all saved rules
    // -----------------------------------------------------------------------
    "security.coach.rules.list": async ({ respond, client }) => {
      if (!requireScope(client, SECURITY_COACH_SCOPE, respond)) {
        return;
      }

      try {
        const rules = ruleStore.getAllRules();
        respond(true, { rules }, undefined);
      } catch (err) {
        respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "failed to list rules"));
      }
    },

    // -----------------------------------------------------------------------
    // Delete a saved rule
    // -----------------------------------------------------------------------
    "security.coach.rules.delete": async ({ params, respond, client }) => {
      if (!requireScope(client, ADMIN_SCOPE, respond)) {
        return;
      }

      const clientId = client?.connect?.client?.id;
      if (isRateLimited(clientId)) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "rate limited"));
        return;
      }

      if (typeof params.ruleId !== "string" || params.ruleId.trim().length === 0) {
        respond(
          false,
          undefined,
          errorShape(
            ErrorCodes.INVALID_REQUEST,
            "invalid security.coach.rules.delete params: missing or empty ruleId",
          ),
        );
        return;
      }

      const ruleId = params.ruleId.trim();
      const removed = ruleStore.removeRule(ruleId);

      if (!removed) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "unknown rule id"));
        return;
      }

      // Audit: rule deleted.
      if (auditLog) {
        auditRuleDeleted(auditLog, ruleId);
      }

      // Best-effort persist to disk.
      void ruleStore.save().catch((err) => {
        // We intentionally do not fail the response for a persistence error --
        // the in-memory state is already correct.
        void err;
      });

      respond(true, { ok: true }, undefined);
    },

    // -----------------------------------------------------------------------
    // Get security coach status / stats
    // -----------------------------------------------------------------------
    "security.coach.status": async ({ respond, client }) => {
      if (!requireScope(client, SECURITY_COACH_SCOPE, respond)) {
        return;
      }

      try {
        const pending = engine.getPendingAlerts();
        const config = engine.getConfig();
        const rulesSummary = ruleStore.getSummary();

        respond(
          true,
          {
            enabled: config.enabled,
            pendingAlerts: pending.length,
            rulesTotal: rulesSummary.total,
            rulesAllows: rulesSummary.allows,
            rulesDenies: rulesSummary.denies,
            rulesExpired: rulesSummary.expired,
          },
          undefined,
        );
      } catch (err) {
        respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "failed to get status"));
      }
    },

    // -----------------------------------------------------------------------
    // Get pending alerts
    // -----------------------------------------------------------------------
    "security.coach.alerts.pending": async ({ respond, client }) => {
      if (!requireScope(client, SECURITY_COACH_SCOPE, respond)) {
        return;
      }

      try {
        const alerts = engine.getPendingAlerts();
        respond(true, { alerts }, undefined);
      } catch (err) {
        respond(
          false,
          undefined,
          errorShape(ErrorCodes.UNAVAILABLE, "failed to get pending alerts"),
        );
      }
    },

    // -----------------------------------------------------------------------
    // Run a hygiene scan on-demand
    // -----------------------------------------------------------------------
    "security.coach.hygiene.run": async ({ respond, client, context }) => {
      if (!requireScope(client, ADMIN_SCOPE, respond)) {
        return;
      }

      try {
        const input = await gatherHygieneScanInput(context.cron, ruleStore);
        const findings = runHygieneCheck(input);

        // Audit + metrics: hygiene scan.
        if (auditLog) {
          auditHygieneScan(auditLog, findings.length);
        }
        metrics?.recordHygieneScan(findings.length);

        // Broadcast findings to connected UIs.
        if (findings.length > 0) {
          broadcastHygieneFindings(findings, context.broadcast);
        }

        respond(
          true,
          {
            findings: findings.map((f) => ({
              id: f.id,
              category: f.category,
              severity: f.severity,
              title: f.title,
              message: f.message,
              recommendation: f.recommendation,
              entityType: f.entityType,
              entityId: f.entityId,
            })),
            total: findings.length,
          },
          undefined,
        );
      } catch (err) {
        respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "hygiene scan failed"));
      }
    },

    // -----------------------------------------------------------------------
    // Query alert history
    // -----------------------------------------------------------------------
    "security.coach.history.query": async ({ params, respond, client }) => {
      if (!requireScope(client, SECURITY_COACH_SCOPE, respond)) {
        return;
      }

      if (!history) {
        respond(
          false,
          undefined,
          errorShape(ErrorCodes.UNAVAILABLE, "alert history not available"),
        );
        return;
      }

      try {
        const result = await history.query({
          since: typeof params.since === "number" ? params.since : undefined,
          until: typeof params.until === "number" ? params.until : undefined,
          level: typeof params.level === "string" ? params.level : undefined,
          severity: typeof params.severity === "string" ? params.severity : undefined,
          decision: typeof params.decision === "string" ? params.decision : undefined,
          category: typeof params.category === "string" ? params.category : undefined,
          limit: typeof params.limit === "number" ? params.limit : undefined,
          offset: typeof params.offset === "number" ? params.offset : undefined,
        });
        respond(true, result, undefined);
      } catch (err) {
        respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "history query failed"));
      }
    },

    // -----------------------------------------------------------------------
    // Get metrics snapshot
    // -----------------------------------------------------------------------
    "security.coach.metrics": async ({ respond, client }) => {
      if (!requireScope(client, SECURITY_COACH_SCOPE, respond)) {
        return;
      }

      if (!metrics) {
        respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "metrics not available"));
        return;
      }

      try {
        const snapshot = metrics.getSnapshot();
        respond(true, { metrics: snapshot }, undefined);
      } catch (err) {
        respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "metrics snapshot failed"));
      }
    },

    // -----------------------------------------------------------------------
    // Query audit trail
    // -----------------------------------------------------------------------
    "security.coach.audit.query": async ({ params, respond, client }) => {
      if (!requireScope(client, ADMIN_SCOPE, respond)) {
        return;
      }

      if (!auditLog) {
        respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "audit log not available"));
        return;
      }

      try {
        const entries = await auditLog.query({
          since: typeof params.since === "number" ? params.since : undefined,
          until: typeof params.until === "number" ? params.until : undefined,
          type: typeof params.type === "string" ? params.type : undefined,
          limit: typeof params.limit === "number" ? params.limit : undefined,
        });
        respond(true, { entries, total: entries.length }, undefined);
      } catch (err) {
        respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "audit query failed"));
      }
    },

    // -----------------------------------------------------------------------
    // Export rules and/or config
    // -----------------------------------------------------------------------
    "security.coach.export": async ({ params, respond, client }) => {
      if (!requireScope(client, ADMIN_SCOPE, respond)) {
        return;
      }

      try {
        const includeRules = params.rules !== false;
        const includeConfig = params.config !== false;

        let bundle: ExportBundle;
        if (includeRules && includeConfig) {
          bundle = exportAll(
            ruleStore.getAllRules(),
            engine.getConfig(),
            typeof params.metadata === "object" && params.metadata !== null
              ? (params.metadata as ExportBundle["metadata"])
              : undefined,
          );
        } else if (includeRules) {
          bundle = exportRules(ruleStore.getAllRules());
        } else {
          bundle = exportAll([], engine.getConfig());
        }

        respond(true, { bundle }, undefined);
      } catch (err) {
        respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "export failed"));
      }
    },

    // -----------------------------------------------------------------------
    // Import rules and/or config from a bundle
    // -----------------------------------------------------------------------
    "security.coach.import": async ({ params, respond, client }) => {
      if (!requireScope(client, ADMIN_SCOPE, respond)) {
        return;
      }

      const clientId = client?.connect?.client?.id;
      if (isRateLimited(clientId)) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "rate limited"));
        return;
      }

      if (typeof params.bundle !== "object" || params.bundle === null) {
        respond(
          false,
          undefined,
          errorShape(ErrorCodes.INVALID_REQUEST, "invalid params: missing bundle object"),
        );
        return;
      }

      try {
        if (!validateBundle(params.bundle)) {
          respond(
            false,
            undefined,
            errorShape(ErrorCodes.INVALID_REQUEST, "invalid bundle format"),
          );
          return;
        }

        const bundle = params.bundle;
        const strategy =
          typeof params.strategy === "string" &&
          (params.strategy === "replace" ||
            params.strategy === "merge" ||
            params.strategy === "append")
            ? params.strategy
            : "merge";

        let rulesImported = 0;
        let configImported = false;

        // Import rules.
        if (bundle.rules && bundle.rules.length > 0) {
          const existing = ruleStore.getAllRules();
          const merged = mergeRules(existing, bundle.rules, strategy);

          // Replace all rules with the merged set.
          // Remove all existing, then add merged.
          for (const rule of existing) {
            ruleStore.removeRule(rule.id);
          }
          for (const rule of merged) {
            ruleStore.addRule({
              patternId: rule.patternId,
              matchValue: rule.matchValue,
              decision: rule.decision,
              expiresAt: rule.expiresAt,
              note: rule.note,
            });
          }
          rulesImported = merged.length;
          void ruleStore.save().catch(() => {
            /* best-effort */
          });
        }

        // Import config.
        if (bundle.config) {
          engine.updateConfig(bundle.config);
          configImported = true;
          if (auditLog) {
            auditConfigUpdated(auditLog, bundle.config);
          }
        }

        respond(true, { rulesImported, configImported, strategy }, undefined);
      } catch (err) {
        respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "import failed"));
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Hygiene data gathering
// ---------------------------------------------------------------------------

/**
 * Collect data from all system stores to feed the hygiene scanner.
 */
export async function gatherHygieneScanInput(
  cron: {
    list: (opts?: { includeDisabled?: boolean }) => Promise<
      Array<{
        id: string;
        name: string;
        enabled: boolean;
        createdAtMs: number;
        state: {
          lastRunAtMs?: number;
          consecutiveErrors?: number;
          lastError?: string;
        };
      }>
    >;
  },
  ruleStore: SecurityCoachRuleStore,
): Promise<HygieneScanInput> {
  const [devicePairing, nodePairing, execSnapshot, cronJobs] = await Promise.all([
    listDevicePairing().catch(() => ({ pending: [], paired: [] })),
    listNodePairing().catch(() => ({ pending: [], paired: [] })),
    Promise.resolve(readExecApprovalsSnapshot()).catch(() => null),
    cron.list({ includeDisabled: true }).catch(() => []),
  ]);

  // Map device pairing data.
  const devices = devicePairing.paired.map((d) => ({
    deviceId: d.deviceId,
    approvedAtMs: d.approvedAtMs,
    tokens: d.tokens
      ? Object.fromEntries(
          Object.entries(d.tokens).map(([id, t]) => [
            id,
            {
              createdAtMs: t.createdAtMs,
              rotatedAtMs: t.rotatedAtMs,
              revokedAtMs: t.revokedAtMs,
              lastUsedAtMs: t.lastUsedAtMs,
              scopes: t.scopes,
            },
          ]),
        )
      : undefined,
  }));

  // Map node pairing data.
  const nodes = nodePairing.paired.map((n) => ({
    nodeId: n.nodeId,
    approvedAtMs: n.approvedAtMs,
    lastConnectedAtMs: n.lastConnectedAtMs,
    permissions: n.permissions,
    caps: n.caps,
  }));

  // Map exec approvals data.
  const execFile = execSnapshot?.file;
  const defaultSecurity = execFile?.defaults?.security;
  const allAllowlistEntries: HygieneScanInput["execAllowlist"] = [];
  if (execFile?.defaults) {
    // There's no top-level allowlist on defaults, only per-agent.
  }
  if (execFile?.agents) {
    for (const agent of Object.values(execFile.agents)) {
      for (const entry of agent.allowlist ?? []) {
        allAllowlistEntries.push({
          pattern: entry.pattern,
          lastUsedAt: entry.lastUsedAt,
          lastUsedCommand: entry.lastUsedCommand,
        });
      }
    }
  }

  // Gather DM policies across all channels.
  let dmPolicy: string | undefined;
  try {
    const cfg = loadConfig();
    const channelIds = listChannelPlugins().map((p) => p.id);
    for (const chId of channelIds) {
      const chCfg = cfg.channels?.[chId] as { dmPolicy?: string } | undefined;
      if (chCfg?.dmPolicy === "open") {
        dmPolicy = "open";
        break;
      }
    }
  } catch {
    // Config not available — skip DM policy check.
  }

  // Map cron jobs.
  const cronJobsMapped = cronJobs.map((j) => ({
    id: j.id,
    name: j.name,
    enabled: j.enabled,
    createdAtMs: j.createdAtMs,
    lastRunAtMs: j.state.lastRunAtMs,
    consecutiveErrors: j.state.consecutiveErrors,
    lastError: j.state.lastError,
  }));

  // Map coach rules.
  const coachRules = ruleStore.getAllRules().map((r) => ({
    id: r.id,
    patternId: r.patternId,
    decision: r.decision,
    createdAt: r.createdAt,
    hitCount: r.hitCount,
    lastHitAt: r.lastHitAt,
    expiresAt: r.expiresAt,
  }));

  return {
    devices,
    nodes,
    execAllowlist: allAllowlistEntries,
    execSecurityLevel: defaultSecurity,
    cronJobs: cronJobsMapped,
    dmPolicy,
    coachRules,
  };
}
