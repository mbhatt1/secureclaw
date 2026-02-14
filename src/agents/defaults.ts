// Defaults for agent metadata when upstream does not supply them.
// Model id uses pi-ai's built-in Anthropic catalog.
// NOTE: Now sourced from unified config. Import from config/defaults.unified.ts instead.
import { AGENT_DEFAULTS } from "../config/defaults.unified.js";

export const DEFAULT_PROVIDER = AGENT_DEFAULTS.PROVIDER;
export const DEFAULT_MODEL = AGENT_DEFAULTS.MODEL;
// Conservative fallback used when model metadata is unavailable.
export const DEFAULT_CONTEXT_TOKENS = AGENT_DEFAULTS.CONTEXT_TOKENS;
