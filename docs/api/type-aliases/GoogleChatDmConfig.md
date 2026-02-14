[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / GoogleChatDmConfig

# Type Alias: GoogleChatDmConfig

> **GoogleChatDmConfig** = `object`

Defined in: [config/types.googlechat.ts:9](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L9)

Configuration types for messaging channels.

Key types:

- DmPolicy/GroupPolicy: Access control for direct messages and groups
- GroupToolPolicyConfig: Control which agent tools are available in groups
- MarkdownConfig: Markdown rendering options per channel
- GoogleChatConfig/MSTeamsConfig: Channel-specific configuration schemas

## Properties

### allowFrom?

> `optional` **allowFrom**: (`string` \| `number`)[]

Defined in: [config/types.googlechat.ts:15](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L15)

Allowlist for DM senders (user ids or emails).

---

### enabled?

> `optional` **enabled**: `boolean`

Defined in: [config/types.googlechat.ts:11](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L11)

If false, ignore all incoming Google Chat DMs. Default: true.

---

### policy?

> `optional` **policy**: [`DmPolicy`](DmPolicy.md)

Defined in: [config/types.googlechat.ts:13](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L13)

Direct message access policy (default: pairing).
