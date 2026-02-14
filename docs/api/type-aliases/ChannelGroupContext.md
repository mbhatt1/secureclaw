[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelGroupContext

# Type Alias: ChannelGroupContext

> **ChannelGroupContext** = `object`

Defined in: [channels/plugins/types.core.ts:156](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L156)

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

### accountId?

> `optional` **accountId**: `string` \| `null`

Defined in: [channels/plugins/types.core.ts:162](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L162)

---

### cfg

> **cfg**: [`SecureClawConfig`](SecureClawConfig.md)

Defined in: [channels/plugins/types.core.ts:157](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L157)

---

### groupChannel?

> `optional` **groupChannel**: `string` \| `null`

Defined in: [channels/plugins/types.core.ts:160](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L160)

Human label for channel-like group conversations (e.g. #general).

---

### groupId?

> `optional` **groupId**: `string` \| `null`

Defined in: [channels/plugins/types.core.ts:158](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L158)

---

### groupSpace?

> `optional` **groupSpace**: `string` \| `null`

Defined in: [channels/plugins/types.core.ts:161](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L161)

---

### senderE164?

> `optional` **senderE164**: `string` \| `null`

Defined in: [channels/plugins/types.core.ts:166](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L166)

---

### senderId?

> `optional` **senderId**: `string` \| `null`

Defined in: [channels/plugins/types.core.ts:163](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L163)

---

### senderName?

> `optional` **senderName**: `string` \| `null`

Defined in: [channels/plugins/types.core.ts:164](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L164)

---

### senderUsername?

> `optional` **senderUsername**: `string` \| `null`

Defined in: [channels/plugins/types.core.ts:165](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L165)
