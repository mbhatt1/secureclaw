[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / AckReactionGateParams

# Type Alias: AckReactionGateParams

> **AckReactionGateParams** = `object`

Defined in: [channels/ack-reactions.ts:5](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/ack-reactions.ts#L5)

Acknowledgment reaction configuration types.
Used to configure when and how the bot sends "read receipt" reactions.

- AckReactionGateParams: Parameters for determining if ack should be sent
- AckReactionScope: Scope of ack reactions (dm, group, all)
- WhatsAppAckReactionMode: WhatsApp-specific ack reaction behavior

## Properties

### canDetectMention

> **canDetectMention**: `boolean`

Defined in: [channels/ack-reactions.ts:11](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/ack-reactions.ts#L11)

---

### effectiveWasMentioned

> **effectiveWasMentioned**: `boolean`

Defined in: [channels/ack-reactions.ts:12](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/ack-reactions.ts#L12)

---

### isDirect

> **isDirect**: `boolean`

Defined in: [channels/ack-reactions.ts:7](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/ack-reactions.ts#L7)

---

### isGroup

> **isGroup**: `boolean`

Defined in: [channels/ack-reactions.ts:8](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/ack-reactions.ts#L8)

---

### isMentionableGroup

> **isMentionableGroup**: `boolean`

Defined in: [channels/ack-reactions.ts:9](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/ack-reactions.ts#L9)

---

### requireMention

> **requireMention**: `boolean`

Defined in: [channels/ack-reactions.ts:10](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/ack-reactions.ts#L10)

---

### scope

> **scope**: [`AckReactionScope`](AckReactionScope.md) \| `undefined`

Defined in: [channels/ack-reactions.ts:6](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/ack-reactions.ts#L6)

---

### shouldBypassMention?

> `optional` **shouldBypassMention**: `boolean`

Defined in: [channels/ack-reactions.ts:13](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/ack-reactions.ts#L13)
