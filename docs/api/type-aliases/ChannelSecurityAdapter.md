[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelSecurityAdapter

# Type Alias: ChannelSecurityAdapter\<ResolvedAccount\>

> **ChannelSecurityAdapter**\<`ResolvedAccount`\> = `object`

Defined in: [channels/plugins/types.adapters.ts:310](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L310)

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

### collectWarnings()?

> `optional` **collectWarnings**: (`ctx`) => `Promise`\<`string`[]\> \| `string`[]

Defined in: [channels/plugins/types.adapters.ts:314](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L314)

#### Parameters

##### ctx

[`ChannelSecurityContext`](ChannelSecurityContext.md)\<`ResolvedAccount`\>

#### Returns

`Promise`\<`string`[]\> \| `string`[]

---

### resolveDmPolicy()?

> `optional` **resolveDmPolicy**: (`ctx`) => [`ChannelSecurityDmPolicy`](ChannelSecurityDmPolicy.md) \| `null`

Defined in: [channels/plugins/types.adapters.ts:311](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L311)

#### Parameters

##### ctx

[`ChannelSecurityContext`](ChannelSecurityContext.md)\<`ResolvedAccount`\>

#### Returns

[`ChannelSecurityDmPolicy`](ChannelSecurityDmPolicy.md) \| `null`
