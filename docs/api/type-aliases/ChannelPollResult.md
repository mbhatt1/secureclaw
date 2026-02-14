[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelPollResult

# Type Alias: ChannelPollResult

> **ChannelPollResult** = `object`

Defined in: [channels/plugins/types.core.ts:323](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L323)

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

### channelId?

> `optional` **channelId**: `string`

Defined in: [channels/plugins/types.core.ts:326](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L326)

---

### conversationId?

> `optional` **conversationId**: `string`

Defined in: [channels/plugins/types.core.ts:327](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L327)

---

### messageId

> **messageId**: `string`

Defined in: [channels/plugins/types.core.ts:324](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L324)

---

### pollId?

> `optional` **pollId**: `string`

Defined in: [channels/plugins/types.core.ts:328](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L328)

---

### toJid?

> `optional` **toJid**: `string`

Defined in: [channels/plugins/types.core.ts:325](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L325)
