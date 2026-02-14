# Configuration System Migration Guide

## Overview

SecureClaw's configuration system has been unified into a single, consistent system. This guide helps you migrate from the old scattered config to the new unified system.

## What Changed

### Before: Scattered Configuration

Previously, configuration was scattered across:
- Multiple `.env` files in different locations
- Hardcoded constants in various source files
- Duplicate default values across modules
- Inconsistent environment variable names
- No unified validation

### After: Unified Configuration

Now, configuration is:
- **Centralized**: Single source of truth for all defaults
- **Validated**: Zod schemas ensure type safety
- **Consistent**: Standardized environment variable names
- **Documented**: Complete env var reference
- **Profile-aware**: Built-in support for deployment profiles (e.g., Raspberry Pi)

## Key Changes

### 1. Unified Defaults

All default configuration values are now in:
```typescript
src/config/defaults.unified.ts
```

Example:
```typescript
// Before (scattered across files)
export const DEFAULT_GATEWAY_PORT = 18789;
export const MAX_CONCURRENT_AGENTS = 4;
export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

// After (unified)
import { GATEWAY_DEFAULTS, AGENT_DEFAULTS, MEDIA_DEFAULTS } from './config/defaults.unified.js';

GATEWAY_DEFAULTS.PORT // 18789
AGENT_DEFAULTS.MAX_CONCURRENT // 4
MEDIA_DEFAULTS.MAX_IMAGE_BYTES // 6291456
```

### 2. Unified Config Loader

Configuration loading is now handled by a single loader:
```typescript
src/config/loader.unified.ts
```

Usage:
```typescript
import { getUnifiedConfig } from './config/config.js';

const { config, sources, errors } = getUnifiedConfig();

// Access typed config values
const port = config.gateway?.port ?? GATEWAY_DEFAULTS.PORT;
const maxConcurrent = config.agent?.maxConcurrent ?? AGENT_DEFAULTS.MAX_CONCURRENT;
```

### 3. Zod Schema Validation

All config values are now validated:
```typescript
src/config/schema.unified.ts
```

Example:
```typescript
import { UnifiedConfigSchema } from './config/schema.unified.js';

const validated = UnifiedConfigSchema.parse(rawConfig);
// Throws if validation fails
```

### 4. Standardized Environment Variables

All environment variables now use the `SECURECLAW_` prefix with consistent naming:

| Old | New |
|-----|-----|
| `GATEWAY_PORT` | `SECURECLAW_GATEWAY_PORT` |
| `MAX_AGENTS` | `SECURECLAW_AGENT_MAX_CONCURRENT` |
| `MEMORY_CACHE_SIZE` | `SECURECLAW_MEMORY_CACHE_MAX_ENTRIES` |

**Note**: Legacy prefixes (`OPENCLAW_`, `CLAWDBOT_`) are still supported for backwards compatibility.

## Migration Steps

### Step 1: Update Environment Variables

Review your `.env` files and update variable names:

```bash
# Before
GATEWAY_PORT=8080
MAX_AGENTS=2

# After
SECURECLAW_GATEWAY_PORT=8080
SECURECLAW_AGENT_MAX_CONCURRENT=2
```

See [Environment Variables Reference](./config-env-vars.md) for complete list.

### Step 2: Update Code Imports

If you were importing constants directly:

```typescript
// Before
import { DEFAULT_GATEWAY_PORT } from './gateway/constants.js';
import { MAX_IMAGE_BYTES } from './media/constants.js';

// After
import { GATEWAY_DEFAULTS, MEDIA_DEFAULTS } from './config/defaults.unified.js';

const port = GATEWAY_DEFAULTS.PORT;
const maxSize = MEDIA_DEFAULTS.MAX_IMAGE_BYTES;
```

### Step 3: Use Unified Config Loader

Replace manual config loading:

```typescript
// Before
const port = process.env.GATEWAY_PORT
  ? parseInt(process.env.GATEWAY_PORT)
  : DEFAULT_GATEWAY_PORT;

// After
import { getUnifiedConfig, GATEWAY_DEFAULTS } from './config/config.js';

const { config } = getUnifiedConfig();
const port = config.gateway?.port ?? GATEWAY_DEFAULTS.PORT;
```

### Step 4: Update Profile Loading

If you were manually loading profiles:

```typescript
// Before
if (process.env.RASPBERRY_PI) {
  // manually load .env.pi
  dotenv.config({ path: '.env.pi' });
}

// After
import { getUnifiedConfig } from './config/config.js';

// Automatically loads profile based on SECURECLAW_PROFILE env var
const { config } = getUnifiedConfig();

// Or explicitly specify profile
const { config } = getUnifiedConfig({ profile: 'raspberry-pi-4-4gb' });
```

### Step 5: Validate Config

Add config validation to your startup:

```typescript
import { validateUnifiedConfig } from './config/config.js';

const result = validateUnifiedConfig(rawConfig);
if (!result.success) {
  console.error('Config validation failed:', result.error);
  process.exit(1);
}
```

## Breaking Changes

### None (Backwards Compatible)

The unified config system is **fully backwards compatible**:

1. **Old env var names still work**: `OPENCLAW_*`, `CLAWDBOT_*` prefixes are supported
2. **Existing constants still exported**: All old constant exports remain (they now import from unified config)
3. **Config file format unchanged**: `secureclaw.json` format is unchanged
4. **API unchanged**: Existing config loading APIs still work

### Deprecation Notice

While backwards compatible, the following are deprecated:

- Importing constants from scattered files (e.g., `src/gateway/server-constants.ts`)
- Using legacy env var prefixes (`OPENCLAW_*`, `CLAWDBOT_*`)
- Manual profile loading (use unified loader instead)

These will be removed in a future major version.

## New Features

### 1. Config Profiles

Load pre-configured profiles for specific deployments:

```bash
# Set profile via environment
export SECURECLAW_PROFILE=raspberry-pi-4-4gb

# Or via .env file
SECURECLAW_PROFILE=raspberry-pi-4-4gb
```

Available profiles:
- `raspberry-pi-4-2gb` - Ultra-lightweight for 2GB Pi
- `raspberry-pi-4-4gb` - Balanced for 4GB Pi (most common)
- `raspberry-pi-4-8gb` - Full features for 8GB Pi
- `raspberry-pi-5` - High performance for Pi 5

### 2. Config Validation

Runtime validation catches config errors early:

```typescript
import { validateUnifiedConfig } from './config/config.js';

const result = validateUnifiedConfig({
  gateway: { port: 99999 } // Invalid port!
});

if (!result.success) {
  console.error(result.error); // Zod validation error
}
```

### 3. Type-Safe Config

Full TypeScript support:

```typescript
import type { UnifiedConfig } from './config/config.js';

function configureGateway(config: UnifiedConfig) {
  // config.gateway is fully typed
  const port = config.gateway?.port; // number | undefined
}
```

### 4. Config Cache

Config is loaded once and cached:

```typescript
import { getUnifiedConfig, reloadUnifiedConfig, clearConfigCache } from './config/config.js';

// First call loads from files
const { config } = getUnifiedConfig();

// Subsequent calls return cached config
const { config: cached } = getUnifiedConfig();

// Force reload
const { config: fresh } = reloadUnifiedConfig();

// Clear cache (useful for tests)
clearConfigCache();
```

## Example: Complete Migration

### Before

```typescript
// gateway/server.ts
import dotenv from 'dotenv';
dotenv.config();

const GATEWAY_PORT = process.env.GATEWAY_PORT
  ? parseInt(process.env.GATEWAY_PORT)
  : 18789;

const MAX_AGENTS = process.env.MAX_AGENTS
  ? parseInt(process.env.MAX_AGENTS)
  : 4;

// No validation!
startServer(GATEWAY_PORT, MAX_AGENTS);
```

### After

```typescript
// gateway/server.ts
import { getUnifiedConfig, GATEWAY_DEFAULTS, AGENT_DEFAULTS } from './config/config.js';

const { config, errors } = getUnifiedConfig();

// Check for errors
if (errors.length > 0) {
  console.warn('Config warnings:', errors);
}

// Type-safe with defaults
const port = config.gateway?.port ?? GATEWAY_DEFAULTS.PORT;
const maxAgents = config.agent?.maxConcurrent ?? AGENT_DEFAULTS.MAX_CONCURRENT;

// Validated automatically!
startServer(port, maxAgents);
```

## Testing

### Test Config Override

```typescript
import { getUnifiedConfig, clearConfigCache } from './config/config.js';

// Override for tests
const { config } = getUnifiedConfig({
  env: {
    SECURECLAW_GATEWAY_PORT: '9999',
    SECURECLAW_AGENT_MAX_CONCURRENT: '1',
  },
  skipDotenv: true,
});

// Clean up
clearConfigCache();
```

### Test Profiles

```typescript
import { getUnifiedConfig } from './config/config.js';

// Test with Pi profile
const { config } = getUnifiedConfig({
  profile: 'raspberry-pi-4-4gb',
});

expect(config.agent?.maxConcurrent).toBeLessThanOrEqual(4);
```

## Troubleshooting

### Config Not Loading

**Problem**: Config values are not being applied.

**Solution**: Check config loading order:
1. Check `sources` in `LoadConfigResult`
2. Verify env var names use `SECURECLAW_` prefix
3. Check .env file locations (`./.env`, `~/.secureclaw/.env`)

```typescript
const { config, sources, errors } = getUnifiedConfig();
console.log('Loaded from:', sources);
console.log('Errors:', errors);
```

### Validation Errors

**Problem**: Config validation fails.

**Solution**: Check the Zod error for details:

```typescript
import { validateUnifiedConfig } from './config/config.js';

const result = validateUnifiedConfig(rawConfig);
if (!result.success) {
  console.error('Validation failed:');
  console.error(result.error.format());
}
```

### Profile Not Found

**Problem**: Profile fails to load.

**Solution**: Check profile exists:

```typescript
import { hasProfile, getAvailableProfiles } from './config/config.js';

if (!hasProfile('raspberry-pi-4-4gb')) {
  console.log('Available profiles:', getAvailableProfiles());
}
```

## Support

For issues or questions:
1. Check [Environment Variables Reference](./config-env-vars.md)
2. Review [Configuration Guide](./configuration.md)
3. Open an issue on GitHub

## See Also

- [Environment Variables Reference](./config-env-vars.md)
- [Configuration Guide](./configuration.md)
- [Raspberry Pi Deployment](./raspberry-pi.md)
