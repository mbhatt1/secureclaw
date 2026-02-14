[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / MSTeamsTeamConfig

# Type Alias: MSTeamsTeamConfig

> **MSTeamsTeamConfig** = `object`

Defined in: [config/types.msteams.ts:33](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L33)

Team-level config for MS Teams.

## Properties

### channels?

> `optional` **channels**: `Record`\<`string`, [`MSTeamsChannelConfig`](MSTeamsChannelConfig.md)\>

Defined in: [config/types.msteams.ts:42](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L42)

Per-channel overrides. Key is conversation ID (e.g., "19:...@thread.tacv2").

---

### replyStyle?

> `optional` **replyStyle**: [`MSTeamsReplyStyle`](MSTeamsReplyStyle.md)

Defined in: [config/types.msteams.ts:40](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L40)

Default reply style for channels in this team.

---

### requireMention?

> `optional` **requireMention**: `boolean`

Defined in: [config/types.msteams.ts:35](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L35)

Default requireMention for channels in this team.

---

### tools?

> `optional` **tools**: [`GroupToolPolicyConfig`](GroupToolPolicyConfig.md)

Defined in: [config/types.msteams.ts:37](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L37)

Default tool policy for channels in this team.

---

### toolsBySender?

> `optional` **toolsBySender**: [`GroupToolPolicyBySenderConfig`](GroupToolPolicyBySenderConfig.md)

Defined in: [config/types.msteams.ts:38](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L38)
