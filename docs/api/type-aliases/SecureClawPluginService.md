[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / SecureClawPluginService

# Type Alias: SecureClawPluginService

> **SecureClawPluginService** = `object`

Defined in: [plugins/types.ts:220](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L220)

Core plugin system types.

Key interfaces:

- SecureClawPluginApi: Main plugin API for creating services and tools
- SecureClawPluginService: Service lifecycle management
- AnyAgentTool: Agent tool definition (schema + execute function)
- ProviderAuthContext/Result: OAuth and authentication flows

## Properties

### id

> **id**: `string`

Defined in: [plugins/types.ts:221](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L221)

---

### start()

> **start**: (`ctx`) => `void` \| `Promise`\<`void`\>

Defined in: [plugins/types.ts:222](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L222)

#### Parameters

##### ctx

[`SecureClawPluginServiceContext`](SecureClawPluginServiceContext.md)

#### Returns

`void` \| `Promise`\<`void`\>

---

### stop()?

> `optional` **stop**: (`ctx`) => `void` \| `Promise`\<`void`\>

Defined in: [plugins/types.ts:223](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L223)

#### Parameters

##### ctx

[`SecureClawPluginServiceContext`](SecureClawPluginServiceContext.md)

#### Returns

`void` \| `Promise`\<`void`\>
