[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / removeAckReactionAfterReply

# Function: removeAckReactionAfterReply()

> **removeAckReactionAfterReply**(`params`): `void`

Defined in: [channels/ack-reactions.ts:81](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/ack-reactions.ts#L81)

Acknowledgment reaction utilities.

- removeAckReactionAfterReply: Remove ack reaction after sending reply
- shouldAckReaction: Determine if ack reaction should be sent
- shouldAckReactionForWhatsApp: WhatsApp-specific ack logic

## Parameters

### params

#### ackReactionPromise

`Promise`\<`boolean`\> \| `null`

#### ackReactionValue

`string` \| `null`

#### onError?

(`err`) => `void`

#### remove

() => `Promise`\<`void`\>

#### removeAfterReply

`boolean`

## Returns

`void`
