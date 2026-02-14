[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelMessageActionContext

# Type Alias: ChannelMessageActionContext

> **ChannelMessageActionContext** = `object`

Defined in: [channels/plugins/types.core.ts:291](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L291)

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

### accountId?

> `optional` **accountId**: `string` \| `null`

Defined in: [channels/plugins/types.core.ts:296](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L296)

---

### action

> **action**: `ChannelMessageActionName`

Defined in: [channels/plugins/types.core.ts:293](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L293)

---

### cfg

> **cfg**: [`SecureClawConfig`](SecureClawConfig.md)

Defined in: [channels/plugins/types.core.ts:294](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L294)

---

### channel

> **channel**: [`ChannelId`](ChannelId.md)

Defined in: [channels/plugins/types.core.ts:292](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L292)

---

### dryRun?

> `optional` **dryRun**: `boolean`

Defined in: [channels/plugins/types.core.ts:306](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L306)

---

### gateway?

> `optional` **gateway**: `object`

Defined in: [channels/plugins/types.core.ts:297](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L297)

#### clientDisplayName?

> `optional` **clientDisplayName**: `string`

#### clientName

> **clientName**: `GatewayClientName`

#### mode

> **mode**: `GatewayClientMode`

#### timeoutMs?

> `optional` **timeoutMs**: `number`

#### token?

> `optional` **token**: `string`

#### url?

> `optional` **url**: `string`

---

### params

> **params**: `Record`\<`string`, `unknown`\>

Defined in: [channels/plugins/types.core.ts:295](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L295)

---

### toolContext?

> `optional` **toolContext**: [`ChannelThreadingToolContext`](ChannelThreadingToolContext.md)

Defined in: [channels/plugins/types.core.ts:305](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L305)
