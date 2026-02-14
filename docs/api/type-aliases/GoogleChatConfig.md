[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / GoogleChatConfig

# Type Alias: GoogleChatConfig

> **GoogleChatConfig** = `object` & [`GoogleChatAccountConfig`](GoogleChatAccountConfig.md)

Defined in: [config/types.googlechat.ts:105](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.googlechat.ts#L105)

Configuration types for messaging channels.

Key types:

- DmPolicy/GroupPolicy: Access control for direct messages and groups
- GroupToolPolicyConfig: Control which agent tools are available in groups
- MarkdownConfig: Markdown rendering options per channel
- GoogleChatConfig/MSTeamsConfig: Channel-specific configuration schemas

## Type Declaration

### accounts?

> `optional` **accounts**: `Record`\<`string`, [`GoogleChatAccountConfig`](GoogleChatAccountConfig.md)\>

Optional per-account Google Chat configuration (multi-account).

### defaultAccount?

> `optional` **defaultAccount**: `string`

Optional default account id when multiple accounts are configured.
