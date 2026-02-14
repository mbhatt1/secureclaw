export {
  createConfigIO,
  loadConfig,
  parseConfigJson5,
  readConfigFileSnapshot,
  resolveConfigSnapshotHash,
  writeConfigFile,
} from "./io.js";
export { migrateLegacyConfig } from "./legacy-migrate.js";
export * from "./paths.js";
export {
  autoDetectProfile,
  detectProfileFromEnv,
  getAvailableProfiles,
  getSystemMemory,
  hasProfile,
  isRaspberryPi,
  loadProfile,
} from "./profiles.js";
export * from "./runtime-overrides.js";
export * from "./types.js";
export {
  validateConfigObject,
  validateConfigObjectRaw,
  validateConfigObjectRawWithPlugins,
  validateConfigObjectWithPlugins,
} from "./validation.js";
export { SecureClawSchema } from "./zod-schema.js";

// =============================================================================
// UNIFIED CONFIG SYSTEM
// =============================================================================

// Export unified config defaults
export * from "./defaults.unified.js";

// Export unified config schema and types
export * from "./schema.unified.js";

// Export unified config loader
export {
  loadUnifiedConfig,
  getUnifiedConfig,
  clearConfigCache,
  reloadUnifiedConfig,
  type LoadConfigOptions,
  type LoadConfigResult,
} from "./loader.unified.js";
