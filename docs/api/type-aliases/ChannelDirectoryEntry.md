[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelDirectoryEntry

# Type Alias: ChannelDirectoryEntry

> **ChannelDirectoryEntry** = `object`

Defined in: [channels/plugins/types.core.ts:279](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L279)

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

### avatarUrl?

> `optional` **avatarUrl**: `string`

Defined in: [channels/plugins/types.core.ts:284](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L284)

---

### handle?

> `optional` **handle**: `string`

Defined in: [channels/plugins/types.core.ts:283](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L283)

---

### id

> **id**: `string`

Defined in: [channels/plugins/types.core.ts:281](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L281)

---

### kind

> **kind**: [`ChannelDirectoryEntryKind`](ChannelDirectoryEntryKind.md)

Defined in: [channels/plugins/types.core.ts:280](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L280)

---

### name?

> `optional` **name**: `string`

Defined in: [channels/plugins/types.core.ts:282](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L282)

---

### rank?

> `optional` **rank**: `number`

Defined in: [channels/plugins/types.core.ts:285](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L285)

---

### raw?

> `optional` **raw**: `unknown`

Defined in: [channels/plugins/types.core.ts:286](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L286)
