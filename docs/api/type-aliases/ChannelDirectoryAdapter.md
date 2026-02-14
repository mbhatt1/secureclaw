[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelDirectoryAdapter

# Type Alias: ChannelDirectoryAdapter

> **ChannelDirectoryAdapter** = `object`

Defined in: [channels/plugins/types.adapters.ts:235](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L235)

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

### listGroupMembers()?

> `optional` **listGroupMembers**: (`params`) => `Promise`\<[`ChannelDirectoryEntry`](ChannelDirectoryEntry.md)[]\>

Defined in: [channels/plugins/types.adapters.ts:269](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L269)

#### Parameters

##### params

###### accountId?

`string` \| `null`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### groupId

`string`

###### limit?

`number` \| `null`

###### runtime

[`RuntimeEnv`](RuntimeEnv.md)

#### Returns

`Promise`\<[`ChannelDirectoryEntry`](ChannelDirectoryEntry.md)[]\>

---

### listGroups()?

> `optional` **listGroups**: (`params`) => `Promise`\<[`ChannelDirectoryEntry`](ChannelDirectoryEntry.md)[]\>

Defined in: [channels/plugins/types.adapters.ts:255](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L255)

#### Parameters

##### params

###### accountId?

`string` \| `null`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### limit?

`number` \| `null`

###### query?

`string` \| `null`

###### runtime

[`RuntimeEnv`](RuntimeEnv.md)

#### Returns

`Promise`\<[`ChannelDirectoryEntry`](ChannelDirectoryEntry.md)[]\>

---

### listGroupsLive()?

> `optional` **listGroupsLive**: (`params`) => `Promise`\<[`ChannelDirectoryEntry`](ChannelDirectoryEntry.md)[]\>

Defined in: [channels/plugins/types.adapters.ts:262](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L262)

#### Parameters

##### params

###### accountId?

`string` \| `null`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### limit?

`number` \| `null`

###### query?

`string` \| `null`

###### runtime

[`RuntimeEnv`](RuntimeEnv.md)

#### Returns

`Promise`\<[`ChannelDirectoryEntry`](ChannelDirectoryEntry.md)[]\>

---

### listPeers()?

> `optional` **listPeers**: (`params`) => `Promise`\<[`ChannelDirectoryEntry`](ChannelDirectoryEntry.md)[]\>

Defined in: [channels/plugins/types.adapters.ts:241](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L241)

#### Parameters

##### params

###### accountId?

`string` \| `null`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### limit?

`number` \| `null`

###### query?

`string` \| `null`

###### runtime

[`RuntimeEnv`](RuntimeEnv.md)

#### Returns

`Promise`\<[`ChannelDirectoryEntry`](ChannelDirectoryEntry.md)[]\>

---

### listPeersLive()?

> `optional` **listPeersLive**: (`params`) => `Promise`\<[`ChannelDirectoryEntry`](ChannelDirectoryEntry.md)[]\>

Defined in: [channels/plugins/types.adapters.ts:248](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L248)

#### Parameters

##### params

###### accountId?

`string` \| `null`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### limit?

`number` \| `null`

###### query?

`string` \| `null`

###### runtime

[`RuntimeEnv`](RuntimeEnv.md)

#### Returns

`Promise`\<[`ChannelDirectoryEntry`](ChannelDirectoryEntry.md)[]\>

---

### self()?

> `optional` **self**: (`params`) => `Promise`\<[`ChannelDirectoryEntry`](ChannelDirectoryEntry.md) \| `null`\>

Defined in: [channels/plugins/types.adapters.ts:236](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L236)

#### Parameters

##### params

###### accountId?

`string` \| `null`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### runtime

[`RuntimeEnv`](RuntimeEnv.md)

#### Returns

`Promise`\<[`ChannelDirectoryEntry`](ChannelDirectoryEntry.md) \| `null`\>
