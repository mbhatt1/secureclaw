[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / SecureClawPluginServiceContext

# Type Alias: SecureClawPluginServiceContext

> **SecureClawPluginServiceContext** = `object`

Defined in: [plugins/types.ts:213](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L213)

Core plugin system types.

Key interfaces:

- SecureClawPluginApi: Main plugin API for creating services and tools
- SecureClawPluginService: Service lifecycle management
- AnyAgentTool: Agent tool definition (schema + execute function)
- ProviderAuthContext/Result: OAuth and authentication flows

## Properties

### config

> **config**: [`SecureClawConfig`](SecureClawConfig.md)

Defined in: [plugins/types.ts:214](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L214)

---

### logger

> **logger**: `PluginLogger`

Defined in: [plugins/types.ts:217](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L217)

---

### stateDir

> **stateDir**: `string`

Defined in: [plugins/types.ts:216](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L216)

---

### workspaceDir?

> `optional` **workspaceDir**: `string`

Defined in: [plugins/types.ts:215](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L215)
