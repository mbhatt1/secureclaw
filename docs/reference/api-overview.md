# Plugin SDK API Reference

## Overview

The SecureClaw Plugin SDK provides a comprehensive API for building custom integrations, plugins, and extensions. This reference documents the core interfaces, types, and utilities available to plugin developers.

## Generated API Documentation

The complete API reference is automatically generated from TypeScript source code using TypeDoc. Browse the full documentation:

- [API Index](../api/README.md) - Complete type and function reference
- [Interfaces](../api/README.md#interfaces) - Interface definitions
- [Type Aliases](../api/README.md#type-aliases) - Type definitions
- [Functions](../api/README.md#functions) - Utility functions
- [Variables](../api/README.md#variables) - Constants and enums

## Quick Start Guide

### Creating a Channel Plugin

Channel plugins enable SecureClaw to integrate with messaging platforms. Here's a minimal example:

```typescript
import type { ChannelPlugin } from "secureclaw/plugin-sdk";

export const myChannelPlugin: ChannelPlugin = {
  id: "my-channel",
  meta: {
    name: "My Channel",
    description: "Custom messaging channel integration",
  },
  capabilities: {
    inbound: true,
    outbound: true,
    supportsMedia: true,
  },
  config: {
    // Configuration adapter implementation
    resolveAccount: async (config, accountId) => {
      // Return resolved account configuration
    },
  },
  // Additional adapters...
};
```

### Key Plugin SDK Concepts

#### 1. Channel Plugins

Channel plugins implement messaging platform integrations. Key interfaces:

- `ChannelPlugin` - Main plugin contract
- `ChannelMessagingAdapter` - Message send/receive
- `ChannelAuthAdapter` - Authentication flows
- `ChannelGatewayAdapter` - Webhook handlers
- `ChannelSecurityAdapter` - Access control

#### 2. Service Plugins

Service plugins extend SecureClaw with additional capabilities:

- `SecureClawPluginApi` - Plugin API access
- `SecureClawPluginService` - Service lifecycle
- `PluginRuntime` - Runtime environment

#### 3. Agent Tools

Add custom tools to the AI agent:

```typescript
import type { AnyAgentTool } from "secureclaw/plugin-sdk";

const myTool: AnyAgentTool = {
  name: "my_tool",
  description: "Does something useful",
  input_schema: {
    type: "object",
    properties: {
      param: { type: "string" },
    },
  },
  execute: async (params) => {
    // Tool implementation
    return { success: true };
  },
};
```

## Core API Modules

### Configuration

- `SecureClawConfig` - Main configuration object
- `DmPolicy`, `GroupPolicy` - Access control policies
- Channel-specific configs: `DiscordConfig`, `SlackConfig`, etc.
- Validation schemas: `DmPolicySchema`, `GroupPolicySchema`

### Messaging & Channels

- `ChannelDock` - Channel registry
- `getChatChannelMeta()` - Get channel metadata
- `ChatType` - Chat type enumeration (dm/group/channel)
- `normalizeAccountId()` - Account ID normalization

### Authentication & Security

- Device pairing: `approveDevicePairing()`, `listDevicePairing()`
- Command gating: `resolveControlCommandGate()`
- Mention gating: `resolveMentionGating()`

### Message Handling

- `ReplyPayload` - Reply message structure
- `ChunkMode` - Message chunking strategies
- History: `recordPendingHistoryEntry()`, `clearHistoryEntries()`
- Tokens: `SILENT_REPLY_TOKEN`, `isSilentReplyText()`

### Gateway & HTTP

- `GatewayRequestHandler` - HTTP endpoint handler
- `registerPluginHttpRoute()` - Register HTTP routes
- `normalizePluginHttpPath()` - Path normalization

### Utilities

- Error handling: `formatErrorMessage()`
- Environment: `isTruthyEnvValue()`, `isWSLSync()`
- String utils: `escapeRegExp()`, `normalizeE164()`
- JSON parsing: `safeParseJson()`
- Async: `sleep()`

### Diagnostics & Logging

- `registerLogTransport()` - Custom log transports
- `emitDiagnosticEvent()` - Emit diagnostic events
- `isDiagnosticsEnabled()` - Check diagnostic mode

### Media

- `detectMime()`, `extensionForMime()` - MIME type utilities
- `loadWebMedia()` - Fetch web media
- `resolveChannelMediaMaxBytes()` - Channel media limits

## Common Usage Patterns

### 1. Configuration Schema

Define a configuration schema with Zod validation:

```typescript
import { z } from "zod";

export const MyConfigSchema = z.object({
  apiKey: z.string().optional(),
  enabled: z.boolean().default(true),
});

export type MyConfig = z.infer<typeof MyConfigSchema>;
```

### 2. Channel Access Control

Implement access control policies:

```typescript
import type { DmPolicy, GroupPolicy } from "secureclaw/plugin-sdk";

const dmPolicy: DmPolicy = {
  allowFrom: ["user123", "user456"],
};

const groupPolicy: GroupPolicy = {
  allowFrom: ["group789"],
  requireMention: true,
  tools: {
    allowList: ["web_search", "calculator"],
  },
};
```

### 3. Custom HTTP Endpoints

Register custom HTTP endpoints:

```typescript
import { registerPluginHttpRoute } from "secureclaw/plugin-sdk";

registerPluginHttpRoute({
  method: "POST",
  path: "/my-webhook",
  handler: async (req, res, ctx) => {
    // Handle webhook
    res.json({ ok: true });
  },
});
```

### 4. Onboarding Wizards

Create interactive CLI onboarding:

```typescript
import type { WizardPrompter } from "secureclaw/plugin-sdk";

const onboarding = {
  async configure(prompter: WizardPrompter) {
    const apiKey = await prompter.text({
      message: "Enter API key",
    });
    return { apiKey };
  },
};
```

## Migration Guide

### Breaking Changes in v2026.2

1. **Renamed from ClawdBot to SecureClaw**
   - Update imports: `clawdbot` → `secureclaw`
   - Config type: `ClawdbotConfig` → `SecureClawConfig` (deprecated alias available)

2. **Unified Configuration**
   - All configs now use Zod schemas for validation
   - See [config-migration.md](../config-migration.md) for details

3. **Plugin SDK Entry Point**
   - Import from `secureclaw/plugin-sdk` instead of internal paths
   - Old: `import { X } from "secureclaw/dist/..."`
   - New: `import { X } from "secureclaw/plugin-sdk"`

### Deprecated APIs

- `ClawdbotConfig` - Use `SecureClawConfig` instead
- `RoutePeerKind` - Use `ChatType` instead

## Best Practices

### 1. Type Safety

Always use TypeScript and leverage the SDK's type definitions:

```typescript
import type { ChannelPlugin, SecureClawConfig } from "secureclaw/plugin-sdk";

// Strongly typed configuration
function getChannelConfig(config: SecureClawConfig) {
  // TypeScript ensures type safety
}
```

### 2. Error Handling

Use the SDK's error formatting utilities:

```typescript
import { formatErrorMessage } from "secureclaw/plugin-sdk";

try {
  // Operation
} catch (err) {
  const message = formatErrorMessage(err);
  log.error(message);
}
```

### 3. Configuration Validation

Always validate configuration with Zod schemas:

```typescript
import { DmPolicySchema } from "secureclaw/plugin-sdk";

const result = DmPolicySchema.safeParse(config.dm);
if (!result.success) {
  // Handle validation errors
}
```

### 4. Async Operations

Use proper async/await patterns and signal handling:

```typescript
async function operation(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new Error("Aborted");
  }
  // Operation
}
```

## Additional Resources

- [Plugin Development Guide](../plugins/overview.md)
- [Channel Integration Guide](../channels/overview.md)
- [Configuration Reference](../config-env-vars.md)
- [Development Setup](../development.md)

## Support

For questions and issues:

- GitHub Issues: https://github.com/anthropics/secureclaw/issues
- Documentation: https://secureclaw.ai/docs
