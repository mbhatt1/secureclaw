[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelThreadingAdapter

# Type Alias: ChannelThreadingAdapter

> **ChannelThreadingAdapter** = `object`

Defined in: [channels/plugins/types.core.ts:220](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L220)

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

### allowTagsWhenOff?

> `optional` **allowTagsWhenOff**: `boolean`

Defined in: [channels/plugins/types.core.ts:226](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L226)

---

### buildToolContext()?

> `optional` **buildToolContext**: (`params`) => [`ChannelThreadingToolContext`](ChannelThreadingToolContext.md) \| `undefined`

Defined in: [channels/plugins/types.core.ts:227](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L227)

#### Parameters

##### params

###### accountId?

`string` \| `null`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### context

[`ChannelThreadingContext`](ChannelThreadingContext.md)

###### hasRepliedRef?

\{ `value`: `boolean`; \}

###### hasRepliedRef.value

`boolean`

#### Returns

[`ChannelThreadingToolContext`](ChannelThreadingToolContext.md) \| `undefined`

---

### resolveReplyToMode()?

> `optional` **resolveReplyToMode**: (`params`) => `"off"` \| `"first"` \| `"all"`

Defined in: [channels/plugins/types.core.ts:221](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L221)

#### Parameters

##### params

###### accountId?

`string` \| `null`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### chatType?

`string` \| `null`

#### Returns

`"off"` \| `"first"` \| `"all"`
