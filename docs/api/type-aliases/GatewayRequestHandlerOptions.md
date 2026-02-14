[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / GatewayRequestHandlerOptions

# Type Alias: GatewayRequestHandlerOptions

> **GatewayRequestHandlerOptions** = `object`

Defined in: [gateway/server-methods/types.ts:108](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/gateway/server-methods/types.ts#L108)

Gateway HTTP request handler types.
Used for implementing custom HTTP endpoints and webhooks.

## Properties

### client

> **client**: `GatewayClient` \| `null`

Defined in: [gateway/server-methods/types.ts:111](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/gateway/server-methods/types.ts#L111)

---

### context

> **context**: `GatewayRequestContext`

Defined in: [gateway/server-methods/types.ts:114](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/gateway/server-methods/types.ts#L114)

---

### isWebchatConnect()

> **isWebchatConnect**: (`params`) => `boolean`

Defined in: [gateway/server-methods/types.ts:112](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/gateway/server-methods/types.ts#L112)

#### Parameters

##### params

`ConnectParams` | `null` | `undefined`

#### Returns

`boolean`

---

### params

> **params**: `Record`\<`string`, `unknown`\>

Defined in: [gateway/server-methods/types.ts:110](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/gateway/server-methods/types.ts#L110)

---

### req

> **req**: `RequestFrame`

Defined in: [gateway/server-methods/types.ts:109](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/gateway/server-methods/types.ts#L109)

---

### respond

> **respond**: [`RespondFn`](RespondFn.md)

Defined in: [gateway/server-methods/types.ts:113](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/gateway/server-methods/types.ts#L113)
