[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelOutboundContext

# Type Alias: ChannelOutboundContext

> **ChannelOutboundContext** = `object`

Defined in: [channels/plugins/types.adapters.ts:73](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L73)

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

Defined in: [channels/plugins/types.adapters.ts:81](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L81)

---

### cfg

> **cfg**: [`SecureClawConfig`](SecureClawConfig.md)

Defined in: [channels/plugins/types.adapters.ts:74](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L74)

---

### deps?

> `optional` **deps**: `OutboundSendDeps`

Defined in: [channels/plugins/types.adapters.ts:82](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L82)

---

### gifPlayback?

> `optional` **gifPlayback**: `boolean`

Defined in: [channels/plugins/types.adapters.ts:78](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L78)

---

### mediaUrl?

> `optional` **mediaUrl**: `string`

Defined in: [channels/plugins/types.adapters.ts:77](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L77)

---

### replyToId?

> `optional` **replyToId**: `string` \| `null`

Defined in: [channels/plugins/types.adapters.ts:79](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L79)

---

### text

> **text**: `string`

Defined in: [channels/plugins/types.adapters.ts:76](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L76)

---

### threadId?

> `optional` **threadId**: `string` \| `number` \| `null`

Defined in: [channels/plugins/types.adapters.ts:80](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L80)

---

### to

> **to**: `string`

Defined in: [channels/plugins/types.adapters.ts:75](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L75)
