[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / shouldAckReactionForWhatsApp

# Function: shouldAckReactionForWhatsApp()

> **shouldAckReactionForWhatsApp**(`params`): `boolean`

Defined in: [channels/ack-reactions.ts:45](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/ack-reactions.ts#L45)

Acknowledgment reaction utilities.

- removeAckReactionAfterReply: Remove ack reaction after sending reply
- shouldAckReaction: Determine if ack reaction should be sent
- shouldAckReactionForWhatsApp: WhatsApp-specific ack logic

## Parameters

### params

#### directEnabled

`boolean`

#### emoji

`string`

#### groupActivated

`boolean`

#### groupMode

[`WhatsAppAckReactionMode`](../type-aliases/WhatsAppAckReactionMode.md)

#### isDirect

`boolean`

#### isGroup

`boolean`

#### wasMentioned

`boolean`

## Returns

`boolean`
