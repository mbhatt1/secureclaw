[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelGatewayContext

# Type Alias: ChannelGatewayContext\<ResolvedAccount\>

> **ChannelGatewayContext**\<`ResolvedAccount`\> = `object`

Defined in: [channels/plugins/types.adapters.ts:149](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L149)

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

### abortSignal

> **abortSignal**: `AbortSignal`

Defined in: [channels/plugins/types.adapters.ts:154](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L154)

---

### account

> **account**: `ResolvedAccount`

Defined in: [channels/plugins/types.adapters.ts:152](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L152)

---

### accountId

> **accountId**: `string`

Defined in: [channels/plugins/types.adapters.ts:151](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L151)

---

### cfg

> **cfg**: [`SecureClawConfig`](SecureClawConfig.md)

Defined in: [channels/plugins/types.adapters.ts:150](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L150)

---

### getStatus()

> **getStatus**: () => [`ChannelAccountSnapshot`](ChannelAccountSnapshot.md)

Defined in: [channels/plugins/types.adapters.ts:156](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L156)

#### Returns

[`ChannelAccountSnapshot`](ChannelAccountSnapshot.md)

---

### log?

> `optional` **log**: [`ChannelLogSink`](ChannelLogSink.md)

Defined in: [channels/plugins/types.adapters.ts:155](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L155)

---

### runtime

> **runtime**: [`RuntimeEnv`](RuntimeEnv.md)

Defined in: [channels/plugins/types.adapters.ts:153](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L153)

---

### setStatus()

> **setStatus**: (`next`) => `void`

Defined in: [channels/plugins/types.adapters.ts:157](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L157)

#### Parameters

##### next

[`ChannelAccountSnapshot`](ChannelAccountSnapshot.md)

#### Returns

`void`
