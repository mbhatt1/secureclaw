[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelStatusIssue

# Type Alias: ChannelStatusIssue

> **ChannelStatusIssue** = `object`

Defined in: [channels/plugins/types.core.ts:53](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L53)

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

### accountId

> **accountId**: `string`

Defined in: [channels/plugins/types.core.ts:55](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L55)

---

### channel

> **channel**: [`ChannelId`](ChannelId.md)

Defined in: [channels/plugins/types.core.ts:54](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L54)

---

### fix?

> `optional` **fix**: `string`

Defined in: [channels/plugins/types.core.ts:58](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L58)

---

### kind

> **kind**: `"intent"` \| `"permissions"` \| `"config"` \| `"auth"` \| `"runtime"`

Defined in: [channels/plugins/types.core.ts:56](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L56)

---

### message

> **message**: `string`

Defined in: [channels/plugins/types.core.ts:57](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L57)
