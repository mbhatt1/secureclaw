[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelResolverAdapter

# Type Alias: ChannelResolverAdapter

> **ChannelResolverAdapter** = `object`

Defined in: [channels/plugins/types.adapters.ts:288](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L288)

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

### resolveTargets()

> **resolveTargets**: (`params`) => `Promise`\<[`ChannelResolveResult`](ChannelResolveResult.md)[]\>

Defined in: [channels/plugins/types.adapters.ts:289](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L289)

#### Parameters

##### params

###### accountId?

`string` \| `null`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### inputs

`string`[]

###### kind

[`ChannelResolveKind`](ChannelResolveKind.md)

###### runtime

[`RuntimeEnv`](RuntimeEnv.md)

#### Returns

`Promise`\<[`ChannelResolveResult`](ChannelResolveResult.md)[]\>
