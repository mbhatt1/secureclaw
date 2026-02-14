[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelDock

# Type Alias: ChannelDock

> **ChannelDock** = `object`

Defined in: [channels/dock.ts:44](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/dock.ts#L44)

ChannelDock: Registry of all available messaging channel plugins.

## Properties

### agentPrompt?

> `optional` **agentPrompt**: `ChannelAgentPromptAdapter`

Defined in: [channels/dock.ts:67](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/dock.ts#L67)

---

### capabilities

> **capabilities**: [`ChannelCapabilities`](ChannelCapabilities.md)

Defined in: [channels/dock.ts:46](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/dock.ts#L46)

---

### commands?

> `optional` **commands**: [`ChannelCommandAdapter`](ChannelCommandAdapter.md)

Defined in: [channels/dock.ts:47](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/dock.ts#L47)

---

### config?

> `optional` **config**: `object`

Defined in: [channels/dock.ts:53](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/dock.ts#L53)

#### formatAllowFrom()?

> `optional` **formatAllowFrom**: (`params`) => `string`[]

##### Parameters

###### params

###### accountId?

`string` \| `null`

###### allowFrom

(`string` \| `number`)[]

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

##### Returns

`string`[]

#### resolveAllowFrom()?

> `optional` **resolveAllowFrom**: (`params`) => (`string` \| `number`)[] \| `undefined`

##### Parameters

###### params

###### accountId?

`string` \| `null`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

##### Returns

(`string` \| `number`)[] \| `undefined`

---

### elevated?

> `optional` **elevated**: [`ChannelElevatedAdapter`](ChannelElevatedAdapter.md)

Defined in: [channels/dock.ts:52](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/dock.ts#L52)

---

### groups?

> `optional` **groups**: [`ChannelGroupAdapter`](ChannelGroupAdapter.md)

Defined in: [channels/dock.ts:64](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/dock.ts#L64)

---

### id

> **id**: [`ChannelId`](ChannelId.md)

Defined in: [channels/dock.ts:45](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/dock.ts#L45)

---

### mentions?

> `optional` **mentions**: [`ChannelMentionAdapter`](ChannelMentionAdapter.md)

Defined in: [channels/dock.ts:65](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/dock.ts#L65)

---

### outbound?

> `optional` **outbound**: `object`

Defined in: [channels/dock.ts:48](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/dock.ts#L48)

#### textChunkLimit?

> `optional` **textChunkLimit**: `number`

---

### streaming?

> `optional` **streaming**: `ChannelDockStreaming`

Defined in: [channels/dock.ts:51](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/dock.ts#L51)

---

### threading?

> `optional` **threading**: [`ChannelThreadingAdapter`](ChannelThreadingAdapter.md)

Defined in: [channels/dock.ts:66](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/dock.ts#L66)
