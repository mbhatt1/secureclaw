// NOTE: Now sourced from unified config. Import from config/defaults.unified.ts instead.
import { GATEWAY_DEFAULTS } from "../config/defaults.unified.js";

export const MAX_PAYLOAD_BYTES = GATEWAY_DEFAULTS.MAX_PAYLOAD_BYTES;
export const MAX_BUFFERED_BYTES = GATEWAY_DEFAULTS.MAX_BUFFERED_BYTES;

const DEFAULT_MAX_CHAT_HISTORY_MESSAGES_BYTES = GATEWAY_DEFAULTS.MAX_CHAT_HISTORY_MESSAGES_BYTES;
let maxChatHistoryMessagesBytes = DEFAULT_MAX_CHAT_HISTORY_MESSAGES_BYTES;

export const getMaxChatHistoryMessagesBytes = () => maxChatHistoryMessagesBytes;

export const __setMaxChatHistoryMessagesBytesForTest = (value?: number) => {
  if (!process.env.VITEST && process.env.NODE_ENV !== "test") {
    return;
  }
  if (value === undefined) {
    maxChatHistoryMessagesBytes = DEFAULT_MAX_CHAT_HISTORY_MESSAGES_BYTES;
    return;
  }
  if (Number.isFinite(value) && value > 0) {
    maxChatHistoryMessagesBytes = value;
  }
};
export const DEFAULT_HANDSHAKE_TIMEOUT_MS = GATEWAY_DEFAULTS.HANDSHAKE_TIMEOUT_MS;
export const getHandshakeTimeoutMs = () => {
  if (process.env.VITEST && process.env.SECURECLAW_TEST_HANDSHAKE_TIMEOUT_MS) {
    const parsed = Number(process.env.SECURECLAW_TEST_HANDSHAKE_TIMEOUT_MS);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_HANDSHAKE_TIMEOUT_MS;
};
export const TICK_INTERVAL_MS = GATEWAY_DEFAULTS.TICK_INTERVAL_MS;
export const HEALTH_REFRESH_INTERVAL_MS = GATEWAY_DEFAULTS.HEALTH_REFRESH_INTERVAL_MS;
export const DEDUPE_TTL_MS = GATEWAY_DEFAULTS.DEDUPE_TTL_MS;
export const DEDUPE_MAX = GATEWAY_DEFAULTS.DEDUPE_MAX;
