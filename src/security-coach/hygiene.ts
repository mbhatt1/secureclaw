// ---------------------------------------------------------------------------
// Security Coach — Enterprise Hygiene Scanner
//
// Proactive, scheduled checks for stale access, over-broad permissions,
// unrotated tokens, dormant devices, and other security hygiene issues.
// Think "access review reminder" — the coach nudges users to clean up.
// ---------------------------------------------------------------------------

import { randomUUID } from "node:crypto";
import type { SecurityCoachBroadcastFn } from "./hooks.js";
import { SECURITY_COACH_EVENTS } from "./events.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HygieneFinding = {
  id: string;
  category: HygieneCategory;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  message: string;
  recommendation: string;
  /** Entity type (device, node, token, cron, etc.) */
  entityType: string;
  /** Identifier of the specific entity */
  entityId?: string;
  /** When the entity was last active (ms epoch, 0 = never) */
  lastActiveAt: number;
  /** How long since last activity (ms) */
  staleDurationMs: number;
};

export type HygieneCategory =
  | "stale-device"
  | "stale-node"
  | "stale-token"
  | "stale-allowlist"
  | "stale-cron"
  | "over-broad-permissions"
  | "unrotated-credential"
  | "dormant-rule";

export type HygieneScanInput = {
  /** Paired devices with auth tokens. */
  devices?: Array<{
    deviceId: string;
    approvedAtMs: number;
    tokens?: Record<
      string,
      {
        createdAtMs: number;
        rotatedAtMs?: number;
        revokedAtMs?: number;
        lastUsedAtMs?: number;
        scopes?: string[];
      }
    >;
  }>;

  /** Paired remote nodes. */
  nodes?: Array<{
    nodeId: string;
    approvedAtMs: number;
    lastConnectedAtMs?: number;
    permissions?: Record<string, boolean>;
    caps?: string[];
  }>;

  /** Exec approval allowlist entries. */
  execAllowlist?: Array<{
    pattern: string;
    lastUsedAt?: number;
    lastUsedCommand?: string;
  }>;

  /** Exec approval security level. */
  execSecurityLevel?: string;

  /** Cron jobs. */
  cronJobs?: Array<{
    id: string;
    name: string;
    enabled: boolean;
    createdAtMs: number;
    lastRunAtMs?: number;
    consecutiveErrors?: number;
    lastError?: string;
  }>;

  /** DM access policy for inbound messages. */
  dmPolicy?: string;

  /** Channel allowlist entries (sender permissions). */
  channelAllowlist?: Array<{
    channelId: string;
    senderId: string;
    addedAtMs?: number;
  }>;

  /** Security coach saved rules. */
  coachRules?: Array<{
    id: string;
    patternId: string;
    decision: string;
    createdAt: number;
    hitCount: number;
    lastHitAt: number;
    expiresAt: number;
  }>;
};

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const TOKEN_ROTATION_THRESHOLD_MS = NINETY_DAYS_MS;

// ---------------------------------------------------------------------------
// Scanner
// ---------------------------------------------------------------------------

export function runHygieneCheck(input: HygieneScanInput): HygieneFinding[] {
  const now = Date.now();
  const findings: HygieneFinding[] = [];

  // ── Device tokens ──────────────────────────────────────────────────

  for (const device of input.devices ?? []) {
    for (const [tokenId, token] of Object.entries(device.tokens ?? {})) {
      if (token.revokedAtMs) {
        continue;
      } // Already revoked, skip.

      // Token never used
      if (!token.lastUsedAtMs || token.lastUsedAtMs === 0) {
        const age = now - token.createdAtMs;
        if (age > SEVEN_DAYS_MS) {
          findings.push({
            id: randomUUID(),
            category: "stale-token",
            severity: "medium",
            title: "Device token never used",
            message:
              `Device "${device.deviceId}" has a token created ${formatDuration(age)} ago ` +
              `that has never been used. Unused tokens are a risk — if leaked, no one would ` +
              `notice because there's no baseline of normal activity to compare against.`,
            recommendation:
              "Revoke unused device tokens. If the device was set up but never connected, " +
              "consider removing the pairing entirely.",
            entityType: "device-token",
            entityId: `${device.deviceId}/${tokenId}`,
            lastActiveAt: 0,
            staleDurationMs: age,
          });
        }
        continue;
      }

      // Token not used in 30+ days
      const sinceUsed = now - token.lastUsedAtMs;
      if (sinceUsed > THIRTY_DAYS_MS) {
        findings.push({
          id: randomUUID(),
          category: "stale-device",
          severity: "medium",
          title: "Device inactive for 30+ days",
          message:
            `Device "${device.deviceId}" hasn't been used in ${formatDuration(sinceUsed)}. ` +
            `Dormant device access is a common blind spot — if the device is lost, stolen, ` +
            `or compromised, the attacker has a valid token to your system.`,
          recommendation:
            "If you no longer use this device, revoke its token and remove the pairing. " +
            "If you still use it, great — this is just a reminder to review.",
          entityType: "device",
          entityId: device.deviceId,
          lastActiveAt: token.lastUsedAtMs,
          staleDurationMs: sinceUsed,
        });
      }

      // Token not rotated in 90+ days
      const lastRotation = token.rotatedAtMs ?? token.createdAtMs;
      const sinceRotation = now - lastRotation;
      if (sinceRotation > TOKEN_ROTATION_THRESHOLD_MS) {
        findings.push({
          id: randomUUID(),
          category: "unrotated-credential",
          severity: "low",
          title: "Device token not rotated in 90+ days",
          message:
            `The auth token for device "${device.deviceId}" hasn't been rotated ` +
            `in ${formatDuration(sinceRotation)}. Regular rotation limits the window of ` +
            `exposure if a token is silently compromised.`,
          recommendation:
            "Rotate this device's token from the Devices panel. Consider setting up " +
            "a reminder to rotate tokens quarterly.",
          entityType: "device-token",
          entityId: `${device.deviceId}/${tokenId}`,
          lastActiveAt: lastRotation,
          staleDurationMs: sinceRotation,
        });
      }
    }
  }

  // ── Remote nodes ───────────────────────────────────────────────────

  for (const node of input.nodes ?? []) {
    const lastSeen = node.lastConnectedAtMs ?? 0;
    if (lastSeen === 0) {
      const age = now - node.approvedAtMs;
      if (age > SEVEN_DAYS_MS) {
        findings.push({
          id: randomUUID(),
          category: "stale-node",
          severity: "medium",
          title: "Paired node never connected",
          message:
            `Node "${node.nodeId}" was approved ${formatDuration(age)} ago but has never ` +
            `connected. A paired node that never shows up may indicate a misconfiguration ` +
            `or an abandoned setup leaving an open access path.`,
          recommendation:
            "Remove the pairing if this node is no longer needed. If it should be " +
            "connecting, check its configuration and network access.",
          entityType: "node",
          entityId: node.nodeId,
          lastActiveAt: 0,
          staleDurationMs: age,
        });
      }
    } else {
      const sinceConnected = now - lastSeen;
      if (sinceConnected > THIRTY_DAYS_MS) {
        findings.push({
          id: randomUUID(),
          category: "stale-node",
          severity: "medium",
          title: "Node inactive for 30+ days",
          message:
            `Node "${node.nodeId}" last connected ${formatDuration(sinceConnected)} ago. ` +
            `Stale node pairings are like forgotten backdoors — they provide access to ` +
            `your system but nobody is watching them.`,
          recommendation:
            "Review whether this node is still needed. If not, remove the pairing to " +
            "reduce your attack surface.",
          entityType: "node",
          entityId: node.nodeId,
          lastActiveAt: lastSeen,
          staleDurationMs: sinceConnected,
        });
      }
    }

    // Overly permissive node
    const caps = node.caps ?? [];
    const perms = node.permissions ?? {};
    const hasShellAccess = caps.includes("shell") || perms["shell"];
    const hasFileAccess = caps.includes("files") || perms["files"];
    if (hasShellAccess && hasFileAccess) {
      findings.push({
        id: randomUUID(),
        category: "over-broad-permissions",
        severity: "low",
        title: "Node has both shell and file access",
        message:
          `Node "${node.nodeId}" has both shell execution and file system access. ` +
          `This combination gives the node near-complete control over its host. ` +
          `If the node is compromised, the attacker has full access.`,
        recommendation:
          "Apply the principle of least privilege — only grant the capabilities " +
          "each node actually needs. Review and narrow permissions if possible.",
        entityType: "node",
        entityId: node.nodeId,
        lastActiveAt: node.lastConnectedAtMs ?? 0,
        staleDurationMs: 0,
      });
    }
  }

  // ── Exec approval allowlist ────────────────────────────────────────

  for (const entry of input.execAllowlist ?? []) {
    if (!entry.lastUsedAt || entry.lastUsedAt === 0) {
      continue; // No usage data — skip.
    }
    const sinceUsed = now - entry.lastUsedAt;
    if (sinceUsed > THIRTY_DAYS_MS) {
      findings.push({
        id: randomUUID(),
        category: "stale-allowlist",
        severity: "low",
        title: "Exec allowlist entry unused for 30+ days",
        message:
          `The exec allowlist pattern "${truncate(entry.pattern, 60)}" hasn't matched ` +
          `in ${formatDuration(sinceUsed)}. Stale allowlist entries accumulate over time ` +
          `and silently widen what commands can run without approval.`,
        recommendation:
          "Review your exec allowlist periodically. Remove patterns you no longer need. " +
          "A lean allowlist means tighter control.",
        entityType: "exec-allowlist",
        entityId: entry.pattern,
        lastActiveAt: entry.lastUsedAt,
        staleDurationMs: sinceUsed,
      });
    }
  }

  // Over-broad exec security level
  if (input.execSecurityLevel === "full") {
    findings.push({
      id: randomUUID(),
      category: "over-broad-permissions",
      severity: "high",
      title: "Exec approval set to 'full' (no restrictions)",
      message:
        "Your execution approval level is set to 'full', which means ALL commands " +
        "run without any approval. This bypasses the safety net that prevents " +
        "destructive or malicious commands from executing automatically.",
      recommendation:
        "Consider switching to 'allowlist' mode, which lets approved commands run " +
        "freely while still catching unexpected ones. 'full' mode is only appropriate " +
        "for isolated development environments.",
      entityType: "exec-config",
      entityId: "security-level",
      lastActiveAt: 0,
      staleDurationMs: 0,
    });
  }

  // ── DM policy ──────────────────────────────────────────────────────

  if (input.dmPolicy === "open") {
    findings.push({
      id: randomUUID(),
      category: "over-broad-permissions",
      severity: "medium",
      title: "DM policy is 'open' (anyone can message)",
      message:
        "Your inbound DM policy is set to 'open', which means any phone number or " +
        "account can send messages to your assistant. This exposes you to spam, " +
        "social engineering, and prompt injection attacks from unknown senders.",
      recommendation:
        "Switch to 'pairing' or 'allowlist' mode to control who can interact " +
        "with your assistant. Use pairing codes for new contacts.",
      entityType: "dm-policy",
      entityId: "dm-policy",
      lastActiveAt: 0,
      staleDurationMs: 0,
    });
  }

  // ── Cron jobs ──────────────────────────────────────────────────────

  for (const job of input.cronJobs ?? []) {
    if (!job.enabled) {
      continue;
    }

    // Failing cron jobs
    if (job.consecutiveErrors && job.consecutiveErrors >= 5) {
      findings.push({
        id: randomUUID(),
        category: "stale-cron",
        severity: "medium",
        title: "Cron job failing repeatedly",
        message:
          `Cron job "${job.name}" (${job.id}) has failed ${job.consecutiveErrors} times ` +
          `in a row. Silently failing automations can mask security-relevant tasks — ` +
          `log rotation, backup jobs, or compliance scans may not be running.`,
        recommendation:
          "Check the error logs for this cron job and fix the underlying issue. " +
          "If the job is no longer needed, disable or delete it.",
        entityType: "cron-job",
        entityId: job.id,
        lastActiveAt: job.lastRunAtMs ?? 0,
        staleDurationMs: job.lastRunAtMs ? now - job.lastRunAtMs : 0,
      });
    }

    // Cron job that hasn't run in a long time
    if (job.lastRunAtMs) {
      const sinceRun = now - job.lastRunAtMs;
      if (sinceRun > THIRTY_DAYS_MS) {
        findings.push({
          id: randomUUID(),
          category: "stale-cron",
          severity: "low",
          title: "Cron job hasn't run in 30+ days",
          message:
            `Cron job "${job.name}" is enabled but hasn't run in ${formatDuration(sinceRun)}. ` +
            `It may have a broken schedule, or it may simply be forgotten. Either way, ` +
            `an enabled job that doesn't run deserves attention.`,
          recommendation:
            "Verify the schedule is correct. If the job is no longer needed, " +
            "disable it to keep your automation list clean.",
          entityType: "cron-job",
          entityId: job.id,
          lastActiveAt: job.lastRunAtMs,
          staleDurationMs: sinceRun,
        });
      }
    }
  }

  // ── Security coach rules ───────────────────────────────────────────

  for (const rule of input.coachRules ?? []) {
    // Skip expired rules
    if (rule.expiresAt !== 0 && rule.expiresAt <= now) {
      continue;
    }

    // "allow" rules that haven't been triggered in 30+ days
    if (rule.decision === "allow" && rule.lastHitAt > 0) {
      const sinceHit = now - rule.lastHitAt;
      if (sinceHit > THIRTY_DAYS_MS) {
        findings.push({
          id: randomUUID(),
          category: "dormant-rule",
          severity: "info",
          title: "Security coach 'allow' rule dormant",
          message:
            `You have an "always allow" rule for pattern "${rule.patternId}" that ` +
            `hasn't been triggered in ${formatDuration(sinceHit)}. Dormant allow rules ` +
            `silently bypass future security checks — worth reviewing whether they ` +
            `still reflect your intent.`,
          recommendation:
            "Review your security coach rules periodically. Remove or update rules " +
            "that are no longer relevant.",
          entityType: "coach-rule",
          entityId: rule.id,
          lastActiveAt: rule.lastHitAt,
          staleDurationMs: sinceHit,
        });
      }
    }
  }

  // Sort by severity
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };
  findings.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  return findings;
}

// ---------------------------------------------------------------------------
// Broadcast helper
// ---------------------------------------------------------------------------

/**
 * Run a hygiene check and broadcast any findings as coach alerts.
 */
export function broadcastHygieneFindings(
  findings: HygieneFinding[],
  broadcast: SecurityCoachBroadcastFn,
): void {
  if (findings.length === 0) {
    return;
  }

  // Group into a single summary alert rather than spamming the UI.
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const highCount = findings.filter((f) => f.severity === "high").length;
  const mediumCount = findings.filter((f) => f.severity === "medium").length;
  const total = findings.length;

  const level = criticalCount > 0 ? "warn" : highCount > 0 ? "warn" : "inform";

  const summaryLines = findings.slice(0, 5).map((f) => `• ${f.title}`);
  if (total > 5) {
    summaryLines.push(`• …and ${total - 5} more`);
  }

  broadcast(
    SECURITY_COACH_EVENTS.ALERT_REQUESTED,
    {
      id: randomUUID(),
      level,
      title: `Security hygiene: ${total} finding${total === 1 ? "" : "s"}`,
      coachMessage:
        `I ran a routine check on your setup and found ${total} thing${total === 1 ? "" : "s"} ` +
        `worth reviewing:\n\n${summaryLines.join("\n")}\n\n` +
        `Keeping access tight and cleaning up stale permissions is one of the best ` +
        `things you can do for your security posture.`,
      recommendation:
        "Review each finding and take action where appropriate. Small hygiene " +
        "improvements add up to significantly better security over time.",
      threats: findings.map((f) => ({
        patternId: f.category,
        category: f.category,
        severity: f.severity,
        title: f.title,
        coaching: f.message,
      })),
      requiresDecision: false,
      createdAtMs: Date.now(),
      expiresAtMs: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      context: {
        channelId: "system",
        senderName: "Hygiene Scanner",
      },
    },
    { dropIfSlow: true },
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms: number): string {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return `${years} year${years === 1 ? "" : "s"}`;
  }
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  if (days >= 1) {
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  const hours = Math.floor(ms / (60 * 60 * 1000));
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}
