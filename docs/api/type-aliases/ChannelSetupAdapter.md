[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelSetupAdapter

# Type Alias: ChannelSetupAdapter

> **ChannelSetupAdapter** = `object`

Defined in: [channels/plugins/types.adapters.ts:22](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L22)

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

### applyAccountConfig()

> **applyAccountConfig**: (`params`) => [`SecureClawConfig`](SecureClawConfig.md)

Defined in: [channels/plugins/types.adapters.ts:29](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L29)

#### Parameters

##### params

###### accountId

`string`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### input

[`ChannelSetupInput`](ChannelSetupInput.md)

#### Returns

[`SecureClawConfig`](SecureClawConfig.md)

---

### applyAccountName()?

> `optional` **applyAccountName**: (`params`) => [`SecureClawConfig`](SecureClawConfig.md)

Defined in: [channels/plugins/types.adapters.ts:24](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L24)

#### Parameters

##### params

###### accountId

`string`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### name?

`string`

#### Returns

[`SecureClawConfig`](SecureClawConfig.md)

---

### resolveAccountId()?

> `optional` **resolveAccountId**: (`params`) => `string`

Defined in: [channels/plugins/types.adapters.ts:23](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L23)

#### Parameters

##### params

###### accountId?

`string`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

#### Returns

`string`

---

### validateInput()?

> `optional` **validateInput**: (`params`) => `string` \| `null`

Defined in: [channels/plugins/types.adapters.ts:34](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L34)

#### Parameters

##### params

###### accountId

`string`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### input

[`ChannelSetupInput`](ChannelSetupInput.md)

#### Returns

`string` \| `null`
