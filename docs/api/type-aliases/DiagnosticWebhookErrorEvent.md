[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / DiagnosticWebhookErrorEvent

# Type Alias: DiagnosticWebhookErrorEvent

> **DiagnosticWebhookErrorEvent** = `DiagnosticBaseEvent` & `object`

Defined in: [infra/diagnostic-events.ts:48](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/infra/diagnostic-events.ts#L48)

## Type Declaration

### channel

> **channel**: `string`

### chatId?

> `optional` **chatId**: `number` \| `string`

### error

> **error**: `string`

### type

> **type**: `"webhook.error"`

### updateType?

> `optional` **updateType**: `string`
