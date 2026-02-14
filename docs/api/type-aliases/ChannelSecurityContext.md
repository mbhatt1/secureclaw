[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelSecurityContext

# Type Alias: ChannelSecurityContext\<ResolvedAccount\>

> **ChannelSecurityContext**\<`ResolvedAccount`\> = `object`

Defined in: [channels/plugins/types.core.ts:193](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L193)

Core channel adapter types and interfaces.
These types define the contract for implementing custom messaging channel integrations.

Key interfaces:

- ChannelPlugin: Main plugin contract for implementing a new messaging channel
- ChannelConfigAdapter: Configuration management for channels
- ChannelMessagingAdapter: Send/receive messages and handle media
- ChannelGatewayAdapter: HTTP endpoint handlers for webhooks
- ChannelAuthAdapter: Authentication flows (OAuth, QR codes, etc.)
- ChannelSecurityAdapter: Access control and security policies

## Type Parameters

### ResolvedAccount

`ResolvedAccount` = `unknown`

## Properties

### account

> **account**: `ResolvedAccount`

Defined in: [channels/plugins/types.core.ts:196](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L196)

---

### accountId?

> `optional` **accountId**: `string` \| `null`

Defined in: [channels/plugins/types.core.ts:195](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L195)

---

### cfg

> **cfg**: [`SecureClawConfig`](SecureClawConfig.md)

Defined in: [channels/plugins/types.core.ts:194](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L194)
