[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelMentionAdapter

# Type Alias: ChannelMentionAdapter

> **ChannelMentionAdapter** = `object`

Defined in: [channels/plugins/types.core.ts:199](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L199)

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

### stripMentions()?

> `optional` **stripMentions**: (`params`) => `string`

Defined in: [channels/plugins/types.core.ts:205](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L205)

#### Parameters

##### params

###### agentId?

`string`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md) \| `undefined`

###### ctx

`MsgContext`

###### text

`string`

#### Returns

`string`

---

### stripPatterns()?

> `optional` **stripPatterns**: (`params`) => `string`[]

Defined in: [channels/plugins/types.core.ts:200](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L200)

#### Parameters

##### params

###### agentId?

`string`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md) \| `undefined`

###### ctx

`MsgContext`

#### Returns

`string`[]
