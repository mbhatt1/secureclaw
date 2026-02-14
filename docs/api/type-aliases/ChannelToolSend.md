[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelToolSend

# Type Alias: ChannelToolSend

> **ChannelToolSend** = `object`

Defined in: [channels/plugins/types.core.ts:309](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L309)

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

Defined in: [channels/plugins/types.core.ts:311](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L311)

---

### to

> **to**: `string`

Defined in: [channels/plugins/types.core.ts:310](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L310)
