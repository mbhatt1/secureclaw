[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / RespondFn

# Type Alias: RespondFn()

> **RespondFn** = (`ok`, `payload?`, `error?`, `meta?`) => `void`

Defined in: [gateway/server-methods/types.ts:20](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/gateway/server-methods/types.ts#L20)

Gateway HTTP request handler types.
Used for implementing custom HTTP endpoints and webhooks.

## Parameters

### ok

`boolean`

### payload?

`unknown`

### error?

`ErrorShape`

### meta?

`Record`\<`string`, `unknown`\>

## Returns

`void`
