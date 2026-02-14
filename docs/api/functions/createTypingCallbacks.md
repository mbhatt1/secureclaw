[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / createTypingCallbacks

# Function: createTypingCallbacks()

> **createTypingCallbacks**(`params`): `TypingCallbacks`

Defined in: [channels/typing.ts:8](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/typing.ts#L8)

Creates typing indicator callbacks for messaging channels.
Returns functions to start/stop typing indicators during processing.

## Parameters

### params

#### onStartError

(`err`) => `void`

#### onStopError?

(`err`) => `void`

#### start

() => `Promise`\<`void`\>

#### stop?

() => `Promise`\<`void`\>

## Returns

`TypingCallbacks`
