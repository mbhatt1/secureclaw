[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelOutboundAdapter

# Type Alias: ChannelOutboundAdapter

> **ChannelOutboundAdapter** = `object`

Defined in: [channels/plugins/types.adapters.ts:89](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L89)

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

### chunker?

> `optional` **chunker**: (`text`, `limit`) => `string`[] \| `null`

Defined in: [channels/plugins/types.adapters.ts:91](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L91)

---

### chunkerMode?

> `optional` **chunkerMode**: `"text"` \| `"markdown"`

Defined in: [channels/plugins/types.adapters.ts:92](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L92)

---

### deliveryMode

> **deliveryMode**: `"direct"` \| `"gateway"` \| `"hybrid"`

Defined in: [channels/plugins/types.adapters.ts:90](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L90)

---

### pollMaxOptions?

> `optional` **pollMaxOptions**: `number`

Defined in: [channels/plugins/types.adapters.ts:94](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L94)

---

### resolveTarget()?

> `optional` **resolveTarget**: (`params`) => \{ `ok`: `true`; `to`: `string`; \} \| \{ `error`: `Error`; `ok`: `false`; \}

Defined in: [channels/plugins/types.adapters.ts:95](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L95)

#### Parameters

##### params

###### accountId?

`string` \| `null`

###### allowFrom?

`string`[]

###### cfg?

[`SecureClawConfig`](SecureClawConfig.md)

###### mode?

[`ChannelOutboundTargetMode`](ChannelOutboundTargetMode.md)

###### to?

`string`

#### Returns

\{ `ok`: `true`; `to`: `string`; \} \| \{ `error`: `Error`; `ok`: `false`; \}

---

### sendMedia()?

> `optional` **sendMedia**: (`ctx`) => `Promise`\<`OutboundDeliveryResult`\>

Defined in: [channels/plugins/types.adapters.ts:104](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L104)

#### Parameters

##### ctx

[`ChannelOutboundContext`](ChannelOutboundContext.md)

#### Returns

`Promise`\<`OutboundDeliveryResult`\>

---

### sendPayload()?

> `optional` **sendPayload**: (`ctx`) => `Promise`\<`OutboundDeliveryResult`\>

Defined in: [channels/plugins/types.adapters.ts:102](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L102)

#### Parameters

##### ctx

`ChannelOutboundPayloadContext`

#### Returns

`Promise`\<`OutboundDeliveryResult`\>

---

### sendPoll()?

> `optional` **sendPoll**: (`ctx`) => `Promise`\<[`ChannelPollResult`](ChannelPollResult.md)\>

Defined in: [channels/plugins/types.adapters.ts:105](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L105)

#### Parameters

##### ctx

[`ChannelPollContext`](ChannelPollContext.md)

#### Returns

`Promise`\<[`ChannelPollResult`](ChannelPollResult.md)\>

---

### sendText()?

> `optional` **sendText**: (`ctx`) => `Promise`\<`OutboundDeliveryResult`\>

Defined in: [channels/plugins/types.adapters.ts:103](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L103)

#### Parameters

##### ctx

[`ChannelOutboundContext`](ChannelOutboundContext.md)

#### Returns

`Promise`\<`OutboundDeliveryResult`\>

---

### textChunkLimit?

> `optional` **textChunkLimit**: `number`

Defined in: [channels/plugins/types.adapters.ts:93](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L93)
