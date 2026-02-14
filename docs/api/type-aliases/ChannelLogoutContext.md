[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelLogoutContext

# Type Alias: ChannelLogoutContext\<ResolvedAccount\>

> **ChannelLogoutContext**\<`ResolvedAccount`\> = `object`

Defined in: [channels/plugins/types.adapters.ts:176](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L176)

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

Defined in: [channels/plugins/types.adapters.ts:179](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L179)

---

### accountId

> **accountId**: `string`

Defined in: [channels/plugins/types.adapters.ts:178](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L178)

---

### cfg

> **cfg**: [`SecureClawConfig`](SecureClawConfig.md)

Defined in: [channels/plugins/types.adapters.ts:177](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L177)

---

### log?

> `optional` **log**: [`ChannelLogSink`](ChannelLogSink.md)

Defined in: [channels/plugins/types.adapters.ts:181](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L181)

---

### runtime

> **runtime**: [`RuntimeEnv`](RuntimeEnv.md)

Defined in: [channels/plugins/types.adapters.ts:180](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L180)
