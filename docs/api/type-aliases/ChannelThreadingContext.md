[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelThreadingContext

# Type Alias: ChannelThreadingContext

> **ChannelThreadingContext** = `object`

Defined in: [channels/plugins/types.core.ts:235](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L235)

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

### Channel?

> `optional` **Channel**: `string`

Defined in: [channels/plugins/types.core.ts:236](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L236)

---

### ChatType?

> `optional` **ChatType**: `string`

Defined in: [channels/plugins/types.core.ts:239](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L239)

---

### From?

> `optional` **From**: `string`

Defined in: [channels/plugins/types.core.ts:237](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L237)

---

### MessageThreadId?

> `optional` **MessageThreadId**: `string` \| `number`

Defined in: [channels/plugins/types.core.ts:243](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L243)

---

### ReplyToId?

> `optional` **ReplyToId**: `string`

Defined in: [channels/plugins/types.core.ts:240](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L240)

---

### ReplyToIdFull?

> `optional` **ReplyToIdFull**: `string`

Defined in: [channels/plugins/types.core.ts:241](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L241)

---

### ThreadLabel?

> `optional` **ThreadLabel**: `string`

Defined in: [channels/plugins/types.core.ts:242](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L242)

---

### To?

> `optional` **To**: `string`

Defined in: [channels/plugins/types.core.ts:238](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L238)
