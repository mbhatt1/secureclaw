[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelPairingAdapter

# Type Alias: ChannelPairingAdapter

> **ChannelPairingAdapter** = `object`

Defined in: [channels/plugins/types.adapters.ts:184](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L184)

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

### idLabel

> **idLabel**: `string`

Defined in: [channels/plugins/types.adapters.ts:185](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L185)

---

### normalizeAllowEntry()?

> `optional` **normalizeAllowEntry**: (`entry`) => `string`

Defined in: [channels/plugins/types.adapters.ts:186](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L186)

#### Parameters

##### entry

`string`

#### Returns

`string`

---

### notifyApproval()?

> `optional` **notifyApproval**: (`params`) => `Promise`\<`void`\>

Defined in: [channels/plugins/types.adapters.ts:187](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L187)

#### Parameters

##### params

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### id

`string`

###### runtime?

[`RuntimeEnv`](RuntimeEnv.md)

#### Returns

`Promise`\<`void`\>
