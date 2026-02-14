[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelLoginWithQrStartResult

# Type Alias: ChannelLoginWithQrStartResult

> **ChannelLoginWithQrStartResult** = `object`

Defined in: [channels/plugins/types.adapters.ts:166](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L166)

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

### message

> **message**: `string`

Defined in: [channels/plugins/types.adapters.ts:168](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L168)

---

### qrDataUrl?

> `optional` **qrDataUrl**: `string`

Defined in: [channels/plugins/types.adapters.ts:167](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L167)
