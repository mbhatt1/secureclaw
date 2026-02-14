[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelLoginWithQrWaitResult

# Type Alias: ChannelLoginWithQrWaitResult

> **ChannelLoginWithQrWaitResult** = `object`

Defined in: [channels/plugins/types.adapters.ts:171](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L171)

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

### connected

> **connected**: `boolean`

Defined in: [channels/plugins/types.adapters.ts:172](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L172)

---

### message

> **message**: `string`

Defined in: [channels/plugins/types.adapters.ts:173](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L173)
