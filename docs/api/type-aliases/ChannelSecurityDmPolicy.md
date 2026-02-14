[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelSecurityDmPolicy

# Type Alias: ChannelSecurityDmPolicy

> **ChannelSecurityDmPolicy** = `object`

Defined in: [channels/plugins/types.core.ts:184](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L184)

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

### allowFrom?

> `optional` **allowFrom**: (`string` \| `number`)[] \| `null`

Defined in: [channels/plugins/types.core.ts:186](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L186)

---

### allowFromPath

> **allowFromPath**: `string`

Defined in: [channels/plugins/types.core.ts:188](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L188)

---

### approveHint

> **approveHint**: `string`

Defined in: [channels/plugins/types.core.ts:189](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L189)

---

### normalizeEntry()?

> `optional` **normalizeEntry**: (`raw`) => `string`

Defined in: [channels/plugins/types.core.ts:190](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L190)

#### Parameters

##### raw

`string`

#### Returns

`string`

---

### policy

> **policy**: `string`

Defined in: [channels/plugins/types.core.ts:185](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L185)

---

### policyPath?

> `optional` **policyPath**: `string`

Defined in: [channels/plugins/types.core.ts:187](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L187)
