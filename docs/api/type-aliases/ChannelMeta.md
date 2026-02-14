[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelMeta

# Type Alias: ChannelMeta

> **ChannelMeta** = `object`

Defined in: [channels/plugins/types.core.ts:74](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L74)

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

### aliases?

> `optional` **aliases**: `string`[]

Defined in: [channels/plugins/types.core.ts:82](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L82)

---

### blurb

> **blurb**: `string`

Defined in: [channels/plugins/types.core.ts:80](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L80)

---

### detailLabel?

> `optional` **detailLabel**: `string`

Defined in: [channels/plugins/types.core.ts:86](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L86)

---

### docsLabel?

> `optional` **docsLabel**: `string`

Defined in: [channels/plugins/types.core.ts:79](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L79)

---

### docsPath

> **docsPath**: `string`

Defined in: [channels/plugins/types.core.ts:78](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L78)

---

### forceAccountBinding?

> `optional` **forceAccountBinding**: `boolean`

Defined in: [channels/plugins/types.core.ts:90](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L90)

---

### id

> **id**: [`ChannelId`](ChannelId.md)

Defined in: [channels/plugins/types.core.ts:75](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L75)

---

### label

> **label**: `string`

Defined in: [channels/plugins/types.core.ts:76](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L76)

---

### order?

> `optional` **order**: `number`

Defined in: [channels/plugins/types.core.ts:81](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L81)

---

### preferOver?

> `optional` **preferOver**: `string`[]

Defined in: [channels/plugins/types.core.ts:92](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L92)

---

### preferSessionLookupForAnnounceTarget?

> `optional` **preferSessionLookupForAnnounceTarget**: `boolean`

Defined in: [channels/plugins/types.core.ts:91](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L91)

---

### quickstartAllowFrom?

> `optional` **quickstartAllowFrom**: `boolean`

Defined in: [channels/plugins/types.core.ts:89](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L89)

---

### selectionDocsOmitLabel?

> `optional` **selectionDocsOmitLabel**: `boolean`

Defined in: [channels/plugins/types.core.ts:84](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L84)

---

### selectionDocsPrefix?

> `optional` **selectionDocsPrefix**: `string`

Defined in: [channels/plugins/types.core.ts:83](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L83)

---

### selectionExtras?

> `optional` **selectionExtras**: `string`[]

Defined in: [channels/plugins/types.core.ts:85](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L85)

---

### selectionLabel

> **selectionLabel**: `string`

Defined in: [channels/plugins/types.core.ts:77](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L77)

---

### showConfigured?

> `optional` **showConfigured**: `boolean`

Defined in: [channels/plugins/types.core.ts:88](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L88)

---

### systemImage?

> `optional` **systemImage**: `string`

Defined in: [channels/plugins/types.core.ts:87](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L87)
