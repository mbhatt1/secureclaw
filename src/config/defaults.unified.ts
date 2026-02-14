/**
 * Unified Configuration Defaults
 *
 * Single source of truth for all default configuration values.
 * Organized by domain for easy discovery and maintenance.
 *
 * DO NOT hardcode these values elsewhere - import from here.
 */

// =============================================================================
// GATEWAY
// =============================================================================

export const GATEWAY_DEFAULTS = {
  /** Default gateway port */
  PORT: 18789,
  /** Default bridge port offset from gateway port */
  BRIDGE_PORT: 18790,
  /** Default browser control port offset from gateway port */
  BROWSER_CONTROL_PORT: 18791,
  /** Default canvas host port offset from gateway port */
  CANVAS_HOST_PORT: 18793,
  /** Default browser CDP port range start */
  BROWSER_CDP_PORT_RANGE_START: 18800,
  /** Default browser CDP port range end */
  BROWSER_CDP_PORT_RANGE_END: 18899,
  /** Max WebSocket payload size in bytes */
  MAX_PAYLOAD_BYTES: 8 * 1024 * 1024, // 8MB
  /** Max buffered bytes per connection */
  MAX_BUFFERED_BYTES: 16 * 1024 * 1024, // 16MB
  /** Max chat history messages bytes */
  MAX_CHAT_HISTORY_MESSAGES_BYTES: 6 * 1024 * 1024, // 6MB
  /** WebSocket handshake timeout in milliseconds */
  HANDSHAKE_TIMEOUT_MS: 10_000,
  /** Health check tick interval in milliseconds */
  TICK_INTERVAL_MS: 30_000,
  /** Health refresh interval in milliseconds */
  HEALTH_REFRESH_INTERVAL_MS: 60_000,
  /** Dedupe cache TTL in milliseconds */
  DEDUPE_TTL_MS: 5 * 60_000, // 5 minutes
  /** Max dedupe cache entries */
  DEDUPE_MAX: 1000,
} as const;

// =============================================================================
// AGENTS
// =============================================================================

export const AGENT_DEFAULTS = {
  /** Default model provider */
  PROVIDER: "anthropic",
  /** Default model ID */
  MODEL: "claude-opus-4-6",
  /** Default context window size (tokens) */
  CONTEXT_TOKENS: 200_000,
  /** Default max concurrent agents */
  MAX_CONCURRENT: 4,
  /** Default max concurrent subagents */
  SUBAGENT_MAX_CONCURRENT: 8,
  /** Default model max tokens */
  MODEL_MAX_TOKENS: 8192,
} as const;

// =============================================================================
// SANDBOX
// =============================================================================

export const SANDBOX_DEFAULTS = {
  /** Default sandbox Docker image */
  IMAGE: "secureclaw-sandbox:bookworm-slim",
  /** Default sandbox container prefix */
  CONTAINER_PREFIX: "secureclaw-sbx-",
  /** Default sandbox working directory inside container */
  WORKDIR: "/workspace",
  /** Default sandbox idle hours before cleanup */
  IDLE_HOURS: 24,
  /** Default sandbox max age in days */
  MAX_AGE_DAYS: 7,
  /** Default browser sandbox image */
  BROWSER_IMAGE: "secureclaw-sandbox-browser:bookworm-slim",
  /** Default common sandbox image */
  COMMON_IMAGE: "secureclaw-sandbox-common:bookworm-slim",
  /** Default browser sandbox prefix */
  BROWSER_PREFIX: "secureclaw-sbx-browser-",
  /** Default browser CDP port */
  BROWSER_CDP_PORT: 9222,
  /** Default browser VNC port */
  BROWSER_VNC_PORT: 5900,
  /** Default browser noVNC port */
  BROWSER_NOVNC_PORT: 6080,
  /** Default browser autostart timeout in milliseconds */
  BROWSER_AUTOSTART_TIMEOUT_MS: 12_000,
  /** Agent workspace mount path */
  AGENT_WORKSPACE_MOUNT: "/agent",
} as const;

// =============================================================================
// BROWSER
// =============================================================================

export const BROWSER_DEFAULTS = {
  /** Browser feature enabled by default */
  ENABLED: true,
  /** Browser evaluate enabled by default */
  EVALUATE_ENABLED: true,
  /** Browser color (SecureClaw theme) */
  COLOR: "#FF4500",
  /** SecureClaw browser profile name */
  PROFILE_NAME: "secureclaw",
  /** Default Chrome profile name */
  DEFAULT_PROFILE_NAME: "chrome",
  /** Max characters for AI snapshot */
  AI_SNAPSHOT_MAX_CHARS: 80_000,
  /** Max characters for efficient AI snapshot */
  AI_SNAPSHOT_EFFICIENT_MAX_CHARS: 10_000,
  /** Depth for efficient AI snapshot */
  AI_SNAPSHOT_EFFICIENT_DEPTH: 6,
} as const;

// =============================================================================
// MEDIA
// =============================================================================

export const MEDIA_DEFAULTS = {
  /** Max image size in bytes */
  MAX_IMAGE_BYTES: 6 * 1024 * 1024, // 6MB
  /** Max audio size in bytes */
  MAX_AUDIO_BYTES: 16 * 1024 * 1024, // 16MB
  /** Max video size in bytes */
  MAX_VIDEO_BYTES: 16 * 1024 * 1024, // 16MB
  /** Max document size in bytes */
  MAX_DOCUMENT_BYTES: 100 * 1024 * 1024, // 100MB
  /** Default media store max bytes */
  STORE_MAX_BYTES: 5 * 1024 * 1024, // 5MB
  /** Max media ID characters */
  MAX_MEDIA_ID_CHARS: 200,
  /** Input image max bytes */
  INPUT_IMAGE_MAX_BYTES: 10 * 1024 * 1024, // 10MB
  /** Input file max bytes */
  INPUT_FILE_MAX_BYTES: 5 * 1024 * 1024, // 5MB
  /** Input file max characters */
  INPUT_FILE_MAX_CHARS: 200_000,
  /** Input max HTTP redirects */
  INPUT_MAX_REDIRECTS: 3,
  /** Input fetch timeout in milliseconds */
  INPUT_TIMEOUT_MS: 10_000,
  /** Input PDF max pages */
  INPUT_PDF_MAX_PAGES: 4,
  /** Input PDF max pixels */
  INPUT_PDF_MAX_PIXELS: 4_000_000,
} as const;

// =============================================================================
// TTS (Text-to-Speech)
// =============================================================================

export const TTS_DEFAULTS = {
  /** Max TTS text length */
  MAX_LENGTH: 1500,
  /** Max text length for TTS processing */
  MAX_TEXT_LENGTH: 4096,
  /** Temp file cleanup delay in milliseconds */
  TEMP_FILE_CLEANUP_DELAY_MS: 5 * 60 * 1000, // 5 minutes
} as const;

// =============================================================================
// LOGGING
// =============================================================================

export const LOGGING_DEFAULTS = {
  /** Max log age in milliseconds */
  MAX_LOG_AGE_MS: 24 * 60 * 60 * 1000, // 24 hours
  /** Log flush interval in milliseconds */
  FLUSH_INTERVAL_MS: 5000,
  /** Max subsystem name segments */
  SUBSYSTEM_MAX_SEGMENTS: 2,
} as const;

// =============================================================================
// DAEMON SERVICES
// =============================================================================

export const DAEMON_DEFAULTS = {
  /** Gateway launchd service label */
  GATEWAY_LAUNCH_AGENT_LABEL: "ai.secureclaw.gateway",
  /** Gateway systemd service name */
  GATEWAY_SYSTEMD_SERVICE_NAME: "secureclaw-gateway",
  /** Gateway Windows task name */
  GATEWAY_WINDOWS_TASK_NAME: "SecureClaw Gateway",
  /** Gateway service marker */
  GATEWAY_SERVICE_MARKER: "secureclaw",
  /** Gateway service kind */
  GATEWAY_SERVICE_KIND: "gateway",
  /** Node launchd service label */
  NODE_LAUNCH_AGENT_LABEL: "ai.secureclaw.node",
  /** Node systemd service name */
  NODE_SYSTEMD_SERVICE_NAME: "secureclaw-node",
  /** Node Windows task name */
  NODE_WINDOWS_TASK_NAME: "SecureClaw Node",
  /** Node service marker */
  NODE_SERVICE_MARKER: "secureclaw",
  /** Node service kind */
  NODE_SERVICE_KIND: "node",
  /** Node Windows task script name */
  NODE_WINDOWS_TASK_SCRIPT_NAME: "node.cmd",
} as const;

// =============================================================================
// MODEL ALIASES
// =============================================================================

export const MODEL_ALIASES = {
  // Anthropic (pi-ai catalog uses "latest" ids without date suffix)
  opus: "anthropic/claude-opus-4-6",
  sonnet: "anthropic/claude-sonnet-4-5",
  // OpenAI
  gpt: "openai/gpt-5.2",
  "gpt-mini": "openai/gpt-5-mini",
  // Google Gemini (3.x are preview ids in the catalog)
  gemini: "google/gemini-3-pro-preview",
  "gemini-flash": "google/gemini-3-flash-preview",
} as const;

// =============================================================================
// MODEL COST DEFAULTS
// =============================================================================

export const MODEL_COST_DEFAULTS = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
} as const;

// =============================================================================
// PATHS
// =============================================================================

export const PATH_DEFAULTS = {
  /** Default state directory name */
  STATE_DIRNAME: ".secureclaw",
  /** Config filename */
  CONFIG_FILENAME: "secureclaw.json",
  /** OAuth filename */
  OAUTH_FILENAME: "oauth.json",
  /** Node config filename */
  NODE_CONFIG_FILENAME: "node.json",
  /** Legacy state directory names */
  LEGACY_STATE_DIRNAMES: [".openclaw", ".clawdbot", ".moltbot", ".moldbot"] as const,
  /** Legacy config filenames */
  LEGACY_CONFIG_FILENAMES: [
    "openclaw.json",
    "clawdbot.json",
    "moltbot.json",
    "moldbot.json",
  ] as const,
} as const;

// =============================================================================
// RASPBERRY PI PROFILES
// =============================================================================

export const RASPBERRY_PI_PROFILES = {
  "raspberry-pi-4-2gb": {
    description: "Raspberry Pi 4 with 2GB RAM - Ultra-lightweight",
    target: "<5s startup, <80MB idle RAM, <1W idle power",
  },
  "raspberry-pi-4-4gb": {
    description: "Raspberry Pi 4 with 4GB RAM - Balanced",
    target: "<5s startup, <100MB idle RAM, <1W idle power",
  },
  "raspberry-pi-4-8gb": {
    description: "Raspberry Pi 4 with 8GB RAM - Full features",
    target: "<5s startup, <150MB idle RAM, <1.2W idle power",
  },
  "raspberry-pi-5": {
    description: "Raspberry Pi 5 - High performance",
    target: "<3s startup, <200MB idle RAM, <2W idle power",
  },
} as const;

// =============================================================================
// MEMORY & EMBEDDINGS
// =============================================================================

export const MEMORY_DEFAULTS = {
  /** Default embedding cache max entries */
  CACHE_MAX_ENTRIES: 5000,
  /** Default memory sync batch size */
  SYNC_BATCH_SIZE: 50,
  /** Default embedding cache max MB */
  EMBEDDING_CACHE_MAX_MB: 50,
  /** Default memory sync watch enabled */
  SYNC_WATCH: false,
  /** Default memory sync interval in minutes */
  SYNC_INTERVAL_MINUTES: 30,
} as const;

// =============================================================================
// SESSION MANAGER
// =============================================================================

export const SESSION_DEFAULTS = {
  /** Default session manager cache TTL in milliseconds */
  MANAGER_CACHE_TTL_MS: 45000,
  /** Default session preload enabled */
  PRELOAD_ENABLED: false,
} as const;

// =============================================================================
// SECURITY COACH
// =============================================================================

export const SECURITY_COACH_DEFAULTS = {
  /** LLM cache max entries */
  LLM_CACHE_MAX_ENTRIES: 1000,
  /** LLM cache TTL in milliseconds */
  LLM_CACHE_TTL_MS: 3600000, // 1 hour
  /** LLM max latency in milliseconds */
  LLM_MAX_LATENCY_MS: 2000,
} as const;

// =============================================================================
// WEBSOCKET POOL
// =============================================================================

export const WEBSOCKET_DEFAULTS = {
  /** Max concurrent WebSocket connections */
  MAX_CONNECTIONS: 20,
  /** Idle timeout in milliseconds */
  IDLE_TIMEOUT_MS: 300000, // 5 minutes
  /** Max payload in MB */
  MAX_PAYLOAD_MB: 16,
} as const;

// =============================================================================
// MEMORY MONITORING
// =============================================================================

export const MEMORY_MONITOR_DEFAULTS = {
  /** Memory monitor enabled by default */
  ENABLED: true,
  /** Max heap in MB */
  MAX_HEAP_MB: 450,
  /** Warning threshold percentage */
  WARNING_THRESHOLD_PCT: 80,
  /** Check interval in milliseconds */
  CHECK_INTERVAL_MS: 30000,
} as const;

// =============================================================================
// MESSAGE BUFFER
// =============================================================================

export const MESSAGE_BUFFER_DEFAULTS = {
  /** Gateway message buffer size */
  GATEWAY_MESSAGE_BUFFER_SIZE: 1000,
  /** Gateway message buffer TTL in milliseconds */
  GATEWAY_MESSAGE_BUFFER_TTL_MS: 300000, // 5 minutes
} as const;

// =============================================================================
// AGENT FEATURES
// =============================================================================

export const AGENT_FEATURE_DEFAULTS = {
  /** Agent thinking enabled by default */
  THINKING_ENABLED: false,
  /** Agent voice enabled by default */
  VOICE_ENABLED: false,
  /** Max context tokens */
  MAX_CONTEXT_TOKENS: 100000,
} as const;

// =============================================================================
// IMAGE PROCESSING
// =============================================================================

export const IMAGE_DEFAULTS = {
  /** Max image width */
  MAX_WIDTH: 1920,
  /** Max image height */
  MAX_HEIGHT: 1080,
  /** Image quality percentage */
  QUALITY: 80,
} as const;

// =============================================================================
// VIDEO PROCESSING
// =============================================================================

export const VIDEO_DEFAULTS = {
  /** Video processing enabled by default */
  ENABLED: false,
} as const;

// =============================================================================
// SQLITE
// =============================================================================

export const SQLITE_DEFAULTS = {
  /** WAL mode enabled by default */
  WAL_MODE: true,
  /** Cache size in KB (negative means KB) */
  CACHE_SIZE: -2000, // 2MB
  /** MMAP size (0 = disabled) */
  MMAP_SIZE: 0,
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all default values as a flat object
 * Useful for documentation or debugging
 */
export function getAllDefaults() {
  return {
    gateway: GATEWAY_DEFAULTS,
    agents: AGENT_DEFAULTS,
    sandbox: SANDBOX_DEFAULTS,
    browser: BROWSER_DEFAULTS,
    media: MEDIA_DEFAULTS,
    tts: TTS_DEFAULTS,
    logging: LOGGING_DEFAULTS,
    daemon: DAEMON_DEFAULTS,
    modelAliases: MODEL_ALIASES,
    modelCost: MODEL_COST_DEFAULTS,
    paths: PATH_DEFAULTS,
    raspberryPiProfiles: RASPBERRY_PI_PROFILES,
    memory: MEMORY_DEFAULTS,
    session: SESSION_DEFAULTS,
    securityCoach: SECURITY_COACH_DEFAULTS,
    websocket: WEBSOCKET_DEFAULTS,
    memoryMonitor: MEMORY_MONITOR_DEFAULTS,
    messageBuffer: MESSAGE_BUFFER_DEFAULTS,
    agentFeatures: AGENT_FEATURE_DEFAULTS,
    image: IMAGE_DEFAULTS,
    video: VIDEO_DEFAULTS,
    sqlite: SQLITE_DEFAULTS,
  } as const;
}

/**
 * Type for all defaults
 */
export type AllDefaults = ReturnType<typeof getAllDefaults>;
