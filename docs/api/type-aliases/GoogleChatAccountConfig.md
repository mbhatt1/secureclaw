[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / GoogleChatAccountConfig

# Type Alias: GoogleChatAccountConfig

> **GoogleChatAccountConfig** = `object`

Defined in: [config/types.googlechat.ts:35](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L35)

Configuration types for messaging channels.

Key types:

- DmPolicy/GroupPolicy: Access control for direct messages and groups
- GroupToolPolicyConfig: Control which agent tools are available in groups
- MarkdownConfig: Markdown rendering options per channel
- GoogleChatConfig/MSTeamsConfig: Channel-specific configuration schemas

## Properties

### actions?

> `optional` **actions**: [`GoogleChatActionConfig`](GoogleChatActionConfig.md)

Defined in: [config/types.googlechat.ts:90](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L90)

Per-action tool gating (default: true for all).

---

### allowBots?

> `optional` **allowBots**: `boolean`

Defined in: [config/types.googlechat.ts:45](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L45)

Allow bot-authored messages to trigger replies (default: false).

---

### audience?

> `optional` **audience**: `string`

Defined in: [config/types.googlechat.ts:66](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L66)

Audience value (app URL or project number).

---

### audienceType?

> `optional` **audienceType**: `"app-url"` \| `"project-number"`

Defined in: [config/types.googlechat.ts:64](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L64)

Webhook audience type (app-url or project-number).

---

### blockStreaming?

> `optional` **blockStreaming**: `boolean`

Defined in: [config/types.googlechat.ts:83](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L83)

---

### blockStreamingCoalesce?

> `optional` **blockStreamingCoalesce**: [`BlockStreamingCoalesceConfig`](BlockStreamingCoalesceConfig.md)

Defined in: [config/types.googlechat.ts:85](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L85)

Merge streamed block replies before sending.

---

### botUser?

> `optional` **botUser**: `string`

Defined in: [config/types.googlechat.ts:72](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L72)

Optional bot user resource name (users/...).

---

### capabilities?

> `optional` **capabilities**: `string`[]

Defined in: [config/types.googlechat.ts:39](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L39)

Optional provider capability tags used for agent/runtime guidance.

---

### chunkMode?

> `optional` **chunkMode**: `"length"` \| `"newline"`

Defined in: [config/types.googlechat.ts:82](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L82)

Chunking mode: "length" (default) splits by size; "newline" splits on every newline.

---

### configWrites?

> `optional` **configWrites**: `boolean`

Defined in: [config/types.googlechat.ts:41](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L41)

Allow channel-initiated config writes (default: true).

---

### dm?

> `optional` **dm**: [`GoogleChatDmConfig`](GoogleChatDmConfig.md)

Defined in: [config/types.googlechat.ts:91](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L91)

---

### dmHistoryLimit?

> `optional` **dmHistoryLimit**: `number`

Defined in: [config/types.googlechat.ts:76](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L76)

Max DM turns to keep as history context.

---

### dms?

> `optional` **dms**: `Record`\<`string`, [`DmConfig`](DmConfig.md)\>

Defined in: [config/types.googlechat.ts:78](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L78)

Per-DM config overrides keyed by user id.

---

### enabled?

> `optional` **enabled**: `boolean`

Defined in: [config/types.googlechat.ts:43](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L43)

If false, do not start this Google Chat account. Default: true.

---

### groupAllowFrom?

> `optional` **groupAllowFrom**: (`string` \| `number`)[]

Defined in: [config/types.googlechat.ts:56](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L56)

Optional allowlist for space senders (user ids or emails).

---

### groupPolicy?

> `optional` **groupPolicy**: [`GroupPolicy`](GroupPolicy.md)

Defined in: [config/types.googlechat.ts:54](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L54)

Controls how space messages are handled:

- "open": spaces bypass allowlists; mention-gating applies
- "disabled": block all space messages
- "allowlist": only allow spaces present in channels.googlechat.groups

---

### groups?

> `optional` **groups**: `Record`\<`string`, [`GoogleChatGroupConfig`](GoogleChatGroupConfig.md)\>

Defined in: [config/types.googlechat.ts:58](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L58)

Per-space configuration keyed by space id or name.

---

### historyLimit?

> `optional` **historyLimit**: `number`

Defined in: [config/types.googlechat.ts:74](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L74)

Max space messages to keep as history context (0 disables).

---

### mediaMaxMb?

> `optional` **mediaMaxMb**: `number`

Defined in: [config/types.googlechat.ts:86](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L86)

---

### name?

> `optional` **name**: `string`

Defined in: [config/types.googlechat.ts:37](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L37)

Optional display name for this account (used in CLI/UI lists).

---

### replyToMode?

> `optional` **replyToMode**: `ReplyToMode`

Defined in: [config/types.googlechat.ts:88](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L88)

Control reply threading when reply tags are present (off|first|all).

---

### requireMention?

> `optional` **requireMention**: `boolean`

Defined in: [config/types.googlechat.ts:47](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L47)

Default mention requirement for space messages (default: true).

---

### responsePrefix?

> `optional` **responsePrefix**: `string`

Defined in: [config/types.googlechat.ts:102](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L102)

Outbound response prefix override for this channel/account.

---

### serviceAccount?

> `optional` **serviceAccount**: `string` \| `Record`\<`string`, `unknown`\>

Defined in: [config/types.googlechat.ts:60](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L60)

Service account JSON (inline string or object).

---

### serviceAccountFile?

> `optional` **serviceAccountFile**: `string`

Defined in: [config/types.googlechat.ts:62](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L62)

Service account JSON file path.

---

### textChunkLimit?

> `optional` **textChunkLimit**: `number`

Defined in: [config/types.googlechat.ts:80](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L80)

Outbound text chunk size (chars). Default: 4000.

---

### typingIndicator?

> `optional` **typingIndicator**: `"none"` \| `"message"` \| `"reaction"`

Defined in: [config/types.googlechat.ts:100](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L100)

Typing indicator mode (default: "message").

- "none": No indicator
- "message": Send "_<name> is typing..._" then edit with response
- "reaction": React with 👀 to user message, remove on reply
  NOTE: Reaction mode requires user OAuth (not supported with service account auth).
  If configured, falls back to message mode with a warning.

---

### webhookPath?

> `optional` **webhookPath**: `string`

Defined in: [config/types.googlechat.ts:68](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L68)

Google Chat webhook path (default: /googlechat).

---

### webhookUrl?

> `optional` **webhookUrl**: `string`

Defined in: [config/types.googlechat.ts:70](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L70)

Google Chat webhook URL (used to derive the path).
