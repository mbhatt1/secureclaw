[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / logTypingFailure

# Function: logTypingFailure()

> **logTypingFailure**(`params`): `void`

Defined in: [channels/logging.ts:13](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/logging.ts#L13)

Channel-specific logging utilities.

- logAckFailure: Log failures in sending ack reactions
- logInboundDrop: Log dropped inbound messages
- logTypingFailure: Log failures in typing indicator updates

## Parameters

### params

#### action?

`"start"` \| `"stop"`

#### channel

`string`

#### error

`unknown`

#### log

`LogFn`

#### target?

`string`

## Returns

`void`
