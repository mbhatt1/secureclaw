[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / MSTeamsConfig

# Type Alias: MSTeamsConfig

> **MSTeamsConfig** = `object`

Defined in: [config/types.msteams.ts:45](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L45)

Configuration types for messaging channels.

Key types:

- DmPolicy/GroupPolicy: Access control for direct messages and groups
- GroupToolPolicyConfig: Control which agent tools are available in groups
- MarkdownConfig: Markdown rendering options per channel
- GoogleChatConfig/MSTeamsConfig: Channel-specific configuration schemas

## Properties

### allowFrom?

> `optional` **allowFrom**: `string`[]

Defined in: [config/types.msteams.ts:65](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L65)

Allowlist for DM senders (AAD object IDs or UPNs).

---

### appId?

> `optional` **appId**: `string`

Defined in: [config/types.msteams.ts:55](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L55)

Azure Bot App ID (from Azure Bot registration).

---

### appPassword?

> `optional` **appPassword**: `string`

Defined in: [config/types.msteams.ts:57](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L57)

Azure Bot App Password / Client Secret.

---

### blockStreamingCoalesce?

> `optional` **blockStreamingCoalesce**: [`BlockStreamingCoalesceConfig`](BlockStreamingCoalesceConfig.md)

Defined in: [config/types.msteams.ts:80](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L80)

Merge streamed block replies before sending.

---

### capabilities?

> `optional` **capabilities**: `string`[]

Defined in: [config/types.msteams.ts:49](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L49)

Optional provider capability tags used for agent/runtime guidance.

---

### chunkMode?

> `optional` **chunkMode**: `"length"` \| `"newline"`

Defined in: [config/types.msteams.ts:78](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L78)

Chunking mode: "length" (default) splits by size; "newline" splits on every newline.

---

### configWrites?

> `optional` **configWrites**: `boolean`

Defined in: [config/types.msteams.ts:53](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L53)

Allow channel-initiated config writes (default: true).

---

### dmHistoryLimit?

> `optional` **dmHistoryLimit**: `number`

Defined in: [config/types.msteams.ts:96](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L96)

Max DM turns to keep as history context.

---

### dmPolicy?

> `optional` **dmPolicy**: [`DmPolicy`](DmPolicy.md)

Defined in: [config/types.msteams.ts:63](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L63)

Direct message access policy (default: pairing).

---

### dms?

> `optional` **dms**: `Record`\<`string`, [`DmConfig`](DmConfig.md)\>

Defined in: [config/types.msteams.ts:98](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L98)

Per-DM config overrides keyed by user ID.

---

### enabled?

> `optional` **enabled**: `boolean`

Defined in: [config/types.msteams.ts:47](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L47)

If false, do not start the MS Teams provider. Default: true.

---

### groupAllowFrom?

> `optional` **groupAllowFrom**: `string`[]

Defined in: [config/types.msteams.ts:67](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L67)

Optional allowlist for group/channel senders (AAD object IDs or UPNs).

---

### groupPolicy?

> `optional` **groupPolicy**: [`GroupPolicy`](GroupPolicy.md)

Defined in: [config/types.msteams.ts:74](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L74)

Controls how group/channel messages are handled:

- "open": groups bypass allowFrom; mention-gating applies
- "disabled": block all group messages
- "allowlist": only allow group messages from senders in groupAllowFrom/allowFrom

---

### heartbeat?

> `optional` **heartbeat**: `ChannelHeartbeatVisibilityConfig`

Defined in: [config/types.msteams.ts:108](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L108)

Heartbeat visibility settings for this channel.

---

### historyLimit?

> `optional` **historyLimit**: `number`

Defined in: [config/types.msteams.ts:94](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L94)

Max group/channel messages to keep as history context (0 disables).

---

### markdown?

> `optional` **markdown**: [`MarkdownConfig`](MarkdownConfig.md)

Defined in: [config/types.msteams.ts:51](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L51)

Markdown formatting overrides (tables).

---

### mediaAllowHosts?

> `optional` **mediaAllowHosts**: `string`[]

Defined in: [config/types.msteams.ts:85](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L85)

Allowed host suffixes for inbound attachment downloads.
Use ["*"] to allow any host (not recommended).

---

### mediaAuthAllowHosts?

> `optional` **mediaAuthAllowHosts**: `string`[]

Defined in: [config/types.msteams.ts:90](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L90)

Allowed host suffixes for attaching Authorization headers to inbound media retries.
Use specific hosts only; avoid multi-tenant suffixes.

---

### mediaMaxMb?

> `optional` **mediaMaxMb**: `number`

Defined in: [config/types.msteams.ts:104](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L104)

Max media size in MB (default: 100MB for OneDrive upload support).

---

### replyStyle?

> `optional` **replyStyle**: [`MSTeamsReplyStyle`](MSTeamsReplyStyle.md)

Defined in: [config/types.msteams.ts:100](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L100)

Default reply style: "thread" replies to the message, "top-level" posts a new message.

---

### requireMention?

> `optional` **requireMention**: `boolean`

Defined in: [config/types.msteams.ts:92](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L92)

Default: require

#### Mention

to respond in channels/groups.

---

### responsePrefix?

> `optional` **responsePrefix**: `string`

Defined in: [config/types.msteams.ts:110](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L110)

Outbound response prefix override for this channel/account.

---

### sharePointSiteId?

> `optional` **sharePointSiteId**: `string`

Defined in: [config/types.msteams.ts:106](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L106)

SharePoint site ID for file uploads in group chats/channels (e.g., "contoso.sharepoint.com,guid1,guid2").

---

### teams?

> `optional` **teams**: `Record`\<`string`, [`MSTeamsTeamConfig`](MSTeamsTeamConfig.md)\>

Defined in: [config/types.msteams.ts:102](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L102)

Per-team config. Key is team ID (from the /team/ URL path segment).

---

### tenantId?

> `optional` **tenantId**: `string`

Defined in: [config/types.msteams.ts:59](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L59)

Azure AD Tenant ID (for single-tenant bots).

---

### textChunkLimit?

> `optional` **textChunkLimit**: `number`

Defined in: [config/types.msteams.ts:76](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L76)

Outbound text chunk size (chars). Default: 4000.

---

### webhook?

> `optional` **webhook**: `MSTeamsWebhookConfig`

Defined in: [config/types.msteams.ts:61](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L61)

Webhook server configuration.
