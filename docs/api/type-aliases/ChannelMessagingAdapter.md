[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelMessagingAdapter

# Type Alias: ChannelMessagingAdapter

> **ChannelMessagingAdapter** = `object`

Defined in: [channels/plugins/types.core.ts:260](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L260)

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

### formatTargetDisplay()?

> `optional` **formatTargetDisplay**: (`params`) => `string`

Defined in: [channels/plugins/types.core.ts:266](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L266)

#### Parameters

##### params

###### display?

`string`

###### kind?

[`ChannelDirectoryEntryKind`](ChannelDirectoryEntryKind.md)

###### target

`string`

#### Returns

`string`

---

### normalizeTarget()?

> `optional` **normalizeTarget**: (`raw`) => `string` \| `undefined`

Defined in: [channels/plugins/types.core.ts:261](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L261)

#### Parameters

##### raw

`string`

#### Returns

`string` \| `undefined`

---

### targetResolver?

> `optional` **targetResolver**: `object`

Defined in: [channels/plugins/types.core.ts:262](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L262)

#### hint?

> `optional` **hint**: `string`

#### looksLikeId()?

> `optional` **looksLikeId**: (`raw`, `normalized?`) => `boolean`

##### Parameters

###### raw

`string`

###### normalized?

`string`

##### Returns

`boolean`
