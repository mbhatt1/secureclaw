[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / MarkdownConfig

# Type Alias: MarkdownConfig

> **MarkdownConfig** = `object`

Defined in: [config/types.base.ts:36](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.base.ts#L36)

Configuration types for messaging channels.

Key types:

- DmPolicy/GroupPolicy: Access control for direct messages and groups
- GroupToolPolicyConfig: Control which agent tools are available in groups
- MarkdownConfig: Markdown rendering options per channel
- GoogleChatConfig/MSTeamsConfig: Channel-specific configuration schemas

## Properties

### tables?

> `optional` **tables**: [`MarkdownTableMode`](MarkdownTableMode.md)

Defined in: [config/types.base.ts:38](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.base.ts#L38)

Table rendering mode (off|bullets|code).
