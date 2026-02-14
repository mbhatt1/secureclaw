[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelThreadingToolContext

# Type Alias: ChannelThreadingToolContext

> **ChannelThreadingToolContext** = `object`

Defined in: [channels/plugins/types.core.ts:246](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L246)

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

### currentChannelId?

> `optional` **currentChannelId**: `string`

Defined in: [channels/plugins/types.core.ts:247](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L247)

---

### currentChannelProvider?

> `optional` **currentChannelProvider**: [`ChannelId`](ChannelId.md)

Defined in: [channels/plugins/types.core.ts:248](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L248)

---

### currentThreadTs?

> `optional` **currentThreadTs**: `string`

Defined in: [channels/plugins/types.core.ts:249](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L249)

---

### hasRepliedRef?

> `optional` **hasRepliedRef**: `object`

Defined in: [channels/plugins/types.core.ts:251](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L251)

#### value

> **value**: `boolean`

---

### replyToMode?

> `optional` **replyToMode**: `"off"` \| `"first"` \| `"all"`

Defined in: [channels/plugins/types.core.ts:250](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L250)

---

### skipCrossContextDecoration?

> `optional` **skipCrossContextDecoration**: `boolean`

Defined in: [channels/plugins/types.core.ts:257](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L257)

When true, skip cross-context decoration (e.g., "[from X]" prefix).
Use this for direct tool invocations where the agent is composing a new message,
not forwarding/relaying a message from another conversation.
