# Monitoring & Observability Report

**Agent 9: Production Observability Audit**
**Date:** 2026-02-14
**Repository:** SecureClaw (formerly OpenClaw)

---

## Executive Summary

SecureClaw has **comprehensive monitoring infrastructure** with excellent health checks, structured logging, metrics collection, and OpenTelemetry integration. The observability stack is production-ready with only minor gaps in correlation IDs and some alerting documentation.

### Overall Assessment: **8.5/10**

**Strengths:**

- Full OpenTelemetry (OTEL) integration with traces, metrics, and logs
- Robust health check system with per-channel probes
- Structured logging with configurable levels and subsystems
- Real-time I/O metrics (disk, network, database, cache)
- Security Coach with integrated SIEM forwarding (Splunk, Datadog, Sentinel)
- Performance metrics and response time tracking

**Areas for Improvement:**

- Add correlation IDs / trace IDs for distributed tracing
- Expand alerting documentation and thresholds
- Add circuit breaker monitoring
- Create debugging guide for production issues

---

## 1. Health Checks ✅ Excellent

### Implementation Status: **9/10**

#### ✅ What Exists

**Health Check Endpoints:**

- Primary health check: `/health` via WebSocket (Gateway RPC)
- CLI health command: `secureclaw health --json`
- Status command: `secureclaw status` (local), `secureclaw status --deep` (with probes)
- Per-channel health probes with account-level granularity

**File Locations:**

- `/Users/mbhatt/openclaw/src/gateway/server-methods/health.ts` - Health RPC handler
- `/Users/mbhatt/openclaw/src/gateway/server/health-state.ts` - Health state management
- `/Users/mbhatt/openclaw/src/commands/health.ts` - Health check implementation (630 lines)

**Health Check Features:**

```typescript
// Health snapshot includes:
- ok: boolean (always true if gateway responds)
- ts: number (timestamp)
- durationMs: number (health check duration)
- channels: Record<string, ChannelHealthSummary> (per-channel status)
- agents: AgentHealthSummary[] (agent heartbeats, sessions)
- sessions: { path, count, recent } (session store stats)
- ioMetrics: { disk, network, database, cache, logging, sessionStore }
```

**Per-Channel Probes:**

- Validates account configuration
- Tests authentication status
- Measures probe latency (ms)
- Reports auth age and linked status
- Returns bot usernames for verification

**Readiness vs Liveness:**

- Health check serves as readiness probe (channels + gateway operational)
- Liveness can use simple TCP connection to port 18789
- Uptime tracked: `uptimeMs` in gateway snapshot

**Dependency Health:**

- Channel-specific health (WhatsApp, Telegram, Discord, Signal, etc.)
- Session store health (path, count, recent activity)
- Agent heartbeat status (every N seconds)
- Memory monitoring (if Pi health monitoring enabled)

**Timeout Handling:**

```typescript
const DEFAULT_TIMEOUT_MS = 10_000; // 10 seconds
const cappedTimeout = Math.max(1000, timeoutMs ?? DEFAULT_TIMEOUT_MS);
```

#### 🟡 Minor Gaps

1. **No explicit `/ready` or `/live` HTTP endpoints** (WebSocket-only health checks)
   - Recommendation: Add HTTP health endpoints for Kubernetes/Docker compatibility

2. **Health cache refresh interval** is configurable but not well-documented

   ```typescript
   const HEALTH_REFRESH_INTERVAL_MS = 60_000; // 1 minute
   ```

3. **No deep health check for database connections** (if using external DB)

---

## 2. Logging Infrastructure ✅ Excellent

### Implementation Status: **9/10**

#### ✅ What Exists

**Structured Logging:**

- Library: `tslog` with custom transports
- Format: JSON with timestamps and structured fields
- File location: `/Users/mbhatt/openclaw/src/logging/logger.ts`

**Log Levels:**

```typescript
type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal" | "silent";
```

**Configurable Levels:**

- File logging level: `config.logging.level`
- Console logging level: `config.logging.consoleLevel`
- Per-subsystem filtering: `setConsoleSubsystemFilter(filter)`

**Request/Response Logging:**

- Gateway WebSocket messages logged via `ws-log.ts`
- HTTP endpoint logging (webhooks, chat completions)
- Raw stream logging (optional): `SECURECLAW_RAW_STREAM=true`

**Subsystem Logging:**

```typescript
// Subsystem loggers with prefix:
createSubsystemLogger("gateway");
createSubsystemLogger("health");
createSubsystemLogger("channels");
createSubsystemLogger("security-coach");
```

**Buffered File Logger:**

- Location: `/Users/mbhatt/openclaw/src/infra/buffered-logger.ts`
- Buffer size: 100 lines
- Flush interval: 5000ms (5 seconds)
- Stats available: `getBufferedLoggerStats()`

**Log Rotation:**

```typescript
// Daily rolling logs:
// Format: secureclaw-YYYY-MM-DD.log
// Max age: 24 hours (auto-pruned)
function defaultRollingPathForToday(): string {
  const today = formatLocalDate(new Date());
  return path.join(DEFAULT_LOG_DIR, `${LOG_PREFIX}-${today}${LOG_SUFFIX}`);
}
```

**OpenTelemetry Log Export:**

- OTLP log exporter integration
- Exports to centralized logging backends
- Configurable via `config.diagnostics.otel.logs`

#### 🟡 Minor Gaps

1. **No correlation IDs / trace IDs in logs**
   - Recommendation: Add `traceId` and `spanId` to all log entries when OTEL tracing is enabled

2. **No request ID for HTTP endpoints**
   - Recommendation: Generate `X-Request-ID` header and include in logs

3. **Console logging has no structured JSON mode**
   - Currently uses colored console output
   - Recommendation: Add JSON console mode for container environments

---

## 3. Metrics & Monitoring ✅ Excellent

### Implementation Status: **9/10**

#### ✅ What Exists

**OpenTelemetry Metrics:**

- File: `/Users/mbhatt/openclaw/extensions/diagnostics-otel/src/service.ts` (634 lines)
- Meter: `metrics.getMeter("secureclaw")`
- Export: OTLP HTTP to Prometheus, Grafana, Datadog, etc.

**Built-in Metrics:**

1. **Token Usage:**

   ```typescript
   tokensCounter.add(usage.input, { provider, model, token: "input" });
   tokensCounter.add(usage.output, { provider, model, token: "output" });
   tokensCounter.add(usage.cacheRead, { provider, model, token: "cache_read" });
   ```

2. **Cost Tracking:**

   ```typescript
   costCounter.add(evt.costUsd, { provider, model });
   ```

3. **Performance:**

   ```typescript
   durationHistogram.record(evt.durationMs, { provider, model });
   contextHistogram.record(evt.context.limit, { context: "limit" });
   ```

4. **Webhook Metrics:**

   ```typescript
   webhookReceivedCounter.add(1, { channel });
   webhookErrorCounter.add(1, { channel });
   webhookDurationHistogram.record(durationMs, { channel });
   ```

5. **Message Queue Metrics:**

   ```typescript
   messageQueuedCounter.add(1, { channel, source });
   messageProcessedCounter.add(1, { channel, outcome });
   messageDurationHistogram.record(durationMs, { channel, outcome });
   queueDepthHistogram.record(queueDepth, { lane });
   queueWaitHistogram.record(waitMs, { lane });
   ```

6. **Session Metrics:**
   ```typescript
   sessionStateCounter.add(1, { state, reason });
   sessionStuckCounter.add(1, { state });
   sessionStuckAgeHistogram.record(ageMs, { state });
   ```

**I/O Metrics:**

- File: `/Users/mbhatt/openclaw/src/infra/io-metrics.ts` (390 lines)
- Real-time tracking of:
  - Disk writes/reads (count + MB)
  - Network sent/received (count + MB)
  - Database queries/transactions
  - Cache hits/misses (hit rate %)

**Security Coach Metrics:**

- File: `/Users/mbhatt/openclaw/src/security-coach/metrics.ts` (390 lines)
- Tracks:
  - Total alerts, blocks, allows, denies
  - Alerts/blocks per hour
  - Avg/median decision time
  - Per-category and per-severity breakdowns
  - Top threat patterns

**Custom Business Metrics:**

- Agent run attempts
- Context overflow events
- Model failover events
- Heartbeat visibility

#### 🟡 Minor Gaps

1. **No built-in circuit breaker metrics** (though retry policy exists)
   - Recommendation: Add circuit breaker open/closed state metrics

2. **Rate limiting not logged as metrics**
   - Rate limiting exists but no counter for throttled requests
   - Recommendation: Add `rate_limit_exceeded_total` counter

3. **No SLI/SLO tracking**
   - Recommendation: Define and track Service Level Indicators (e.g., p95 latency, availability %)

---

## 4. Alerting Setup 🟡 Good

### Implementation Status: **7/10**

#### ✅ What Exists

**Security Coach SIEM Integration:**

- File: `/Users/mbhatt/openclaw/src/security-coach/siem/dispatcher.ts` (558 lines)
- Destinations: Splunk, Datadog, Microsoft Sentinel
- Event batching with configurable thresholds
- Auto-retry on failure (1 retry with 5s delay)

**SIEM Event Types:**

```typescript
- "security.coach.alert" (critical/high/medium/low)
- "security.coach.decision" (info)
- "security.coach.hygiene" (scan findings)
```

**Event Routing:**

- Severity filtering per destination
- Event type filtering
- Batch size: default 10 events
- Flush interval: default 5000ms

**SIEM Dispatcher Stats:**

```typescript
{
  eventsDispatched: number;
  eventsDropped: number;
  batchesSent: number;
  batchesFailed: number;
  lastDispatchAtMs: number;
  lastErrorAtMs: number;
  perDestination: {
    (sent, failed, queued);
  }
}
```

**Diagnostic Heartbeat:**

- File: `/Users/mbhatt/openclaw/src/logging/diagnostic.ts`
- Periodic health snapshots sent to diagnostic event bus
- Queue depth tracking

#### 🟡 Missing

1. **No general alerting thresholds documented**
   - No recommendations for when to alert on:
     - High error rate
     - Queue depth exceeding threshold
     - Session stuck duration
     - Memory usage

2. **No built-in alerting for critical errors**
   - SIEM integration only covers Security Coach events
   - Recommendation: Add general alert events for:
     - Gateway crashes/restarts
     - Channel disconnections
     - Agent heartbeat failures
     - Disk/memory exhaustion

3. **No alert throttling for non-Security-Coach events**
   - Security Coach has AlertThrottle class
   - General errors could flood SIEM

4. **No PagerDuty / Opsgenie integration**
   - Only SIEM integrations exist
   - Recommendation: Add webhook-based alerting for incident management

---

## 5. Debugging Support ✅ Excellent

### Implementation Status: **9/10**

#### ✅ What Exists

**Request Tracing:**

- OpenTelemetry spans for:
  - Model API calls
  - Webhook processing
  - Message processing
  - Session state transitions
  - Stuck sessions

**Error Stack Traces:**

- All errors logged with full stack traces
- Error handling guide: `/Users/mbhatt/openclaw/docs/error-handling.md`
- Formatted error output: `formatError()` and `formatErrorMessage()`

**Debug Mode:**

```bash
# Environment variables:
SECURECLAW_DEBUG_HEALTH=1        # Health check debug logging
SECURECLAW_RAW_STREAM=true       # Raw stream logging
SECURECLAW_RAW_STREAM_PATH=...   # Custom raw stream path
NODE_ENV=development             # Development mode
```

**Performance Profiling:**

- Startup metrics: `/Users/mbhatt/openclaw/src/infra/startup-optimizations.ts`
- Memory monitoring: `MemoryMonitor` class
- Pi health monitoring for resource-constrained environments
- Benchmark scripts: `/Users/mbhatt/openclaw/scripts/perf-benchmark.ts`

**Debug Commands:**

```bash
secureclaw status --all        # Full local diagnosis
secureclaw status --deep       # With channel probes
secureclaw health --verbose    # Verbose health check
secureclaw doctor              # Configuration validation
```

**Diagnostic Events:**

- Event bus: `onDiagnosticEvent(callback)`
- Event types:
  - `model.usage`
  - `webhook.received/processed/error`
  - `message.queued/processed`
  - `queue.lane.enqueue/dequeue`
  - `session.state/stuck`
  - `run.attempt`
  - `diagnostic.heartbeat`

**Live Debugging:**

- WebSocket gateway with real-time events
- Control UI with live metrics
- Tail logs: `/tmp/secureclaw/secureclaw-YYYY-MM-DD.log`

#### 🟡 Minor Gaps

1. **No distributed tracing correlation**
   - Spans exist but no cross-service trace propagation
   - Recommendation: Add W3C Trace Context headers for HTTP requests

2. **No interactive debugger integration**
   - Could add remote debugging support for production
   - Recommendation: Add `DEBUG_PORT` env var for remote inspection

3. **No query tool for historical metrics**
   - I/O metrics history limited to 60 snapshots
   - Recommendation: Add metrics export to time-series DB

---

## Critical Gaps & Recommendations

### High Priority

1. **Add Correlation IDs / Trace IDs to Logs**

   ```typescript
   // In logger.ts, add to all log entries:
   {
     traceId: trace.getSpan(context.active())?.spanContext().traceId,
     spanId: trace.getSpan(context.active())?.spanContext().spanId,
     // ... existing fields
   }
   ```

2. **Create HTTP Health Endpoints**

   ```typescript
   // In gateway server:
   app.get("/health/live", (req, res) => {
     res.json({ status: "ok", uptime: process.uptime() });
   });

   app.get("/health/ready", async (req, res) => {
     const health = await getHealthSnapshot({ probe: false });
     res.json(health);
   });
   ```

3. **Document Alerting Thresholds**

   ```markdown
   # Recommended Alert Thresholds

   - Error rate > 5% over 5 minutes → WARN
   - Error rate > 10% over 5 minutes → CRITICAL
   - Queue depth > 100 for > 2 minutes → WARN
   - Session stuck > 5 minutes → WARN
   - Memory usage > 90% → CRITICAL
   - Disk usage > 85% → WARN
   ```

### Medium Priority

4. **Add Circuit Breaker Monitoring**

   ```typescript
   // Track circuit breaker state changes:
   const circuitBreakerStateCounter = meter.createCounter("secureclaw.circuit_breaker.state", {
     description: "Circuit breaker state transitions",
   });
   ```

5. **Add Rate Limit Metrics**

   ```typescript
   const rateLimitCounter = meter.createCounter("secureclaw.rate_limit.exceeded", {
     description: "Rate limit exceeded events",
   });
   ```

6. **Create Production Debugging Guide**

   ```markdown
   # Production Debugging Guide

   1. Check health: `curl http://localhost:18789/health`
   2. View metrics: `curl http://localhost:9090/metrics` (if Prometheus exporter enabled)
   3. Tail logs: `tail -f /tmp/secureclaw/secureclaw-*.log | jq .`
   4. Inspect traces: Open Jaeger/Zipkin UI
   5. Check SIEM: Query Splunk/Datadog for `source:secureclaw-security-coach`
   ```

### Low Priority

7. **Add Metrics Retention Policy**
   - Document how long metrics are kept in memory
   - Add config for history size

8. **Create Grafana Dashboard Template**
   - Pre-built dashboard for common metrics
   - Include SLI/SLO tracking

---

## Configuration Examples

### Enable Full Observability

```yaml
# ~/.secureclaw/config.yaml

diagnostics:
  enabled: true
  otel:
    enabled: true
    endpoint: "http://localhost:4318" # OTLP HTTP endpoint
    serviceName: "secureclaw"
    traces: true
    metrics: true
    logs: true
    sampleRate: 1.0 # 100% sampling (reduce in prod)
    flushIntervalMs: 5000

logging:
  level: "info"
  consoleLevel: "warn"
  file: "/var/log/secureclaw/secureclaw.log"

securityCoach:
  enabled: true
  siem:
    enabled: true
    includeDetails: true
    includeContext: true
    destinations:
      - type: splunk
        enabled: true
        url: "https://splunk.example.com:8088/services/collector"
        token: "${SPLUNK_HEC_TOKEN}"
        severityFilter: ["critical", "high"]
        batchSize: 10
        flushIntervalMs: 5000
```

### Kubernetes Readiness/Liveness Probes

```yaml
# deployment.yaml

livenessProbe:
  tcpSocket:
    port: 18789
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  exec:
    command:
      - /usr/local/bin/secureclaw
      - health
      - --json
      - --timeout
      - "5000"
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
```

### Prometheus Scrape Config

```yaml
# prometheus.yml

scrape_configs:
  - job_name: "secureclaw"
    scrape_interval: 15s
    static_configs:
      - targets: ["localhost:9090"] # If OTLP -> Prometheus bridge enabled
    metric_relabel_configs:
      - source_labels: [__name__]
        regex: "secureclaw.*"
        action: keep
```

---

## Testing Observability

### Health Check Test

```bash
# Test health endpoint
secureclaw health --json | jq .

# Verify output contains:
# - .ok == true
# - .channels (with per-channel status)
# - .agents (with heartbeat info)
# - .ioMetrics (with disk/network stats)
```

### Log Verification

```bash
# Tail logs with JSON parsing
tail -f /tmp/secureclaw/secureclaw-*.log | jq 'select(.logLevelName == "ERROR")'

# Check for structured fields
tail -f /tmp/secureclaw/secureclaw-*.log | jq 'select(.subsystem == "gateway")'
```

### Metrics Verification

```bash
# If OTLP exporter enabled, check metrics endpoint
curl http://localhost:4318/v1/metrics

# Or query Prometheus
curl 'http://localhost:9090/api/v1/query?query=secureclaw_tokens_total'
```

### Trace Verification

```bash
# Check Jaeger UI for traces
open http://localhost:16686/search?service=secureclaw

# Look for spans:
# - secureclaw.model.usage
# - secureclaw.webhook.processed
# - secureclaw.message.processed
```

---

## Summary

SecureClaw has **production-grade observability infrastructure** with comprehensive health checks, structured logging, OpenTelemetry integration, and real-time metrics. The main gaps are:

1. Correlation IDs for distributed tracing
2. HTTP health endpoints for Kubernetes
3. Documented alerting thresholds

**Recommended Next Steps:**

1. ✅ Implement correlation IDs in logging (1-2 hours)
2. ✅ Add HTTP `/health/live` and `/health/ready` endpoints (1 hour)
3. ✅ Create alerting threshold documentation (30 minutes)
4. ✅ Add circuit breaker and rate limit metrics (2 hours)
5. ✅ Create production debugging guide (1 hour)

**Total Estimated Effort:** 6-8 hours

**Current Observability Maturity Level:** 4/5 (Advanced)
**Target Maturity Level:** 5/5 (Optimized)

---

## File References

### Core Monitoring Files

- `/Users/mbhatt/openclaw/src/gateway/server-methods/health.ts` - Health RPC handler
- `/Users/mbhatt/openclaw/src/gateway/server/health-state.ts` - Health state management
- `/Users/mbhatt/openclaw/src/commands/health.ts` - Health check implementation
- `/Users/mbhatt/openclaw/src/logging/logger.ts` - Structured logging
- `/Users/mbhatt/openclaw/src/infra/io-metrics.ts` - I/O metrics collection
- `/Users/mbhatt/openclaw/extensions/diagnostics-otel/src/service.ts` - OpenTelemetry integration
- `/Users/mbhatt/openclaw/src/security-coach/metrics.ts` - Security Coach metrics
- `/Users/mbhatt/openclaw/src/security-coach/siem/dispatcher.ts` - SIEM event dispatcher

### Documentation

- `/Users/mbhatt/openclaw/docs/gateway/health.md` - Health check documentation
- `/Users/mbhatt/openclaw/docs/error-handling.md` - Error handling guide
- `/Users/mbhatt/openclaw/docs/io-optimizations.md` - I/O optimization docs

---

**Report Generated:** 2026-02-14
**Agent:** Agent 9: Monitoring & Observability
**Status:** Complete ✅
