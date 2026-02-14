[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelStatusAdapter

# Type Alias: ChannelStatusAdapter\<ResolvedAccount, Probe, Audit\>

> **ChannelStatusAdapter**\<`ResolvedAccount`, `Probe`, `Audit`\> = `object`

Defined in: [channels/plugins/types.adapters.ts:108](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L108)

Core channel adapter types and interfaces.
These types define the contract for implementing custom messaging channel integrations.

Key interfaces:

- ChannelPlugin: Main plugin contract for implementing a new messaging channel
- ChannelConfigAdapter: Configuration management for channels
- ChannelMessagingAdapter: Send/receive messages and handle media
- ChannelGatewayAdapter: HTTP endpoint handlers for webhooks
- ChannelAuthAdapter: Authentication flows (OAuth, QR codes, etc.)
- ChannelSecurityAdapter: Access control and security policies

## Type Parameters

### ResolvedAccount

`ResolvedAccount`

### Probe

`Probe` = `unknown`

### Audit

`Audit` = `unknown`

## Properties

### auditAccount()?

> `optional` **auditAccount**: (`params`) => `Promise`\<`Audit`\>

Defined in: [channels/plugins/types.adapters.ts:121](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L121)

#### Parameters

##### params

###### account

`ResolvedAccount`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### probe?

`Probe`

###### timeoutMs

`number`

#### Returns

`Promise`\<`Audit`\>

---

### buildAccountSnapshot()?

> `optional` **buildAccountSnapshot**: (`params`) => [`ChannelAccountSnapshot`](ChannelAccountSnapshot.md) \| `Promise`\<[`ChannelAccountSnapshot`](ChannelAccountSnapshot.md)\>

Defined in: [channels/plugins/types.adapters.ts:127](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L127)

#### Parameters

##### params

###### account

`ResolvedAccount`

###### audit?

`Audit`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### probe?

`Probe`

###### runtime?

[`ChannelAccountSnapshot`](ChannelAccountSnapshot.md)

#### Returns

[`ChannelAccountSnapshot`](ChannelAccountSnapshot.md) \| `Promise`\<[`ChannelAccountSnapshot`](ChannelAccountSnapshot.md)\>

---

### buildChannelSummary()?

> `optional` **buildChannelSummary**: (`params`) => `Record`\<`string`, `unknown`\> \| `Promise`\<`Record`\<`string`, `unknown`\>\>

Defined in: [channels/plugins/types.adapters.ts:110](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L110)

#### Parameters

##### params

###### account

`ResolvedAccount`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### defaultAccountId

`string`

###### snapshot

[`ChannelAccountSnapshot`](ChannelAccountSnapshot.md)

#### Returns

`Record`\<`string`, `unknown`\> \| `Promise`\<`Record`\<`string`, `unknown`\>\>

---

### collectStatusIssues()?

> `optional` **collectStatusIssues**: (`accounts`) => [`ChannelStatusIssue`](ChannelStatusIssue.md)[]

Defined in: [channels/plugins/types.adapters.ts:146](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L146)

#### Parameters

##### accounts

[`ChannelAccountSnapshot`](ChannelAccountSnapshot.md)[]

#### Returns

[`ChannelStatusIssue`](ChannelStatusIssue.md)[]

---

### defaultRuntime?

> `optional` **defaultRuntime**: [`ChannelAccountSnapshot`](ChannelAccountSnapshot.md)

Defined in: [channels/plugins/types.adapters.ts:109](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L109)

---

### logSelfId()?

> `optional` **logSelfId**: (`params`) => `void`

Defined in: [channels/plugins/types.adapters.ts:134](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L134)

#### Parameters

##### params

###### account

`ResolvedAccount`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### includeChannelPrefix?

`boolean`

###### runtime

[`RuntimeEnv`](RuntimeEnv.md)

#### Returns

`void`

---

### probeAccount()?

> `optional` **probeAccount**: (`params`) => `Promise`\<`Probe`\>

Defined in: [channels/plugins/types.adapters.ts:116](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L116)

#### Parameters

##### params

###### account

`ResolvedAccount`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### timeoutMs

`number`

#### Returns

`Promise`\<`Probe`\>

---

### resolveAccountState()?

> `optional` **resolveAccountState**: (`params`) => [`ChannelAccountState`](ChannelAccountState.md)

Defined in: [channels/plugins/types.adapters.ts:140](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L140)

#### Parameters

##### params

###### account

`ResolvedAccount`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### configured

`boolean`

###### enabled

`boolean`

#### Returns

[`ChannelAccountState`](ChannelAccountState.md)
