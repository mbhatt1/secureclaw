[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelLogSink

# Type Alias: ChannelLogSink

> **ChannelLogSink** = `object`

Defined in: [channels/plugins/types.core.ts:149](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L149)

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

### debug()?

> `optional` **debug**: (`msg`) => `void`

Defined in: [channels/plugins/types.core.ts:153](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L153)

#### Parameters

##### msg

`string`

#### Returns

`void`

---

### error()

> **error**: (`msg`) => `void`

Defined in: [channels/plugins/types.core.ts:152](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L152)

#### Parameters

##### msg

`string`

#### Returns

`void`

---

### info()

> **info**: (`msg`) => `void`

Defined in: [channels/plugins/types.core.ts:150](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L150)

#### Parameters

##### msg

`string`

#### Returns

`void`

---

### warn()

> **warn**: (`msg`) => `void`

Defined in: [channels/plugins/types.core.ts:151](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L151)

#### Parameters

##### msg

`string`

#### Returns

`void`
