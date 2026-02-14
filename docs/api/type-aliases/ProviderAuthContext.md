[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ProviderAuthContext

# Type Alias: ProviderAuthContext

> **ProviderAuthContext** = `object`

Defined in: [plugins/types.ts:94](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L94)

Core plugin system types.

Key interfaces:

- SecureClawPluginApi: Main plugin API for creating services and tools
- SecureClawPluginService: Service lifecycle management
- AnyAgentTool: Agent tool definition (schema + execute function)
- ProviderAuthContext/Result: OAuth and authentication flows

## Properties

### agentDir?

> `optional` **agentDir**: `string`

Defined in: [plugins/types.ts:96](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L96)

---

### config

> **config**: [`SecureClawConfig`](SecureClawConfig.md)

Defined in: [plugins/types.ts:95](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L95)

---

### isRemote

> **isRemote**: `boolean`

Defined in: [plugins/types.ts:100](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L100)

---

### oauth

> **oauth**: `object`

Defined in: [plugins/types.ts:102](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L102)

#### createVpsAwareHandlers

> **createVpsAwareHandlers**: _typeof_ `createVpsAwareOAuthHandlers`

---

### openUrl()

> **openUrl**: (`url`) => `Promise`\<`void`\>

Defined in: [plugins/types.ts:101](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L101)

#### Parameters

##### url

`string`

#### Returns

`Promise`\<`void`\>

---

### prompter

> **prompter**: [`WizardPrompter`](WizardPrompter.md)

Defined in: [plugins/types.ts:98](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L98)

---

### runtime

> **runtime**: [`RuntimeEnv`](RuntimeEnv.md)

Defined in: [plugins/types.ts:99](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L99)

---

### workspaceDir?

> `optional` **workspaceDir**: `string`

Defined in: [plugins/types.ts:97](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L97)
