[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelGatewayAdapter

# Type Alias: ChannelGatewayAdapter\<ResolvedAccount\>

> **ChannelGatewayAdapter**\<`ResolvedAccount`\> = `object`

Defined in: [channels/plugins/types.adapters.ts:194](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L194)

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

`ResolvedAccount` = `unknown`

## Properties

### loginWithQrStart()?

> `optional` **loginWithQrStart**: (`params`) => `Promise`\<[`ChannelLoginWithQrStartResult`](ChannelLoginWithQrStartResult.md)\>

Defined in: [channels/plugins/types.adapters.ts:197](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L197)

#### Parameters

##### params

###### accountId?

`string`

###### force?

`boolean`

###### timeoutMs?

`number`

###### verbose?

`boolean`

#### Returns

`Promise`\<[`ChannelLoginWithQrStartResult`](ChannelLoginWithQrStartResult.md)\>

---

### loginWithQrWait()?

> `optional` **loginWithQrWait**: (`params`) => `Promise`\<[`ChannelLoginWithQrWaitResult`](ChannelLoginWithQrWaitResult.md)\>

Defined in: [channels/plugins/types.adapters.ts:203](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L203)

#### Parameters

##### params

###### accountId?

`string`

###### timeoutMs?

`number`

#### Returns

`Promise`\<[`ChannelLoginWithQrWaitResult`](ChannelLoginWithQrWaitResult.md)\>

---

### logoutAccount()?

> `optional` **logoutAccount**: (`ctx`) => `Promise`\<[`ChannelLogoutResult`](ChannelLogoutResult.md)\>

Defined in: [channels/plugins/types.adapters.ts:207](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L207)

#### Parameters

##### ctx

[`ChannelLogoutContext`](ChannelLogoutContext.md)\<`ResolvedAccount`\>

#### Returns

`Promise`\<[`ChannelLogoutResult`](ChannelLogoutResult.md)\>

---

### startAccount()?

> `optional` **startAccount**: (`ctx`) => `Promise`\<`unknown`\>

Defined in: [channels/plugins/types.adapters.ts:195](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L195)

#### Parameters

##### ctx

[`ChannelGatewayContext`](ChannelGatewayContext.md)\<`ResolvedAccount`\>

#### Returns

`Promise`\<`unknown`\>

---

### stopAccount()?

> `optional` **stopAccount**: (`ctx`) => `Promise`\<`void`\>

Defined in: [channels/plugins/types.adapters.ts:196](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L196)

#### Parameters

##### ctx

[`ChannelGatewayContext`](ChannelGatewayContext.md)\<`ResolvedAccount`\>

#### Returns

`Promise`\<`void`\>
