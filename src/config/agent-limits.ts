import type { SecureClawConfig } from "./types.js";
// NOTE: Now sourced from unified config. Import from config/defaults.unified.ts instead.
import { AGENT_DEFAULTS } from "./defaults.unified.js";

export const DEFAULT_AGENT_MAX_CONCURRENT = AGENT_DEFAULTS.MAX_CONCURRENT;
export const DEFAULT_SUBAGENT_MAX_CONCURRENT = AGENT_DEFAULTS.SUBAGENT_MAX_CONCURRENT;

export function resolveAgentMaxConcurrent(cfg?: SecureClawConfig): number {
  const raw = cfg?.agents?.defaults?.maxConcurrent;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(1, Math.floor(raw));
  }
  return DEFAULT_AGENT_MAX_CONCURRENT;
}

export function resolveSubagentMaxConcurrent(cfg?: SecureClawConfig): number {
  const raw = cfg?.agents?.defaults?.subagents?.maxConcurrent;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(1, Math.floor(raw));
  }
  return DEFAULT_SUBAGENT_MAX_CONCURRENT;
}
