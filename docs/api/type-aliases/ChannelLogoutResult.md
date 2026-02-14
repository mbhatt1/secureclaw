[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelLogoutResult

# Type Alias: ChannelLogoutResult

> **ChannelLogoutResult** = `object`

Defined in: [channels/plugins/types.adapters.ts:160](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L160)

Core channel adapter types and interfaces.
These types define the contract for implementing custom messaging channel integrations.

Key interfaces:

- ChannelPlugin: Main plugin contract for implementing a new messaging channel
- ChannelConfigAdapter: Configuration management for channels
- ChannelMessagingAdapter: Send/receive messages and handle media
- ChannelGatewayAdapter: HTTP endpoint handlers for webhooks
- ChannelAuthAdapter: Authentication flows (OAuth, QR codes, etc.)
- ChannelSecurityAdapter: Access control and security policies

## Indexable

\[`key`: `string`\]: `unknown`

## Properties

### cleared

> **cleared**: `boolean`

Defined in: [channels/plugins/types.adapters.ts:161](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L161)

---

### loggedOut?

> `optional` **loggedOut**: `boolean`

Defined in: [channels/plugins/types.adapters.ts:162](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L162)
