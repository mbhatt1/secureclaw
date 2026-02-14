[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelHeartbeatAdapter

# Type Alias: ChannelHeartbeatAdapter

> **ChannelHeartbeatAdapter** = `object`

Defined in: [channels/plugins/types.adapters.ts:220](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L220)

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

### checkReady()?

> `optional` **checkReady**: (`params`) => `Promise`\<\{ `ok`: `boolean`; `reason`: `string`; \}\>

Defined in: [channels/plugins/types.adapters.ts:221](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L221)

#### Parameters

##### params

###### accountId?

`string` \| `null`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### deps?

[`ChannelHeartbeatDeps`](ChannelHeartbeatDeps.md)

#### Returns

`Promise`\<\{ `ok`: `boolean`; `reason`: `string`; \}\>

---

### resolveRecipients()?

> `optional` **resolveRecipients**: (`params`) => `object`

Defined in: [channels/plugins/types.adapters.ts:226](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L226)

#### Parameters

##### params

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### opts?

\{ `all?`: `boolean`; `to?`: `string`; \}

###### opts.all?

`boolean`

###### opts.to?

`string`

#### Returns

`object`

##### recipients

> **recipients**: `string`[]

##### source

> **source**: `string`
