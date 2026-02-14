[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ProviderAuthResult

# Type Alias: ProviderAuthResult

> **ProviderAuthResult** = `object`

Defined in: [plugins/types.ts:87](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L87)

Core plugin system types.

Key interfaces:

- SecureClawPluginApi: Main plugin API for creating services and tools
- SecureClawPluginService: Service lifecycle management
- AnyAgentTool: Agent tool definition (schema + execute function)
- ProviderAuthContext/Result: OAuth and authentication flows

## Properties

### configPatch?

> `optional` **configPatch**: `Partial`\<[`SecureClawConfig`](SecureClawConfig.md)\>

Defined in: [plugins/types.ts:89](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L89)

---

### defaultModel?

> `optional` **defaultModel**: `string`

Defined in: [plugins/types.ts:90](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L90)

---

### notes?

> `optional` **notes**: `string`[]

Defined in: [plugins/types.ts:91](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L91)

---

### profiles

> **profiles**: `object`[]

Defined in: [plugins/types.ts:88](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L88)

#### credential

> **credential**: `AuthProfileCredential`

#### profileId

> **profileId**: `string`
