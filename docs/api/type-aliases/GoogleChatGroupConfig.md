[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / GoogleChatGroupConfig

# Type Alias: GoogleChatGroupConfig

> **GoogleChatGroupConfig** = `object`

Defined in: [config/types.googlechat.ts:18](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L18)

Configuration types for messaging channels.

Key types:

- DmPolicy/GroupPolicy: Access control for direct messages and groups
- GroupToolPolicyConfig: Control which agent tools are available in groups
- MarkdownConfig: Markdown rendering options per channel
- GoogleChatConfig/MSTeamsConfig: Channel-specific configuration schemas

## Properties

### allow?

> `optional` **allow**: `boolean`

Defined in: [config/types.googlechat.ts:22](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L22)

Legacy allow toggle; prefer enabled.

---

### enabled?

> `optional` **enabled**: `boolean`

Defined in: [config/types.googlechat.ts:20](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L20)

If false, disable the bot in this space. (Alias for allow: false.)

---

### requireMention?

> `optional` **requireMention**: `boolean`

Defined in: [config/types.googlechat.ts:24](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L24)

Require mentioning the bot to trigger replies.

---

### systemPrompt?

> `optional` **systemPrompt**: `string`

Defined in: [config/types.googlechat.ts:28](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L28)

Optional system prompt for this space.

---

### users?

> `optional` **users**: (`string` \| `number`)[]

Defined in: [config/types.googlechat.ts:26](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L26)

Allowlist of users that can invoke the bot in this space.
