[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / DiagnosticMessageQueuedEvent

# Type Alias: DiagnosticMessageQueuedEvent

> **DiagnosticMessageQueuedEvent** = `DiagnosticBaseEvent` & `object`

Defined in: [infra/diagnostic-events.ts:56](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/infra/diagnostic-events.ts#L56)

## Type Declaration

### channel?

> `optional` **channel**: `string`

### queueDepth?

> `optional` **queueDepth**: `number`

### sessionId?

> `optional` **sessionId**: `string`

### sessionKey?

> `optional` **sessionKey**: `string`

### source

> **source**: `string`

### type

> **type**: `"message.queued"`
