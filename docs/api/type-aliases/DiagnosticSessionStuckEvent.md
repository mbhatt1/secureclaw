[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / DiagnosticSessionStuckEvent

# Type Alias: DiagnosticSessionStuckEvent

> **DiagnosticSessionStuckEvent** = `DiagnosticBaseEvent` & `object`

Defined in: [infra/diagnostic-events.ts:88](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/infra/diagnostic-events.ts#L88)

## Type Declaration

### ageMs

> **ageMs**: `number`

### queueDepth?

> `optional` **queueDepth**: `number`

### sessionId?

> `optional` **sessionId**: `string`

### sessionKey?

> `optional` **sessionKey**: `string`

### state

> **state**: [`DiagnosticSessionState`](DiagnosticSessionState.md)

### type

> **type**: `"session.stuck"`
