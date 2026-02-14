// Default service labels (canonical + legacy compatibility)
// NOTE: Now sourced from unified config. Import from config/defaults.unified.ts instead.
import { DAEMON_DEFAULTS } from "../config/defaults.unified.js";

export const GATEWAY_LAUNCH_AGENT_LABEL = DAEMON_DEFAULTS.GATEWAY_LAUNCH_AGENT_LABEL;
export const GATEWAY_SYSTEMD_SERVICE_NAME = DAEMON_DEFAULTS.GATEWAY_SYSTEMD_SERVICE_NAME;
export const GATEWAY_WINDOWS_TASK_NAME = DAEMON_DEFAULTS.GATEWAY_WINDOWS_TASK_NAME;
export const GATEWAY_SERVICE_MARKER = DAEMON_DEFAULTS.GATEWAY_SERVICE_MARKER;
export const GATEWAY_SERVICE_KIND = DAEMON_DEFAULTS.GATEWAY_SERVICE_KIND;
export const NODE_LAUNCH_AGENT_LABEL = DAEMON_DEFAULTS.NODE_LAUNCH_AGENT_LABEL;
export const NODE_SYSTEMD_SERVICE_NAME = DAEMON_DEFAULTS.NODE_SYSTEMD_SERVICE_NAME;
export const NODE_WINDOWS_TASK_NAME = DAEMON_DEFAULTS.NODE_WINDOWS_TASK_NAME;
export const NODE_SERVICE_MARKER = DAEMON_DEFAULTS.NODE_SERVICE_MARKER;
export const NODE_SERVICE_KIND = DAEMON_DEFAULTS.NODE_SERVICE_KIND;
export const NODE_WINDOWS_TASK_SCRIPT_NAME = DAEMON_DEFAULTS.NODE_WINDOWS_TASK_SCRIPT_NAME;
export const LEGACY_GATEWAY_LAUNCH_AGENT_LABELS: string[] = [];
export const LEGACY_GATEWAY_SYSTEMD_SERVICE_NAMES: string[] = [];
export const LEGACY_GATEWAY_WINDOWS_TASK_NAMES: string[] = [];

export function normalizeGatewayProfile(profile?: string): string | null {
  const trimmed = profile?.trim();
  if (!trimmed || trimmed.toLowerCase() === "default") {
    return null;
  }
  return trimmed;
}

export function resolveGatewayProfileSuffix(profile?: string): string {
  const normalized = normalizeGatewayProfile(profile);
  return normalized ? `-${normalized}` : "";
}

export function resolveGatewayLaunchAgentLabel(profile?: string): string {
  const normalized = normalizeGatewayProfile(profile);
  if (!normalized) {
    return GATEWAY_LAUNCH_AGENT_LABEL;
  }
  return `ai.secureclaw.${normalized}`;
}

export function resolveLegacyGatewayLaunchAgentLabels(profile?: string): string[] {
  void profile;
  return [];
}

export function resolveGatewaySystemdServiceName(profile?: string): string {
  const suffix = resolveGatewayProfileSuffix(profile);
  if (!suffix) {
    return GATEWAY_SYSTEMD_SERVICE_NAME;
  }
  return `secureclaw-gateway${suffix}`;
}

export function resolveGatewayWindowsTaskName(profile?: string): string {
  const normalized = normalizeGatewayProfile(profile);
  if (!normalized) {
    return GATEWAY_WINDOWS_TASK_NAME;
  }
  return `SecureClaw Gateway (${normalized})`;
}

export function formatGatewayServiceDescription(params?: {
  profile?: string;
  version?: string;
}): string {
  const profile = normalizeGatewayProfile(params?.profile);
  const version = params?.version?.trim();
  const parts: string[] = [];
  if (profile) {
    parts.push(`profile: ${profile}`);
  }
  if (version) {
    parts.push(`v${version}`);
  }
  if (parts.length === 0) {
    return "SecureClaw Gateway";
  }
  return `SecureClaw Gateway (${parts.join(", ")})`;
}

export function resolveNodeLaunchAgentLabel(): string {
  return NODE_LAUNCH_AGENT_LABEL;
}

export function resolveNodeSystemdServiceName(): string {
  return NODE_SYSTEMD_SERVICE_NAME;
}

export function resolveNodeWindowsTaskName(): string {
  return NODE_WINDOWS_TASK_NAME;
}

export function formatNodeServiceDescription(params?: { version?: string }): string {
  const version = params?.version?.trim();
  if (!version) {
    return "SecureClaw Node Host";
  }
  return `SecureClaw Node Host (v${version})`;
}
