[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / GroupToolPolicyConfig

# Type Alias: GroupToolPolicyConfig

> **GroupToolPolicyConfig** = `object`

Defined in: [config/types.tools.ts:154](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.tools.ts#L154)

Configuration types for messaging channels.

Key types:

- DmPolicy/GroupPolicy: Access control for direct messages and groups
- GroupToolPolicyConfig: Control which agent tools are available in groups
- MarkdownConfig: Markdown rendering options per channel
- GoogleChatConfig/MSTeamsConfig: Channel-specific configuration schemas

## Properties

### allow?

> `optional` **allow**: `string`[]

Defined in: [config/types.tools.ts:155](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.tools.ts#L155)

---

### alsoAllow?

> `optional` **alsoAllow**: `string`[]

Defined in: [config/types.tools.ts:157](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.tools.ts#L157)

Additional allowlist entries merged into allow.

---

### deny?

> `optional` **deny**: `string`[]

Defined in: [config/types.tools.ts:158](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.tools.ts#L158)
