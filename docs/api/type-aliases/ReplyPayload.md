[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ReplyPayload

# Type Alias: ReplyPayload

> **ReplyPayload** = `object`

Defined in: [auto-reply/types.ts:48](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/auto-reply/types.ts#L48)

ReplyPayload: Structure for agent reply messages.
Contains text, media, reactions, and metadata for a reply.

## Properties

### audioAsVoice?

> `optional` **audioAsVoice**: `boolean`

Defined in: [auto-reply/types.ts:57](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/auto-reply/types.ts#L57)

Send audio as voice message (bubble) instead of audio file. Defaults to false.

---

### channelData?

> `optional` **channelData**: `Record`\<`string`, `unknown`\>

Defined in: [auto-reply/types.ts:60](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/auto-reply/types.ts#L60)

Channel-specific payload data (per-channel envelope).

---

### isError?

> `optional` **isError**: `boolean`

Defined in: [auto-reply/types.ts:58](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/auto-reply/types.ts#L58)

---

### mediaUrl?

> `optional` **mediaUrl**: `string`

Defined in: [auto-reply/types.ts:50](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/auto-reply/types.ts#L50)

---

### mediaUrls?

> `optional` **mediaUrls**: `string`[]

Defined in: [auto-reply/types.ts:51](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/auto-reply/types.ts#L51)

---

### replyToCurrent?

> `optional` **replyToCurrent**: `boolean`

Defined in: [auto-reply/types.ts:55](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/auto-reply/types.ts#L55)

True when [[reply_to_current]] was present but not yet mapped to a message id.

---

### replyToId?

> `optional` **replyToId**: `string`

Defined in: [auto-reply/types.ts:52](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/auto-reply/types.ts#L52)

---

### replyToTag?

> `optional` **replyToTag**: `boolean`

Defined in: [auto-reply/types.ts:53](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/auto-reply/types.ts#L53)

---

### text?

> `optional` **text**: `string`

Defined in: [auto-reply/types.ts:49](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/auto-reply/types.ts#L49)
