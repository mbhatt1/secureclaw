/**
 * Unified Configuration Loader
 *
 * ONE loader to rule them all.
 * Loads config from multiple sources with proper precedence:
 * 1. Process environment variables (highest priority)
 * 2. ./.env (local development)
 * 3. ~/.secureclaw/.env (user config)
 * 4. Profile-specific .env (e.g., .env.pi)
 * 5. secureclaw.json (lowest priority for these runtime settings)
 *
 * Note: secureclaw.json is still the main config file for most settings.
 * This loader handles runtime overrides and environment-specific settings.
 */

import { config as dotenvConfig } from "dotenv";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { UnifiedConfig } from "./schema.unified.js";
import { tryParseInt } from "../utils/safe-parse.js";
import { resolveStateDir } from "./paths.js";
import { UnifiedConfigSchema, validateUnifiedConfig } from "./schema.unified.js";

// =============================================================================
// TYPES
// =============================================================================

export interface LoadConfigOptions {
  /** Custom state directory (default: resolveStateDir()) */
  stateDir?: string;
  /** Profile name to load (e.g., "raspberry-pi-4-4gb") */
  profile?: string;
  /** Skip loading .env files */
  skipDotenv?: boolean;
  /** Custom environment object (default: process.env) */
  env?: NodeJS.ProcessEnv;
}

export interface LoadConfigResult {
  config: UnifiedConfig;
  sources: string[];
  errors: string[];
}

// =============================================================================
// ENV VAR MAPPING
// =============================================================================

/**
 * Map environment variables to config keys
 * Format: SECURECLAW_<SECTION>_<KEY> maps to config.<section>.<key>
 */
function parseEnvVars(env: NodeJS.ProcessEnv): Partial<UnifiedConfig> {
  const config: Partial<UnifiedConfig> = {};

  // Helper to set nested value
  const set = (section: keyof UnifiedConfig, key: string, value: unknown): void => {
    if (!config[section]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config[section] = {} as any;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (config[section] as any)[key] = value;
  };

  // Helper to parse int safely with overflow protection
  const parseInt = (value: string | undefined): number | undefined => {
    if (!value) {
      return undefined;
    }
    return tryParseInt(value, 10);
  };

  // Helper to parse boolean
  const parseBool = (value: string | undefined): boolean | undefined => {
    if (!value) {
      return undefined;
    }
    const lower = value.toLowerCase();
    if (lower === "true" || lower === "1" || lower === "yes") {
      return true;
    }
    if (lower === "false" || lower === "0" || lower === "no") {
      return false;
    }
    return undefined;
  };

  // Gateway
  const gatewayPort = parseInt(env.SECURECLAW_GATEWAY_PORT);
  if (gatewayPort !== undefined) {
    set("gateway", "port", gatewayPort);
  }

  const maxPayloadBytes = parseInt(env.SECURECLAW_GATEWAY_MAX_PAYLOAD_BYTES);
  if (maxPayloadBytes !== undefined) {
    set("gateway", "maxPayloadBytes", maxPayloadBytes);
  }

  const handshakeTimeout = parseInt(env.SECURECLAW_GATEWAY_HANDSHAKE_TIMEOUT_MS);
  if (handshakeTimeout !== undefined) {
    set("gateway", "handshakeTimeoutMs", handshakeTimeout);
  }

  // Agent
  const agentMaxConcurrent = parseInt(env.SECURECLAW_AGENT_MAX_CONCURRENT);
  if (agentMaxConcurrent !== undefined) {
    set("agent", "maxConcurrent", agentMaxConcurrent);
  }

  const thinkingEnabled = parseBool(env.SECURECLAW_AGENT_THINKING_ENABLED);
  if (thinkingEnabled !== undefined) {
    set("agent", "thinkingEnabled", thinkingEnabled);
  }

  const voiceEnabled = parseBool(env.SECURECLAW_AGENT_VOICE_ENABLED);
  if (voiceEnabled !== undefined) {
    set("agent", "voiceEnabled", voiceEnabled);
  }

  const maxContextTokens = parseInt(env.SECURECLAW_AGENT_MAX_CONTEXT_TOKENS);
  if (maxContextTokens !== undefined) {
    set("agent", "maxContextTokens", maxContextTokens);
  }

  // Memory
  const memoryCacheMaxEntries = parseInt(env.SECURECLAW_MEMORY_CACHE_MAX_ENTRIES);
  if (memoryCacheMaxEntries !== undefined) {
    set("memory", "cacheMaxEntries", memoryCacheMaxEntries);
  }

  const memorySyncBatchSize = parseInt(env.SECURECLAW_MEMORY_SYNC_BATCH_SIZE);
  if (memorySyncBatchSize !== undefined) {
    set("memory", "syncBatchSize", memorySyncBatchSize);
  }

  const embeddingCacheMaxMb = parseInt(env.SECURECLAW_EMBEDDING_CACHE_MAX_MB);
  if (embeddingCacheMaxMb !== undefined) {
    set("memory", "embeddingCacheMaxMb", embeddingCacheMaxMb);
  }

  const memorySyncWatch = parseBool(env.SECURECLAW_MEMORY_SYNC_WATCH);
  if (memorySyncWatch !== undefined) {
    set("memory", "syncWatch", memorySyncWatch);
  }

  const memorySyncInterval = parseInt(env.SECURECLAW_MEMORY_SYNC_INTERVAL_MINUTES);
  if (memorySyncInterval !== undefined) {
    set("memory", "syncIntervalMinutes", memorySyncInterval);
  }

  // Session
  const sessionCacheTtl = parseInt(env.SECURECLAW_SESSION_MANAGER_CACHE_TTL_MS);
  if (sessionCacheTtl !== undefined) {
    set("session", "managerCacheTtlMs", sessionCacheTtl);
  }

  const sessionPreload = parseBool(env.SECURECLAW_SESSION_PRELOAD_ENABLED);
  if (sessionPreload !== undefined) {
    set("session", "preloadEnabled", sessionPreload);
  }

  // Security Coach
  const coachCacheMaxEntries = parseInt(env.SECURECLAW_SECURITY_COACH_LLM_CACHE_MAX_ENTRIES);
  if (coachCacheMaxEntries !== undefined) {
    set("securityCoach", "llmCacheMaxEntries", coachCacheMaxEntries);
  }

  const coachCacheTtl = parseInt(env.SECURECLAW_SECURITY_COACH_LLM_CACHE_TTL_MS);
  if (coachCacheTtl !== undefined) {
    set("securityCoach", "llmCacheTtlMs", coachCacheTtl);
  }

  const coachMaxLatency = parseInt(env.SECURECLAW_SECURITY_COACH_LLM_MAX_LATENCY_MS);
  if (coachMaxLatency !== undefined) {
    set("securityCoach", "llmMaxLatencyMs", coachMaxLatency);
  }

  // WebSocket
  const wsMaxConnections = parseInt(env.SECURECLAW_WS_MAX_CONNECTIONS);
  if (wsMaxConnections !== undefined) {
    set("websocket", "maxConnections", wsMaxConnections);
  }

  const wsIdleTimeout = parseInt(env.SECURECLAW_WS_IDLE_TIMEOUT_MS);
  if (wsIdleTimeout !== undefined) {
    set("websocket", "idleTimeoutMs", wsIdleTimeout);
  }

  const wsMaxPayloadMb = parseInt(env.SECURECLAW_WS_MAX_PAYLOAD_MB);
  if (wsMaxPayloadMb !== undefined) {
    set("websocket", "maxPayloadMb", wsMaxPayloadMb);
  }

  // Memory Monitor
  const memoryMonitorEnabled = parseBool(env.SECURECLAW_MEMORY_MONITOR_ENABLED);
  if (memoryMonitorEnabled !== undefined) {
    set("memoryMonitor", "enabled", memoryMonitorEnabled);
  }

  const maxHeapMb = parseInt(env.SECURECLAW_MEMORY_MAX_HEAP_MB);
  if (maxHeapMb !== undefined) {
    set("memoryMonitor", "maxHeapMb", maxHeapMb);
  }

  const warningThreshold = parseInt(env.SECURECLAW_MEMORY_WARNING_THRESHOLD_PCT);
  if (warningThreshold !== undefined) {
    set("memoryMonitor", "warningThresholdPct", warningThreshold);
  }

  const checkInterval = parseInt(env.SECURECLAW_MEMORY_CHECK_INTERVAL_MS);
  if (checkInterval !== undefined) {
    set("memoryMonitor", "checkIntervalMs", checkInterval);
  }

  // Message Buffer
  const messageBufferSize = parseInt(env.SECURECLAW_GATEWAY_MESSAGE_BUFFER_SIZE);
  if (messageBufferSize !== undefined) {
    set("messageBuffer", "gatewayMessageBufferSize", messageBufferSize);
  }

  const messageBufferTtl = parseInt(env.SECURECLAW_GATEWAY_MESSAGE_BUFFER_TTL_MS);
  if (messageBufferTtl !== undefined) {
    set("messageBuffer", "gatewayMessageBufferTtlMs", messageBufferTtl);
  }

  // Media/Image
  const mediaImageMaxWidth = parseInt(env.SECURECLAW_MEDIA_IMAGE_MAX_WIDTH);
  if (mediaImageMaxWidth !== undefined) {
    set("image", "maxWidth", mediaImageMaxWidth);
  }

  const mediaImageMaxHeight = parseInt(env.SECURECLAW_MEDIA_IMAGE_MAX_HEIGHT);
  if (mediaImageMaxHeight !== undefined) {
    set("image", "maxHeight", mediaImageMaxHeight);
  }

  const mediaImageQuality = parseInt(env.SECURECLAW_MEDIA_IMAGE_QUALITY);
  if (mediaImageQuality !== undefined) {
    set("image", "quality", mediaImageQuality);
  }

  // Video
  const mediaVideoEnabled = parseBool(env.SECURECLAW_MEDIA_VIDEO_ENABLED);
  if (mediaVideoEnabled !== undefined) {
    set("video", "enabled", mediaVideoEnabled);
  }

  // Logging
  const logMaxFiles = parseInt(env.SECURECLAW_LOG_MAX_FILES);
  if (logMaxFiles !== undefined) {
    // Note: This doesn't map directly to current schema, but we keep it for future use
  }

  const logMaxSizeMb = parseInt(env.SECURECLAW_LOG_MAX_SIZE_MB);
  if (logMaxSizeMb !== undefined) {
    // Note: This doesn't map directly to current schema, but we keep it for future use
  }

  // SQLite
  const sqliteWalMode = parseBool(env.SECURECLAW_SQLITE_WAL_MODE);
  if (sqliteWalMode !== undefined) {
    set("sqlite", "walMode", sqliteWalMode);
  }

  const sqliteCacheSize = parseInt(env.SECURECLAW_SQLITE_CACHE_SIZE);
  if (sqliteCacheSize !== undefined) {
    set("sqlite", "cacheSize", sqliteCacheSize);
  }

  const sqliteMmapSize = parseInt(env.SECURECLAW_SQLITE_MMAP_SIZE);
  if (sqliteMmapSize !== undefined) {
    set("sqlite", "mmapSize", sqliteMmapSize);
  }

  return config;
}

// =============================================================================
// DOTENV LOADING
// =============================================================================

/**
 * Load .env files in order of precedence
 */
function loadDotenvFiles(options: LoadConfigOptions): { sources: string[]; errors: string[] } {
  const sources: string[] = [];
  const errors: string[] = [];

  if (options.skipDotenv) {
    return { sources, errors };
  }

  const stateDir = options.stateDir ?? resolveStateDir();

  // Load in reverse priority order (later sources override earlier)
  const dotenvPaths = [
    // Profile-specific .env (lowest priority)
    options.profile ? join(process.cwd(), `.env.${options.profile}`) : null,
    // User config .env
    join(stateDir, ".env"),
    // Local .env (highest priority)
    join(process.cwd(), ".env"),
  ].filter((p): p is string => p !== null);

  for (const path of dotenvPaths) {
    if (existsSync(path)) {
      try {
        dotenvConfig({ path, override: false });
        sources.push(path);
      } catch (err) {
        errors.push(`Failed to load ${path}: ${err}`);
      }
    }
  }

  return { sources, errors };
}

// =============================================================================
// PROFILE LOADING
// =============================================================================

/**
 * Load profile-specific .env file
 * Profiles are named .env.<profile> (e.g., .env.pi)
 */
function loadProfile(profileName: string): { source?: string; error?: string } {
  const profilePath = join(process.cwd(), `.env.${profileName}`);

  if (!existsSync(profilePath)) {
    return { error: `Profile not found: ${profilePath}` };
  }

  try {
    dotenvConfig({ path: profilePath, override: false });
    return { source: profilePath };
  } catch (err) {
    return { error: `Failed to load profile ${profileName}: ${err}` };
  }
}

// =============================================================================
// MAIN LOADER
// =============================================================================

/**
 * Load unified configuration from all sources
 */
export function loadUnifiedConfig(options: LoadConfigOptions = {}): LoadConfigResult {
  const sources: string[] = [];
  const errors: string[] = [];
  const env = options.env ?? process.env;

  // 1. Load .env files
  const dotenvResult = loadDotenvFiles(options);
  sources.push(...dotenvResult.sources);
  errors.push(...dotenvResult.errors);

  // 2. Load profile if specified
  if (options.profile) {
    const profileResult = loadProfile(options.profile);
    if (profileResult.source) {
      sources.push(profileResult.source);
    }
    if (profileResult.error) {
      errors.push(profileResult.error);
    }
  }

  // 3. Parse environment variables
  sources.push("process.env");
  const envConfig = parseEnvVars(env);

  // 4. Validate and apply defaults
  const validated = validateUnifiedConfig(envConfig);

  if (!validated.success) {
    errors.push(`Config validation failed: ${validated.error?.message}`);
    // Return defaults on validation failure
    return {
      config: UnifiedConfigSchema.parse({}),
      sources,
      errors,
    };
  }

  return {
    config: validated.data!,
    sources,
    errors,
  };
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let _cachedConfig: LoadConfigResult | null = null;

/**
 * Get cached unified config (loads once, returns cached value on subsequent calls)
 */
export function getUnifiedConfig(options?: LoadConfigOptions): LoadConfigResult {
  if (!_cachedConfig || options) {
    _cachedConfig = loadUnifiedConfig(options);
  }
  return _cachedConfig;
}

/**
 * Clear cached config (useful for testing)
 */
export function clearConfigCache(): void {
  _cachedConfig = null;
}

/**
 * Reload config from sources
 */
export function reloadUnifiedConfig(options?: LoadConfigOptions): LoadConfigResult {
  clearConfigCache();
  return getUnifiedConfig(options);
}
