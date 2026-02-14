---
summary: "Logging overview: file logs, console output, CLI tailing, and the Control UI"
read_when:
  - You need a beginner-friendly overview of logging
  - You want to configure log levels or formats
  - You are troubleshooting and need to find logs quickly
title: "Logging"
---

# Logging

SecureClaw logs in two places:

- **File logs** (JSON lines) written by the Gateway.
- **Console output** shown in terminals and the Control UI.

This page explains where logs live, how to read them, and how to configure log
levels and formats.

## Where logs live

By default, the Gateway writes a rolling log file under:

`/tmp/secureclaw/secureclaw-YYYY-MM-DD.log`

The date uses the gateway host's local timezone.

You can override this in `~/.secureclaw/secureclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/secureclaw.log"
  }
}
```

## How to read logs

### CLI: live tail (recommended)

Use the CLI to tail the gateway log file via RPC:

```bash
secureclaw logs --follow
```

Output modes:

- **TTY sessions**: pretty, colorized, structured log lines.
- **Non-TTY sessions**: plain text.
- `--json`: line-delimited JSON (one log event per line).
- `--plain`: force plain text in TTY sessions.
- `--no-color`: disable ANSI colors.

In JSON mode, the CLI emits `type`-tagged objects:

- `meta`: stream metadata (file, cursor, size)
- `log`: parsed log entry
- `notice`: truncation / rotation hints
- `raw`: unparsed log line

If the Gateway is unreachable, the CLI prints a short hint to run:

```bash
secureclaw doctor
```

### Control UI (web)

The Control UI’s **Logs** tab tails the same file using `logs.tail`.
See [/web/control-ui](/web/control-ui) for how to open it.

### Channel-only logs

To filter channel activity (WhatsApp/Telegram/etc), use:

```bash
secureclaw channels logs --channel whatsapp
```

## Log formats

### File logs (JSONL)

Each line in the log file is a JSON object. The CLI and Control UI parse these
entries to render structured output (time, level, subsystem, message).

### Console output

Console logs are **TTY-aware** and formatted for readability:

- Subsystem prefixes (e.g. `gateway/channels/whatsapp`)
- Level coloring (info/warn/error)
- Optional compact or JSON mode

Console formatting is controlled by `logging.consoleStyle`.

## Configuring logging

All logging configuration lives under `logging` in `~/.secureclaw/secureclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/secureclaw/secureclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Log levels

- `logging.level`: **file logs** (JSONL) level.
- `logging.consoleLevel`: **console** verbosity level.

`--verbose` only affects console output; it does not change file log levels.

### Console styles

`logging.consoleStyle`:

- `pretty`: human-friendly, colored, with timestamps.
- `compact`: tighter output (best for long sessions).
- `json`: JSON per line (for log processors).

### Redaction

Tool summaries can redact sensitive tokens before they hit the console:

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: list of regex strings to override the default set

Redaction affects **console output only** and does not alter file logs.

## Diagnostics + OpenTelemetry

Diagnostics are structured, machine-readable events for model runs **and**
message-flow telemetry (webhooks, queueing, session state). They do **not**
replace logs; they exist to feed metrics, traces, and other exporters.

Diagnostics events are emitted in-process, but exporters only attach when
diagnostics + the exporter plugin are enabled.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: the data model + SDKs for traces, metrics, and logs.
- **OTLP**: the wire protocol used to export OTel data to a collector/backend.
- SecureClaw exports via **OTLP/HTTP (protobuf)** today.

### Signals exported

- **Metrics**: counters + histograms (token usage, message flow, queueing).
- **Traces**: spans for model usage + webhook/message processing.
- **Logs**: exported over OTLP when `diagnostics.otel.logs` is enabled. Log
  volume can be high; keep `logging.level` and exporter filters in mind.

### Diagnostic event catalog

Model usage:

- `model.usage`: tokens, cost, duration, context, provider/model/channel, session ids.

Message flow:

- `webhook.received`: webhook ingress per channel.
- `webhook.processed`: webhook handled + duration.
- `webhook.error`: webhook handler errors.
- `message.queued`: message enqueued for processing.
- `message.processed`: outcome + duration + optional error.

Queue + session:

- `queue.lane.enqueue`: command queue lane enqueue + depth.
- `queue.lane.dequeue`: command queue lane dequeue + wait time.
- `session.state`: session state transition + reason.
- `session.stuck`: session stuck warning + age.
- `run.attempt`: run retry/attempt metadata.
- `diagnostic.heartbeat`: aggregate counters (webhooks/queue/session).

### Enable diagnostics (no exporter)

Use this if you want diagnostics events available to plugins or custom sinks:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Diagnostics flags (targeted logs)

Use flags to turn on extra, targeted debug logs without raising `logging.level`.
Flags are case-insensitive and support wildcards (e.g. `telegram.*` or `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Env override (one-off):

```
SECURECLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Notes:

- Flag logs go to the standard log file (same as `logging.file`).
- Output is still redacted according to `logging.redactSensitive`.
- Full guide: [/diagnostics/flags](/diagnostics/flags).

### Export to OpenTelemetry

Diagnostics can be exported via the `diagnostics-otel` plugin (OTLP/HTTP). This
works with any OpenTelemetry collector/backend that accepts OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "secureclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

Notes:

- You can also enable the plugin with `secureclaw plugins enable diagnostics-otel`.
- `protocol` currently supports `http/protobuf` only. `grpc` is ignored.
- Metrics include token usage, cost, context size, run duration, and message-flow
  counters/histograms (webhooks, queueing, session state, queue depth/wait).
- Traces/metrics can be toggled with `traces` / `metrics` (default: on). Traces
  include model usage spans plus webhook/message processing spans when enabled.
- Set `headers` when your collector requires auth.
- Environment variables supported: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Exported metrics (names + types)

Model usage:

- `secureclaw.tokens` (counter, attrs: `secureclaw.token`, `secureclaw.channel`,
  `secureclaw.provider`, `secureclaw.model`)
- `secureclaw.cost.usd` (counter, attrs: `secureclaw.channel`, `secureclaw.provider`,
  `secureclaw.model`)
- `secureclaw.run.duration_ms` (histogram, attrs: `secureclaw.channel`,
  `secureclaw.provider`, `secureclaw.model`)
- `secureclaw.context.tokens` (histogram, attrs: `secureclaw.context`,
  `secureclaw.channel`, `secureclaw.provider`, `secureclaw.model`)

Message flow:

- `secureclaw.webhook.received` (counter, attrs: `secureclaw.channel`,
  `secureclaw.webhook`)
- `secureclaw.webhook.error` (counter, attrs: `secureclaw.channel`,
  `secureclaw.webhook`)
- `secureclaw.webhook.duration_ms` (histogram, attrs: `secureclaw.channel`,
  `secureclaw.webhook`)
- `secureclaw.message.queued` (counter, attrs: `secureclaw.channel`,
  `secureclaw.source`)
- `secureclaw.message.processed` (counter, attrs: `secureclaw.channel`,
  `secureclaw.outcome`)
- `secureclaw.message.duration_ms` (histogram, attrs: `secureclaw.channel`,
  `secureclaw.outcome`)

Queues + sessions:

- `secureclaw.queue.lane.enqueue` (counter, attrs: `secureclaw.lane`)
- `secureclaw.queue.lane.dequeue` (counter, attrs: `secureclaw.lane`)
- `secureclaw.queue.depth` (histogram, attrs: `secureclaw.lane` or
  `secureclaw.channel=heartbeat`)
- `secureclaw.queue.wait_ms` (histogram, attrs: `secureclaw.lane`)
- `secureclaw.session.state` (counter, attrs: `secureclaw.state`, `secureclaw.reason`)
- `secureclaw.session.stuck` (counter, attrs: `secureclaw.state`)
- `secureclaw.session.stuck_age_ms` (histogram, attrs: `secureclaw.state`)
- `secureclaw.run.attempt` (counter, attrs: `secureclaw.attempt`)

### Exported spans (names + key attributes)

- `secureclaw.model.usage`
  - `secureclaw.channel`, `secureclaw.provider`, `secureclaw.model`
  - `secureclaw.sessionKey`, `secureclaw.sessionId`
  - `secureclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `secureclaw.webhook.processed`
  - `secureclaw.channel`, `secureclaw.webhook`, `secureclaw.chatId`
- `secureclaw.webhook.error`
  - `secureclaw.channel`, `secureclaw.webhook`, `secureclaw.chatId`,
    `secureclaw.error`
- `secureclaw.message.processed`
  - `secureclaw.channel`, `secureclaw.outcome`, `secureclaw.chatId`,
    `secureclaw.messageId`, `secureclaw.sessionKey`, `secureclaw.sessionId`,
    `secureclaw.reason`
- `secureclaw.session.stuck`
  - `secureclaw.state`, `secureclaw.ageMs`, `secureclaw.queueDepth`,
    `secureclaw.sessionKey`, `secureclaw.sessionId`

### Sampling + flushing

- Trace sampling: `diagnostics.otel.sampleRate` (0.0–1.0, root spans only).
- Metric export interval: `diagnostics.otel.flushIntervalMs` (min 1000ms).

### Protocol notes

- OTLP/HTTP endpoints can be set via `diagnostics.otel.endpoint` or
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- If the endpoint already contains `/v1/traces` or `/v1/metrics`, it is used as-is.
- If the endpoint already contains `/v1/logs`, it is used as-is for logs.
- `diagnostics.otel.logs` enables OTLP log export for the main logger output.

### Log export behavior

- OTLP logs use the same structured records written to `logging.file`.
- Respect `logging.level` (file log level). Console redaction does **not** apply
  to OTLP logs.
- High-volume installs should prefer OTLP collector sampling/filtering.

## Correlation IDs for Request Tracing

SecureClaw automatically tracks correlation IDs throughout the request lifecycle to enable distributed tracing and debugging.

### What are Correlation IDs?

Correlation IDs are unique identifiers that are attached to every request, allowing you to trace a single request through multiple services, logs, and systems. They help answer questions like:

- Which log entries relate to a specific user request?
- What happened during a failed API call?
- How did a request flow through the system?

### How Correlation IDs Work

1. **HTTP Requests**: Correlation IDs are extracted from incoming request headers (`X-Correlation-ID`, `X-Request-ID`, or `X-Trace-ID`). If no correlation ID is provided, one is automatically generated.

2. **HTTP Responses**: All HTTP responses include an `X-Correlation-ID` header for client-side tracing.

3. **WebSocket Messages**: Correlation IDs are included in all WebSocket messages as a `correlationId` field. Clients can provide their own correlation ID in requests, or one will be generated automatically.

4. **Log Entries**: All log entries (both file logs and console output) automatically include the `correlationId` field when available.

5. **OpenTelemetry Integration**: When OpenTelemetry tracing is enabled, correlation IDs are extracted from trace context when available.

### Using Correlation IDs

#### HTTP Clients

Send a correlation ID in your requests:

```bash
curl -H "X-Correlation-ID: my-trace-123" https://gateway/api/endpoint
```

The response will include the same correlation ID:

```
X-Correlation-ID: my-trace-123
```

#### WebSocket Clients

Include `correlationId` in your request frames:

```json
{
  "type": "req",
  "id": "request-1",
  "method": "agent.chat",
  "params": { "message": "Hello" },
  "correlationId": "my-trace-123"
}
```

Responses will include the correlation ID:

```json
{
  "type": "res",
  "id": "request-1",
  "ok": true,
  "payload": { ... },
  "correlationId": "my-trace-123"
}
```

#### Searching Logs by Correlation ID

With JSON-formatted logs, filter by correlation ID:

```bash
# File logs
grep '"correlationId":"my-trace-123"' /tmp/secureclaw/secureclaw-*.log

# Live tail with jq
secureclaw logs --follow --json | jq 'select(.correlationId == "my-trace-123")'
```

### Benefits

- **Request Tracing**: Follow a single request through multiple components
- **Error Debugging**: Find all log entries related to a failed request
- **Performance Analysis**: Track request timing across services
- **Distributed Systems**: Correlate logs across multiple services
- **Support**: Share correlation IDs when reporting issues

## Troubleshooting tips

- **Gateway not reachable?** Run `secureclaw doctor` first.
- **Logs empty?** Check that the Gateway is running and writing to the file path
  in `logging.file`.
- **Need more detail?** Set `logging.level` to `debug` or `trace` and retry.
- **Tracing a specific request?** Use correlation IDs to filter logs and responses.
