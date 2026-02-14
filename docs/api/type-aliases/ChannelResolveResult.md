[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelResolveResult

# Type Alias: ChannelResolveResult

> **ChannelResolveResult** = `object`

Defined in: [channels/plugins/types.adapters.ts:280](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L280)

Core channel adapter types and interfaces.
These types define the contract for implementing custom messaging channel integrations.

Key interfaces:

- ChannelPlugin: Main plugin contract for implementing a new messaging channel
- ChannelConfigAdapter: Configuration management for channels
- ChannelMessagingAdapter: Send/receive messages and handle media
- ChannelGatewayAdapter: HTTP endpoint handlers for webhooks
- ChannelAuthAdapter: Authentication flows (OAuth, QR codes, etc.)
- ChannelSecurityAdapter: Access control and security policies

## Properties

### id?

> `optional` **id**: `string`

Defined in: [channels/plugins/types.adapters.ts:283](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L283)

---

### input

> **input**: `string`

Defined in: [channels/plugins/types.adapters.ts:281](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L281)

---

### name?

> `optional` **name**: `string`

Defined in: [channels/plugins/types.adapters.ts:284](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L284)

---

### note?

> `optional` **note**: `string`

Defined in: [channels/plugins/types.adapters.ts:285](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L285)

---

### resolved

> **resolved**: `boolean`

Defined in: [channels/plugins/types.adapters.ts:282](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L282)
