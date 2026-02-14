[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / MSTeamsChannelConfig

# Type Alias: MSTeamsChannelConfig

> **MSTeamsChannelConfig** = `object`

Defined in: [config/types.msteams.ts:22](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L22)

Channel-level config for MS Teams.

## Properties

### replyStyle?

> `optional` **replyStyle**: [`MSTeamsReplyStyle`](MSTeamsReplyStyle.md)

Defined in: [config/types.msteams.ts:29](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L29)

Reply style: "thread" replies to the message, "top-level" posts a new message.

---

### requireMention?

> `optional` **requireMention**: `boolean`

Defined in: [config/types.msteams.ts:24](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L24)

Require

#### Mention

to respond. Default: true.

---

### tools?

> `optional` **tools**: [`GroupToolPolicyConfig`](GroupToolPolicyConfig.md)

Defined in: [config/types.msteams.ts:26](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L26)

Optional tool policy overrides for this channel.

---

### toolsBySender?

> `optional` **toolsBySender**: [`GroupToolPolicyBySenderConfig`](GroupToolPolicyBySenderConfig.md)

Defined in: [config/types.msteams.ts:27](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/config/types.msteams.ts#L27)
