[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelCapabilities

# Type Alias: ChannelCapabilities

> **ChannelCapabilities** = `object`

Defined in: [channels/plugins/types.core.ts:169](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L169)

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

### blockStreaming?

> `optional` **blockStreaming**: `boolean`

Defined in: [channels/plugins/types.core.ts:181](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L181)

---

### chatTypes

> **chatTypes**: ([`ChatType`](ChatType.md) \| `"thread"`)[]

Defined in: [channels/plugins/types.core.ts:170](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L170)

---

### edit?

> `optional` **edit**: `boolean`

Defined in: [channels/plugins/types.core.ts:173](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L173)

---

### effects?

> `optional` **effects**: `boolean`

Defined in: [channels/plugins/types.core.ts:176](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L176)

---

### groupManagement?

> `optional` **groupManagement**: `boolean`

Defined in: [channels/plugins/types.core.ts:177](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L177)

---

### media?

> `optional` **media**: `boolean`

Defined in: [channels/plugins/types.core.ts:179](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L179)

---

### nativeCommands?

> `optional` **nativeCommands**: `boolean`

Defined in: [channels/plugins/types.core.ts:180](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L180)

---

### polls?

> `optional` **polls**: `boolean`

Defined in: [channels/plugins/types.core.ts:171](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L171)

---

### reactions?

> `optional` **reactions**: `boolean`

Defined in: [channels/plugins/types.core.ts:172](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L172)

---

### reply?

> `optional` **reply**: `boolean`

Defined in: [channels/plugins/types.core.ts:175](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L175)

---

### threads?

> `optional` **threads**: `boolean`

Defined in: [channels/plugins/types.core.ts:178](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L178)

---

### unsend?

> `optional` **unsend**: `boolean`

Defined in: [channels/plugins/types.core.ts:174](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L174)
