import path from "node:path";
import { CHANNEL_IDS } from "../../channels/registry.js";
import { STATE_DIR } from "../../config/config.js";
// NOTE: Now sourced from unified config. Import from config/defaults.unified.ts instead.
import { SANDBOX_DEFAULTS } from "../../config/defaults.unified.js";

export const DEFAULT_SANDBOX_WORKSPACE_ROOT = path.join(STATE_DIR, "sandboxes");

export const DEFAULT_SANDBOX_IMAGE = SANDBOX_DEFAULTS.IMAGE;
export const DEFAULT_SANDBOX_CONTAINER_PREFIX = SANDBOX_DEFAULTS.CONTAINER_PREFIX;
export const DEFAULT_SANDBOX_WORKDIR = SANDBOX_DEFAULTS.WORKDIR;
export const DEFAULT_SANDBOX_IDLE_HOURS = SANDBOX_DEFAULTS.IDLE_HOURS;
export const DEFAULT_SANDBOX_MAX_AGE_DAYS = SANDBOX_DEFAULTS.MAX_AGE_DAYS;

export const DEFAULT_TOOL_ALLOW = [
  "exec",
  "process",
  "read",
  "write",
  "edit",
  "apply_patch",
  "image",
  "sessions_list",
  "sessions_history",
  "sessions_send",
  "sessions_spawn",
  "session_status",
] as const;

// Provider docking: keep sandbox policy aligned with provider tool names.
export const DEFAULT_TOOL_DENY = [
  "browser",
  "canvas",
  "nodes",
  "cron",
  "gateway",
  ...CHANNEL_IDS,
] as const;

export const DEFAULT_SANDBOX_BROWSER_IMAGE = SANDBOX_DEFAULTS.BROWSER_IMAGE;
export const DEFAULT_SANDBOX_COMMON_IMAGE = SANDBOX_DEFAULTS.COMMON_IMAGE;

export const DEFAULT_SANDBOX_BROWSER_PREFIX = SANDBOX_DEFAULTS.BROWSER_PREFIX;
export const DEFAULT_SANDBOX_BROWSER_CDP_PORT = SANDBOX_DEFAULTS.BROWSER_CDP_PORT;
export const DEFAULT_SANDBOX_BROWSER_VNC_PORT = SANDBOX_DEFAULTS.BROWSER_VNC_PORT;
export const DEFAULT_SANDBOX_BROWSER_NOVNC_PORT = SANDBOX_DEFAULTS.BROWSER_NOVNC_PORT;
export const DEFAULT_SANDBOX_BROWSER_AUTOSTART_TIMEOUT_MS =
  SANDBOX_DEFAULTS.BROWSER_AUTOSTART_TIMEOUT_MS;

export const SANDBOX_AGENT_WORKSPACE_MOUNT = SANDBOX_DEFAULTS.AGENT_WORKSPACE_MOUNT;

export const SANDBOX_STATE_DIR = path.join(STATE_DIR, "sandbox");
export const SANDBOX_REGISTRY_PATH = path.join(SANDBOX_STATE_DIR, "containers.json");
export const SANDBOX_BROWSER_REGISTRY_PATH = path.join(SANDBOX_STATE_DIR, "browsers.json");
