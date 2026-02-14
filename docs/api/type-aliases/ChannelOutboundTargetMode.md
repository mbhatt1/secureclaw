[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelOutboundTargetMode

# Type Alias: ChannelOutboundTargetMode

> **ChannelOutboundTargetMode** = `"explicit"` \| `"implicit"` \| `"heartbeat"`

Defined in: [channels/plugins/types.core.ts:13](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L13)

Core channel adapter types and interfaces.
These types define the contract for implementing custom messaging channel integrations.

Key interfaces:

- ChannelPlugin: Main plugin contract for implementing a new messaging channel
- ChannelConfigAdapter: Configuration management for channels
- ChannelMessagingAdapter: Send/receive messages and handle media
- ChannelGatewayAdapter: HTTP endpoint handlers for webhooks
- ChannelAuthAdapter: Authentication flows (OAuth, QR codes, etc.)
- ChannelSecurityAdapter: Access control and security policies
