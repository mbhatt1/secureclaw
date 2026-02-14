/**
 * Unified Configuration Schema
 *
 * Zod schemas for validating all configuration values.
 * Used by the unified config loader to ensure type safety.
 */

import { z } from "zod";
import {
  GATEWAY_DEFAULTS,
  AGENT_DEFAULTS,
  SANDBOX_DEFAULTS,
  BROWSER_DEFAULTS,
  MEDIA_DEFAULTS,
  TTS_DEFAULTS,
  LOGGING_DEFAULTS,
  MEMORY_DEFAULTS,
  SESSION_DEFAULTS,
  SECURITY_COACH_DEFAULTS,
  WEBSOCKET_DEFAULTS,
  MEMORY_MONITOR_DEFAULTS,
  MESSAGE_BUFFER_DEFAULTS,
  AGENT_FEATURE_DEFAULTS,
  IMAGE_DEFAULTS,
  VIDEO_DEFAULTS,
  SQLITE_DEFAULTS,
} from "./defaults.unified.js";

// =============================================================================
// PRIMITIVES
// =============================================================================

const positiveInt = z.number().int().positive();
const nonNegativeInt = z.number().int().nonnegative();
const port = z.number().int().min(1).max(65535);
const percentage = z.number().min(0).max(100);
const milliseconds = z.number().int().nonnegative();
const bytes = z.number().int().nonnegative();

// =============================================================================
// GATEWAY CONFIG
// =============================================================================

export const GatewayConfigSchema = z.object({
  port: port.default(GATEWAY_DEFAULTS.PORT),
  bridgePort: port.default(GATEWAY_DEFAULTS.BRIDGE_PORT),
  browserControlPort: port.default(GATEWAY_DEFAULTS.BROWSER_CONTROL_PORT),
  canvasHostPort: port.default(GATEWAY_DEFAULTS.CANVAS_HOST_PORT),
  browserCdpPortRangeStart: port.default(GATEWAY_DEFAULTS.BROWSER_CDP_PORT_RANGE_START),
  browserCdpPortRangeEnd: port.default(GATEWAY_DEFAULTS.BROWSER_CDP_PORT_RANGE_END),
  maxPayloadBytes: bytes.default(GATEWAY_DEFAULTS.MAX_PAYLOAD_BYTES),
  maxBufferedBytes: bytes.default(GATEWAY_DEFAULTS.MAX_BUFFERED_BYTES),
  maxChatHistoryMessagesBytes: bytes.default(GATEWAY_DEFAULTS.MAX_CHAT_HISTORY_MESSAGES_BYTES),
  handshakeTimeoutMs: milliseconds.default(GATEWAY_DEFAULTS.HANDSHAKE_TIMEOUT_MS),
  tickIntervalMs: milliseconds.default(GATEWAY_DEFAULTS.TICK_INTERVAL_MS),
  healthRefreshIntervalMs: milliseconds.default(GATEWAY_DEFAULTS.HEALTH_REFRESH_INTERVAL_MS),
  dedupeTtlMs: milliseconds.default(GATEWAY_DEFAULTS.DEDUPE_TTL_MS),
  dedupeMax: positiveInt.default(GATEWAY_DEFAULTS.DEDUPE_MAX),
});

// =============================================================================
// AGENT CONFIG
// =============================================================================

export const AgentConfigSchema = z.object({
  provider: z.string().default(AGENT_DEFAULTS.PROVIDER),
  model: z.string().default(AGENT_DEFAULTS.MODEL),
  contextTokens: positiveInt.default(AGENT_DEFAULTS.CONTEXT_TOKENS),
  maxConcurrent: positiveInt.default(AGENT_DEFAULTS.MAX_CONCURRENT),
  subagentMaxConcurrent: positiveInt.default(AGENT_DEFAULTS.SUBAGENT_MAX_CONCURRENT),
  modelMaxTokens: positiveInt.default(AGENT_DEFAULTS.MODEL_MAX_TOKENS),
  thinkingEnabled: z.boolean().default(AGENT_FEATURE_DEFAULTS.THINKING_ENABLED),
  voiceEnabled: z.boolean().default(AGENT_FEATURE_DEFAULTS.VOICE_ENABLED),
  maxContextTokens: positiveInt.default(AGENT_FEATURE_DEFAULTS.MAX_CONTEXT_TOKENS),
});

// =============================================================================
// SANDBOX CONFIG
// =============================================================================

export const SandboxConfigSchema = z.object({
  image: z.string().default(SANDBOX_DEFAULTS.IMAGE),
  containerPrefix: z.string().default(SANDBOX_DEFAULTS.CONTAINER_PREFIX),
  workdir: z.string().default(SANDBOX_DEFAULTS.WORKDIR),
  idleHours: positiveInt.default(SANDBOX_DEFAULTS.IDLE_HOURS),
  maxAgeDays: positiveInt.default(SANDBOX_DEFAULTS.MAX_AGE_DAYS),
  browserImage: z.string().default(SANDBOX_DEFAULTS.BROWSER_IMAGE),
  commonImage: z.string().default(SANDBOX_DEFAULTS.COMMON_IMAGE),
  browserPrefix: z.string().default(SANDBOX_DEFAULTS.BROWSER_PREFIX),
  browserCdpPort: port.default(SANDBOX_DEFAULTS.BROWSER_CDP_PORT),
  browserVncPort: port.default(SANDBOX_DEFAULTS.BROWSER_VNC_PORT),
  browserNovncPort: port.default(SANDBOX_DEFAULTS.BROWSER_NOVNC_PORT),
  browserAutostartTimeoutMs: milliseconds.default(SANDBOX_DEFAULTS.BROWSER_AUTOSTART_TIMEOUT_MS),
  agentWorkspaceMount: z.string().default(SANDBOX_DEFAULTS.AGENT_WORKSPACE_MOUNT),
});

// =============================================================================
// BROWSER CONFIG
// =============================================================================

export const BrowserConfigSchema = z.object({
  enabled: z.boolean().default(BROWSER_DEFAULTS.ENABLED),
  evaluateEnabled: z.boolean().default(BROWSER_DEFAULTS.EVALUATE_ENABLED),
  color: z.string().default(BROWSER_DEFAULTS.COLOR),
  profileName: z.string().default(BROWSER_DEFAULTS.PROFILE_NAME),
  defaultProfileName: z.string().default(BROWSER_DEFAULTS.DEFAULT_PROFILE_NAME),
  aiSnapshotMaxChars: positiveInt.default(BROWSER_DEFAULTS.AI_SNAPSHOT_MAX_CHARS),
  aiSnapshotEfficientMaxChars: positiveInt.default(
    BROWSER_DEFAULTS.AI_SNAPSHOT_EFFICIENT_MAX_CHARS,
  ),
  aiSnapshotEfficientDepth: positiveInt.default(BROWSER_DEFAULTS.AI_SNAPSHOT_EFFICIENT_DEPTH),
});

// =============================================================================
// MEDIA CONFIG
// =============================================================================

export const MediaConfigSchema = z.object({
  maxImageBytes: bytes.default(MEDIA_DEFAULTS.MAX_IMAGE_BYTES),
  maxAudioBytes: bytes.default(MEDIA_DEFAULTS.MAX_AUDIO_BYTES),
  maxVideoBytes: bytes.default(MEDIA_DEFAULTS.MAX_VIDEO_BYTES),
  maxDocumentBytes: bytes.default(MEDIA_DEFAULTS.MAX_DOCUMENT_BYTES),
  storeMaxBytes: bytes.default(MEDIA_DEFAULTS.STORE_MAX_BYTES),
  maxMediaIdChars: positiveInt.default(MEDIA_DEFAULTS.MAX_MEDIA_ID_CHARS),
  inputImageMaxBytes: bytes.default(MEDIA_DEFAULTS.INPUT_IMAGE_MAX_BYTES),
  inputFileMaxBytes: bytes.default(MEDIA_DEFAULTS.INPUT_FILE_MAX_BYTES),
  inputFileMaxChars: positiveInt.default(MEDIA_DEFAULTS.INPUT_FILE_MAX_CHARS),
  inputMaxRedirects: nonNegativeInt.default(MEDIA_DEFAULTS.INPUT_MAX_REDIRECTS),
  inputTimeoutMs: milliseconds.default(MEDIA_DEFAULTS.INPUT_TIMEOUT_MS),
  inputPdfMaxPages: positiveInt.default(MEDIA_DEFAULTS.INPUT_PDF_MAX_PAGES),
  inputPdfMaxPixels: positiveInt.default(MEDIA_DEFAULTS.INPUT_PDF_MAX_PIXELS),
});

// =============================================================================
// IMAGE PROCESSING CONFIG
// =============================================================================

export const ImageConfigSchema = z.object({
  maxWidth: positiveInt.default(IMAGE_DEFAULTS.MAX_WIDTH),
  maxHeight: positiveInt.default(IMAGE_DEFAULTS.MAX_HEIGHT),
  quality: percentage.default(IMAGE_DEFAULTS.QUALITY),
});

// =============================================================================
// VIDEO PROCESSING CONFIG
// =============================================================================

export const VideoConfigSchema = z.object({
  enabled: z.boolean().default(VIDEO_DEFAULTS.ENABLED),
});

// =============================================================================
// TTS CONFIG
// =============================================================================

export const TtsConfigSchema = z.object({
  maxLength: positiveInt.default(TTS_DEFAULTS.MAX_LENGTH),
  maxTextLength: positiveInt.default(TTS_DEFAULTS.MAX_TEXT_LENGTH),
  tempFileCleanupDelayMs: milliseconds.default(TTS_DEFAULTS.TEMP_FILE_CLEANUP_DELAY_MS),
});

// =============================================================================
// LOGGING CONFIG
// =============================================================================

export const LoggingConfigSchema = z.object({
  maxLogAgeMs: milliseconds.default(LOGGING_DEFAULTS.MAX_LOG_AGE_MS),
  flushIntervalMs: milliseconds.default(LOGGING_DEFAULTS.FLUSH_INTERVAL_MS),
  subsystemMaxSegments: positiveInt.default(LOGGING_DEFAULTS.SUBSYSTEM_MAX_SEGMENTS),
});

// =============================================================================
// MEMORY CONFIG
// =============================================================================

export const MemoryConfigSchema = z.object({
  cacheMaxEntries: positiveInt.default(MEMORY_DEFAULTS.CACHE_MAX_ENTRIES),
  syncBatchSize: positiveInt.default(MEMORY_DEFAULTS.SYNC_BATCH_SIZE),
  embeddingCacheMaxMb: positiveInt.default(MEMORY_DEFAULTS.EMBEDDING_CACHE_MAX_MB),
  syncWatch: z.boolean().default(MEMORY_DEFAULTS.SYNC_WATCH),
  syncIntervalMinutes: positiveInt.default(MEMORY_DEFAULTS.SYNC_INTERVAL_MINUTES),
});

// =============================================================================
// SESSION CONFIG
// =============================================================================

export const SessionConfigSchema = z.object({
  managerCacheTtlMs: milliseconds.default(SESSION_DEFAULTS.MANAGER_CACHE_TTL_MS),
  preloadEnabled: z.boolean().default(SESSION_DEFAULTS.PRELOAD_ENABLED),
});

// =============================================================================
// SECURITY COACH CONFIG
// =============================================================================

export const SecurityCoachConfigSchema = z.object({
  llmCacheMaxEntries: positiveInt.default(SECURITY_COACH_DEFAULTS.LLM_CACHE_MAX_ENTRIES),
  llmCacheTtlMs: milliseconds.default(SECURITY_COACH_DEFAULTS.LLM_CACHE_TTL_MS),
  llmMaxLatencyMs: milliseconds.default(SECURITY_COACH_DEFAULTS.LLM_MAX_LATENCY_MS),
});

// =============================================================================
// WEBSOCKET CONFIG
// =============================================================================

export const WebsocketConfigSchema = z.object({
  maxConnections: positiveInt.default(WEBSOCKET_DEFAULTS.MAX_CONNECTIONS),
  idleTimeoutMs: milliseconds.default(WEBSOCKET_DEFAULTS.IDLE_TIMEOUT_MS),
  maxPayloadMb: positiveInt.default(WEBSOCKET_DEFAULTS.MAX_PAYLOAD_MB),
});

// =============================================================================
// MEMORY MONITOR CONFIG
// =============================================================================

export const MemoryMonitorConfigSchema = z.object({
  enabled: z.boolean().default(MEMORY_MONITOR_DEFAULTS.ENABLED),
  maxHeapMb: positiveInt.default(MEMORY_MONITOR_DEFAULTS.MAX_HEAP_MB),
  warningThresholdPct: percentage.default(MEMORY_MONITOR_DEFAULTS.WARNING_THRESHOLD_PCT),
  checkIntervalMs: milliseconds.default(MEMORY_MONITOR_DEFAULTS.CHECK_INTERVAL_MS),
});

// =============================================================================
// MESSAGE BUFFER CONFIG
// =============================================================================

export const MessageBufferConfigSchema = z.object({
  gatewayMessageBufferSize: positiveInt.default(
    MESSAGE_BUFFER_DEFAULTS.GATEWAY_MESSAGE_BUFFER_SIZE,
  ),
  gatewayMessageBufferTtlMs: milliseconds.default(
    MESSAGE_BUFFER_DEFAULTS.GATEWAY_MESSAGE_BUFFER_TTL_MS,
  ),
});

// =============================================================================
// SQLITE CONFIG
// =============================================================================

export const SqliteConfigSchema = z.object({
  walMode: z.boolean().default(SQLITE_DEFAULTS.WAL_MODE),
  cacheSize: z.number().int().default(SQLITE_DEFAULTS.CACHE_SIZE),
  mmapSize: nonNegativeInt.default(SQLITE_DEFAULTS.MMAP_SIZE),
});

// =============================================================================
// UNIFIED CONFIG SCHEMA
// =============================================================================

export const UnifiedConfigSchema = z.object({
  gateway: GatewayConfigSchema.optional(),
  agent: AgentConfigSchema.optional(),
  sandbox: SandboxConfigSchema.optional(),
  browser: BrowserConfigSchema.optional(),
  media: MediaConfigSchema.optional(),
  image: ImageConfigSchema.optional(),
  video: VideoConfigSchema.optional(),
  tts: TtsConfigSchema.optional(),
  logging: LoggingConfigSchema.optional(),
  memory: MemoryConfigSchema.optional(),
  session: SessionConfigSchema.optional(),
  securityCoach: SecurityCoachConfigSchema.optional(),
  websocket: WebsocketConfigSchema.optional(),
  memoryMonitor: MemoryMonitorConfigSchema.optional(),
  messageBuffer: MessageBufferConfigSchema.optional(),
  sqlite: SqliteConfigSchema.optional(),
});

// =============================================================================
// TYPES
// =============================================================================

export type UnifiedConfig = z.infer<typeof UnifiedConfigSchema>;
export type GatewayConfig = z.infer<typeof GatewayConfigSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type SandboxConfig = z.infer<typeof SandboxConfigSchema>;
export type BrowserConfig = z.infer<typeof BrowserConfigSchema>;
export type MediaConfig = z.infer<typeof MediaConfigSchema>;
export type ImageConfig = z.infer<typeof ImageConfigSchema>;
export type VideoConfig = z.infer<typeof VideoConfigSchema>;
export type TtsConfig = z.infer<typeof TtsConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;
export type SessionConfig = z.infer<typeof SessionConfigSchema>;
export type SecurityCoachConfig = z.infer<typeof SecurityCoachConfigSchema>;
export type WebsocketConfig = z.infer<typeof WebsocketConfigSchema>;
export type MemoryMonitorConfig = z.infer<typeof MemoryMonitorConfigSchema>;
export type MessageBufferConfig = z.infer<typeof MessageBufferConfigSchema>;
export type SqliteConfig = z.infer<typeof SqliteConfigSchema>;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate and parse unified config
 */
export function validateUnifiedConfig(input: unknown): {
  success: boolean;
  data?: UnifiedConfig;
  error?: z.ZodError;
} {
  const result = UnifiedConfigSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Get default unified config (all defaults applied)
 */
export function getDefaultUnifiedConfig(): UnifiedConfig {
  return UnifiedConfigSchema.parse({});
}
