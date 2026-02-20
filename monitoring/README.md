# SecureClaw Observability & Monitoring

This directory contains monitoring and observability configurations for SecureClaw production deployments.

## Contents

- **grafana-dashboard.json** - Pre-built Grafana dashboard for visualizing gateway metrics
- **prometheus-alerts.yaml** - Prometheus alert rules based on production best practices

## Quick Start

### 1. Import Grafana Dashboard

```bash
# Via Grafana UI
1. Navigate to Dashboards → Import
2. Upload monitoring/grafana-dashboard.json
3. Select Prometheus data source
4. Click Import

# Via API
curl -X POST http://localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d @monitoring/grafana-dashboard.json
```

### 2. Configure Prometheus Alerts

```bash
# Add to prometheus.yml
rule_files:
  - "prometheus-alerts.yaml"

# Reload Prometheus config
curl -X POST http://localhost:9090/-/reload

# Verify alerts are loaded
curl http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[].name'
```

### 3. Configure AlertManager

```yaml
# alertmanager.yml
route:
  group_by: ["alertname", "severity"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: "default"
  routes:
    - match:
        severity: critical
      receiver: "pagerduty-critical"
      continue: true
    - match:
        severity: high
      receiver: "slack-urgent"
    - match:
        severity: medium
      receiver: "slack-alerts"
    - match:
        severity: low
      receiver: "slack-info"

receivers:
  - name: "default"
    slack_configs:
      - api_url: "YOUR_SLACK_WEBHOOK"
        channel: "#secureclaw-alerts"

  - name: "pagerduty-critical"
    pagerduty_configs:
      - service_key: "YOUR_PAGERDUTY_KEY"

  - name: "slack-urgent"
    slack_configs:
      - api_url: "YOUR_SLACK_WEBHOOK"
        channel: "#secureclaw-urgent"

  - name: "slack-alerts"
    slack_configs:
      - api_url: "YOUR_SLACK_WEBHOOK"
        channel: "#secureclaw-alerts"

  - name: "slack-info"
    slack_configs:
      - api_url: "YOUR_SLACK_WEBHOOK"
        channel: "#secureclaw-info"
```

## Dashboard Panels

The Grafana dashboard includes the following panels:

### System Health

- **Gateway Uptime** - Process uptime since last restart
- **Request Rate** - Requests and errors per second
- **Error Rate** - Percentage of failed requests
- **Response Time Percentiles** - p50, p95, p99 latencies

### Channel Health

- **Channel Connection Status** - Real-time status of WhatsApp, Telegram, Discord
- **Webhook Error Rate** - Per-channel webhook failure rates

### Resource Utilization

- **Memory & CPU Usage** - System resource consumption
- **Disk I/O** - Disk read/write rates
- **Network Bandwidth** - Network throughput

### Application Metrics

- **Agent Execution Metrics** - Agent run times and performance
- **Security Coach Alert Frequency** - Security alerts by severity
- **Cache Hit Rate** - Cache effectiveness
- **Circuit Breaker States** - Circuit breaker health
- **Rate Limit Rejections** - Per-endpoint rate limiting

## Alert Severity Levels

| Severity     | Response Time     | Examples                           | Notification         |
| ------------ | ----------------- | ---------------------------------- | -------------------- |
| **CRITICAL** | < 5 min           | Gateway down, all channels down    | PagerDuty + Slack    |
| **HIGH**     | < 15 min          | High error rate (>5%), memory >90% | Slack urgent channel |
| **MEDIUM**   | < 1 hour          | Slow responses, queue buildup      | Slack alerts channel |
| **LOW**      | Next business day | Low throughput, cache hit rate     | Slack info channel   |

## Available Metrics

### Gateway Metrics

- `secureclaw_requests_total` - Total HTTP/WebSocket requests
- `secureclaw_errors_total` - Total errors
- `secureclaw_message_duration_ms` - Message processing duration histogram
- `secureclaw_queue_depth` - Current queue depth

### Channel Metrics

- `secureclaw_channel_linked` - Channel connection status (0/1)
- `secureclaw_channel_probe_success` - Health probe status
- `secureclaw_channel_auth_age_seconds` - Authentication age
- `secureclaw_webhook_error_total` - Webhook failures
- `secureclaw_webhook_received_total` - Webhook receipts

### Agent Metrics

- `secureclaw_run_duration_ms` - Agent run duration histogram
- `secureclaw_tokens_total` - Total tokens consumed
- `secureclaw_cost_usd_total` - Estimated cost in USD
- `secureclaw_model_errors_total` - Model API errors
- `secureclaw_model_requests_total` - Model API requests

### Session Metrics

- `secureclaw_sessions_total` - Total active sessions
- `secureclaw_session_stuck_total` - Stuck sessions
- `secureclaw_session_stuck_age_ms` - Age of stuck sessions

### Security Coach Metrics

- `secureclaw_security_coach_alerts_total` - Security alerts by severity
- `secureclaw_security_coach_blocked_total` - Blocked commands
- `secureclaw_siem_batches_sent_total` - SIEM batches sent
- `secureclaw_siem_batches_failed_total` - SIEM batch failures

### Circuit Breaker Metrics

- `secureclaw_circuit_breaker_state` - Circuit breaker state (closed/open/half-open)
- `secureclaw_circuit_breaker_transitions_total` - State transitions
- `secureclaw_circuit_breaker_failures_total` - Circuit failures
- `secureclaw_circuit_breaker_recovery_time_ms` - Recovery time histogram

### Rate Limit Metrics

- `secureclaw_rate_limit_rejected_total` - Rate limit rejections by endpoint
- `secureclaw_rate_limit_accepted_total` - Accepted requests
- `secureclaw_rate_limit_rejection_reason` - Rejection reasons

### Resource Metrics

- `process_resident_memory_bytes` - Process memory usage
- `process_cpu_seconds_total` - CPU time consumed
- `process_uptime_seconds` - Process uptime
- `secureclaw_disk_write_bytes_total` - Disk writes
- `secureclaw_network_bytes_total` - Network traffic

### Cache & Database Metrics

- `secureclaw_cache_hits_total` - Cache hits
- `secureclaw_cache_misses_total` - Cache misses
- `secureclaw_database_queries_total` - Database queries
- `secureclaw_database_transactions_total` - Database transactions

## Health Check Endpoints

### Liveness Probe

```bash
curl http://localhost:18789/health/live
```

Returns 200 if the process is alive and responsive. Use for Kubernetes liveness probes.

### Readiness Probe

```bash
curl http://localhost:18789/health/ready
```

Returns:

- **200 OK** - Service ready, all dependencies healthy
- **206 Partial Content** - Service degraded but functional
- **503 Service Unavailable** - Critical dependencies unavailable

Query parameters:

- `probe=true` - Perform active channel probes (slower, more thorough)
- `timeout=5000` - Timeout in milliseconds (default: 5000)

Example:

```bash
curl "http://localhost:18789/health/ready?probe=true&timeout=10000"
```

### Health Check Contract

The `/health/ready` endpoint returns a structured response:

```json
{
  "status": "ready",
  "ready": true,
  "timestamp": "2026-02-14T12:00:00.000Z",
  "healthCheckDurationMs": 234,
  "dependencies": {
    "database": { "status": "ok" },
    "cache": { "status": "ok", "message": "hit rate: 85.3%" },
    "channels": { "status": "ok", "message": "3/3 linked" },
    "responseTimes": { "status": "ok", "message": "234ms (target: <5000ms)" }
  },
  "channels": 3,
  "channelsLinked": 3,
  "agents": 2,
  "sessions": 15,
  "metrics": {
    "diskWritesPerMin": 12.5,
    "networkMbps": 2.3,
    "cacheHitRate": 85.3,
    "dbQueriesPerSec": 45.2
  },
  "sla": {
    "targetMs": 5000,
    "actualMs": 234,
    "met": true
  }
}
```

## Kubernetes Integration

### Deployment with Health Checks

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secureclaw-gateway
spec:
  replicas: 2
  selector:
    matchLabels:
      app: secureclaw
  template:
    metadata:
      labels:
        app: secureclaw
    spec:
      containers:
        - name: gateway
          image: secureclaw/gateway:latest
          ports:
            - containerPort: 18789
              name: http
          livenessProbe:
            httpGet:
              path: /health/live
              port: 18789
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 18789
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 5
            failureThreshold: 2
```

### ServiceMonitor for Prometheus Operator

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: secureclaw-gateway
  labels:
    app: secureclaw
spec:
  selector:
    matchLabels:
      app: secureclaw
  endpoints:
    - port: http
      interval: 30s
      path: /metrics
```

## Docker Compose Example

```yaml
version: "3.8"

services:
  secureclaw:
    image: secureclaw/gateway:latest
    ports:
      - "18789:18789"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:18789/health/live"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 40s

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus-alerts.yaml:/etc/prometheus/alerts.yaml
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./monitoring/grafana-dashboard.json:/etc/grafana/provisioning/dashboards/secureclaw.json
```

## Testing Alerts

### Simulate Gateway Down

```bash
docker stop secureclaw-gateway
# Wait 90s for alert to fire
# Check AlertManager: http://localhost:9093
docker start secureclaw-gateway
```

### Simulate High Error Rate

```bash
# Generate errors by sending invalid requests
for i in {1..100}; do
  curl -X POST http://localhost:18789/api/invalid-endpoint &
done
```

### Simulate High Memory Usage

```bash
# Requires stress tool
stress-ng --vm 1 --vm-bytes 90% --timeout 60s
```

### Check Prometheus Metrics

```bash
curl http://localhost:9090/api/v1/query?query=rate(secureclaw_errors_total[1m])
```

## Customization

### Adjusting Alert Thresholds

Edit `prometheus-alerts.yaml` and adjust the `expr` values:

```yaml
# Example: Change error rate threshold from 5% to 10%
- alert: SecureClawHighErrorRate
  expr: |
    rate(secureclaw_errors_total[5m]) /
    rate(secureclaw_requests_total[5m]) > 0.10  # Changed from 0.05
```

### Adding Custom Panels

1. Edit the dashboard in Grafana UI
2. Export the updated JSON
3. Replace `monitoring/grafana-dashboard.json`
4. Commit to version control

### Environment-Specific Configurations

- **Low Traffic** (< 100 messages/day): Increase thresholds, extend time windows
- **High Traffic** (> 10,000 messages/day): Tighten thresholds, add per-channel alerts
- **Raspberry Pi**: Lower memory/CPU thresholds, add swap monitoring
- **Enterprise**: Implement all CRITICAL and HIGH alerts, add redundancy checks

## Related Documentation

- [Alerting Thresholds](../docs/gateway/alerting-thresholds.md) - Detailed threshold recommendations
- [Health Endpoints](../docs/gateway/health-endpoints.md) - HTTP health endpoint documentation
- [Monitoring & Observability Report](../MONITORING-OBSERVABILITY-REPORT.md) - Full observability guide
- [Production Checklist](../docs/operations/production-checklist.md) - Production deployment guide

## Support

For issues or questions:

- GitHub Issues: https://github.com/secureclaw/secureclaw/issues
- Documentation: https://docs.secureclaw.ai
- Community: https://discord.gg/secureclaw
