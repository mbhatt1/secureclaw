[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / DiagnosticMessageProcessedEvent

# Type Alias: DiagnosticMessageProcessedEvent

> **DiagnosticMessageProcessedEvent** = `DiagnosticBaseEvent` & `object`

Defined in: [infra/diagnostic-events.ts:65](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/infra/diagnostic-events.ts#L65)

## Type Declaration

### channel

> **channel**: `string`

### chatId?

> `optional` **chatId**: `number` \| `string`

### durationMs?

> `optional` **durationMs**: `number`

### error?

> `optional` **error**: `string`

### messageId?

> `optional` **messageId**: `number` \| `string`

### outcome

> **outcome**: `"completed"` \| `"skipped"` \| `"error"`

### reason?

> `optional` **reason**: `string`

### sessionId?

> `optional` **sessionId**: `string`

### sessionKey?

> `optional` **sessionKey**: `string`

### type

> **type**: `"message.processed"`
