[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / DiagnosticSessionStateEvent

# Type Alias: DiagnosticSessionStateEvent

> **DiagnosticSessionStateEvent** = `DiagnosticBaseEvent` & `object`

Defined in: [infra/diagnostic-events.ts:78](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/infra/diagnostic-events.ts#L78)

## Type Declaration

### prevState?

> `optional` **prevState**: [`DiagnosticSessionState`](DiagnosticSessionState.md)

### queueDepth?

> `optional` **queueDepth**: `number`

### reason?

> `optional` **reason**: `string`

### sessionId?

> `optional` **sessionId**: `string`

### sessionKey?

> `optional` **sessionKey**: `string`

### state

> **state**: [`DiagnosticSessionState`](DiagnosticSessionState.md)

### type

> **type**: `"session.state"`
