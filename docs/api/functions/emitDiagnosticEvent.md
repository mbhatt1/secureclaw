[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / emitDiagnosticEvent

# Function: emitDiagnosticEvent()

> **emitDiagnosticEvent**(`event`): `void`

Defined in: [infra/diagnostic-events.ts:156](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/infra/diagnostic-events.ts#L156)

## Parameters

### event

`Omit`\<[`DiagnosticUsageEvent`](../type-aliases/DiagnosticUsageEvent.md), `"seq"` \| `"ts"`\> | `Omit`\<[`DiagnosticWebhookReceivedEvent`](../type-aliases/DiagnosticWebhookReceivedEvent.md), `"seq"` \| `"ts"`\> | `Omit`\<[`DiagnosticWebhookProcessedEvent`](../type-aliases/DiagnosticWebhookProcessedEvent.md), `"seq"` \| `"ts"`\> | `Omit`\<[`DiagnosticWebhookErrorEvent`](../type-aliases/DiagnosticWebhookErrorEvent.md), `"seq"` \| `"ts"`\> | `Omit`\<[`DiagnosticMessageQueuedEvent`](../type-aliases/DiagnosticMessageQueuedEvent.md), `"seq"` \| `"ts"`\> | `Omit`\<[`DiagnosticMessageProcessedEvent`](../type-aliases/DiagnosticMessageProcessedEvent.md), `"seq"` \| `"ts"`\> | `Omit`\<[`DiagnosticSessionStateEvent`](../type-aliases/DiagnosticSessionStateEvent.md), `"seq"` \| `"ts"`\> | `Omit`\<[`DiagnosticSessionStuckEvent`](../type-aliases/DiagnosticSessionStuckEvent.md), `"seq"` \| `"ts"`\> | `Omit`\<[`DiagnosticLaneEnqueueEvent`](../type-aliases/DiagnosticLaneEnqueueEvent.md), `"seq"` \| `"ts"`\> | `Omit`\<[`DiagnosticLaneDequeueEvent`](../type-aliases/DiagnosticLaneDequeueEvent.md), `"seq"` \| `"ts"`\> | `Omit`\<[`DiagnosticRunAttemptEvent`](../type-aliases/DiagnosticRunAttemptEvent.md), `"seq"` \| `"ts"`\> | `Omit`\<[`DiagnosticHeartbeatEvent`](../type-aliases/DiagnosticHeartbeatEvent.md), `"seq"` \| `"ts"`\>

## Returns

`void`
