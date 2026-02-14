[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / DiagnosticHeartbeatEvent

# Type Alias: DiagnosticHeartbeatEvent

> **DiagnosticHeartbeatEvent** = `DiagnosticBaseEvent` & `object`

Defined in: [infra/diagnostic-events.ts:118](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/infra/diagnostic-events.ts#L118)

## Type Declaration

### active

> **active**: `number`

### queued

> **queued**: `number`

### type

> **type**: `"diagnostic.heartbeat"`

### waiting

> **waiting**: `number`

### webhooks

> **webhooks**: `object`

#### webhooks.errors

> **errors**: `number`

#### webhooks.processed

> **processed**: `number`

#### webhooks.received

> **received**: `number`
