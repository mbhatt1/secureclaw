[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / DiagnosticUsageEvent

# Type Alias: DiagnosticUsageEvent

> **DiagnosticUsageEvent** = `DiagnosticBaseEvent` & `object`

Defined in: [infra/diagnostic-events.ts:10](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/infra/diagnostic-events.ts#L10)

## Type Declaration

### channel?

> `optional` **channel**: `string`

### context?

> `optional` **context**: `object`

#### context.limit?

> `optional` **limit**: `number`

#### context.used?

> `optional` **used**: `number`

### costUsd?

> `optional` **costUsd**: `number`

### durationMs?

> `optional` **durationMs**: `number`

### model?

> `optional` **model**: `string`

### provider?

> `optional` **provider**: `string`

### sessionId?

> `optional` **sessionId**: `string`

### sessionKey?

> `optional` **sessionKey**: `string`

### type

> **type**: `"model.usage"`

### usage

> **usage**: `object`

#### usage.cacheRead?

> `optional` **cacheRead**: `number`

#### usage.cacheWrite?

> `optional` **cacheWrite**: `number`

#### usage.input?

> `optional` **input**: `number`

#### usage.output?

> `optional` **output**: `number`

#### usage.promptTokens?

> `optional` **promptTokens**: `number`

#### usage.total?

> `optional` **total**: `number`
