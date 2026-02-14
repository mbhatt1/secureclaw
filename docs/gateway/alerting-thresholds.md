# Alerting Thresholds & Recommendations

This document provides recommended alerting thresholds for SecureClaw production deployments. These thresholds are based on production observability best practices and can be adjusted based on your specific environment.

## Alert Severity Levels

| Severity     | Description                            | Response Time       | Example                              |
| ------------ | -------------------------------------- | ------------------- | ------------------------------------ |
| **CRITICAL** | Service down or severely degraded      | Immediate (< 5 min) | Gateway crash, all channels down     |
| **HIGH**     | Significant performance degradation    | Urgent (< 15 min)   | Error rate > 10%, memory > 90%       |
| **MEDIUM**   | Performance issues, potential problems | Soon (< 1 hour)     | Queue depth high, cache hit rate low |
| **LOW**      | Informational, trends to watch         | Next business day   | Disk usage growing, slow queries     |

---

## 1. System Health Alerts

### Process Liveness

```yaml
Alert: gateway_process_down
Severity: CRITICAL
Condition: HTTP GET /health/live returns non-200 for 3 consecutive checks (90s)
Action: Restart gateway, page on-call
Query: up{job="secureclaw"} == 0
```

### Service Readiness

```yaml
Alert: gateway_not_ready
Severity: HIGH
Condition: HTTP GET /health/ready returns 503 for > 2 minutes
Action: Check channel status, investigate degradation
Query: probe_success{job="secureclaw_health"} == 0
```

### Uptime Monitoring

```yaml
Alert: frequent_restarts
Severity: MEDIUM
Condition: Gateway uptime < 5 minutes more than 3 times in 1 hour
Action: Investigate crash causes, check logs
Query: changes(process_uptime_seconds[1h]) > 3
```

---

## 2. Error Rate Alerts

### General Error Rate

```yaml
Alert: high_error_rate
Severity: HIGH
Condition: Error rate > 5% over 5 minutes
Action: Check logs, investigate root cause
Query: |
  rate(secureclaw_errors_total[5m]) /
  rate(secureclaw_requests_total[5m]) > 0.05

Alert: critical_error_rate
Severity: CRITICAL
Condition: Error rate > 10% over 5 minutes
Action: Page on-call, prepare rollback
Query: |
  rate(secureclaw_errors_total[5m]) /
  rate(secureclaw_requests_total[5m]) > 0.10
```

### Channel-Specific Errors

```yaml
Alert: channel_webhook_errors
Severity: MEDIUM
Condition: Webhook error rate > 10% for any channel over 10 minutes
Action: Check channel authentication, investigate webhook issues
Query: |
  rate(secureclaw_webhook_error_total{channel="whatsapp"}[10m]) /
  rate(secureclaw_webhook_received_total{channel="whatsapp"}[10m]) > 0.10
```

---

## 3. Performance Alerts

### Response Time

```yaml
Alert: slow_responses
Severity: MEDIUM
Condition: p95 response time > 5 seconds for 10 minutes
Action: Check resource usage, investigate slow operations
Query: |
  histogram_quantile(0.95,
    rate(secureclaw_message_duration_ms_bucket[10m])
  ) > 5000

Alert: very_slow_responses
Severity: HIGH
Condition: p95 response time > 10 seconds for 5 minutes
Action: Investigate immediately, check for blocking operations
Query: |
  histogram_quantile(0.95,
    rate(secureclaw_message_duration_ms_bucket[5m])
  ) > 10000
```

### Agent Run Duration

```yaml
Alert: slow_agent_runs
Severity: MEDIUM
Condition: p95 agent run duration > 30 seconds for 15 minutes
Action: Check model API performance, investigate context size
Query: |
  histogram_quantile(0.95,
    rate(secureclaw_run_duration_ms_bucket[15m])
  ) > 30000
```

---

## 4. Queue & Throughput Alerts

### Queue Depth

```yaml
Alert: high_queue_depth
Severity: MEDIUM
Condition: Queue depth > 100 for > 2 minutes
Action: Check processing capacity, investigate bottlenecks
Query: |
  secureclaw_queue_depth > 100

Alert: critical_queue_depth
Severity: HIGH
Condition: Queue depth > 500 for > 1 minute
Action: Immediate investigation, consider scaling
Query: |
  secureclaw_queue_depth > 500
```

### Queue Wait Time

```yaml
Alert: high_queue_wait
Severity: MEDIUM
Condition: p95 queue wait time > 60 seconds for 10 minutes
Action: Investigate processing delays, check resource constraints
Query: |
  histogram_quantile(0.95,
    rate(secureclaw_queue_wait_ms_bucket[10m])
  ) > 60000
```

### Message Processing Rate

```yaml
Alert: low_message_throughput
Severity: LOW
Condition: Message processing rate drops by > 50% compared to 1 hour ago
Action: Investigate performance degradation
Query: |
  rate(secureclaw_message_processed_total[5m]) <
  rate(secureclaw_message_processed_total[1h] offset 1h) * 0.5
```

---

## 5. Resource Utilization Alerts

### Memory Usage

```yaml
Alert: high_memory_usage
Severity: MEDIUM
Condition: Memory usage > 80% for 10 minutes
Action: Check for memory leaks, consider increasing memory limit
Query: |
  (process_resident_memory_bytes / node_memory_MemTotal_bytes) > 0.80

Alert: critical_memory_usage
Severity: CRITICAL
Condition: Memory usage > 90% for 2 minutes
Action: Immediate action required, prepare to restart
Query: |
  (process_resident_memory_bytes / node_memory_MemTotal_bytes) > 0.90
```

### CPU Usage

```yaml
Alert: high_cpu_usage
Severity: MEDIUM
Condition: CPU usage > 80% for 15 minutes
Action: Check for CPU-intensive operations, consider scaling
Query: |
  rate(process_cpu_seconds_total[5m]) > 0.80

Alert: sustained_high_cpu
Severity: HIGH
Condition: CPU usage > 95% for 5 minutes
Action: Investigate immediately, check for infinite loops
Query: |
  rate(process_cpu_seconds_total[5m]) > 0.95
```

### Disk Usage

```yaml
Alert: disk_usage_high
Severity: MEDIUM
Condition: Disk usage > 85%
Action: Clean up logs, check for excessive session storage
Query: |
  (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.15

Alert: disk_usage_critical
Severity: HIGH
Condition: Disk usage > 95%
Action: Immediate cleanup required, service may fail
Query: |
  (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.05
```

### Disk I/O

```yaml
Alert: high_disk_writes
Severity: MEDIUM
Condition: Disk writes > 100 MB/min for 30 minutes
Action: Check buffered logger, investigate excessive writes
Query: |
  rate(secureclaw_disk_write_bytes_total[30m]) > 104857600
```

---

## 6. Session & State Alerts

### Stuck Sessions

```yaml
Alert: session_stuck
Severity: MEDIUM
Condition: Any session stuck in processing state for > 5 minutes
Action: Check session key, investigate blocking operations
Query: |
  secureclaw_session_stuck_age_ms > 300000

Alert: multiple_stuck_sessions
Severity: HIGH
Condition: > 5 sessions stuck simultaneously
Action: Investigate system-wide issue, check resource constraints
Query: |
  sum(secureclaw_session_stuck_total) > 5
```

### Session Store Size

```yaml
Alert: session_store_growing
Severity: LOW
Condition: Session count growing > 20% per hour
Action: Check session cleanup, investigate retention policy
Query: |
  rate(secureclaw_sessions_total[1h]) > 0.20
```

---

## 7. Model & API Alerts

### Model API Errors

```yaml
Alert: model_api_errors
Severity: HIGH
Condition: Model API error rate > 10% over 5 minutes
Action: Check API status, verify credentials, investigate quota
Query: |
  rate(secureclaw_model_errors_total[5m]) /
  rate(secureclaw_model_requests_total[5m]) > 0.10
```

### Token Usage Spike

```yaml
Alert: token_usage_spike
Severity: LOW
Condition: Token usage increased > 200% compared to 1 hour ago
Action: Investigate usage patterns, check for abuse
Query: |
  rate(secureclaw_tokens_total[5m]) >
  rate(secureclaw_tokens_total[1h] offset 1h) * 2.0
```

### Cost Spike

```yaml
Alert: cost_spike
Severity: MEDIUM
Condition: Estimated cost > 2x daily average in last hour
Action: Investigate usage, check for expensive models/operations
Query: |
  rate(secureclaw_cost_usd_total[1h]) >
  avg_over_time(secureclaw_cost_usd_total[24h]) * 2.0
```

---

## 8. Channel Health Alerts

### Channel Disconnection

```yaml
Alert: channel_disconnected
Severity: HIGH
Condition: Channel not linked for > 5 minutes
Action: Check authentication, relink if needed
Query: |
  secureclaw_channel_linked{channel="whatsapp"} == 0
```

### Channel Auth Expiring

```yaml
Alert: channel_auth_expiring
Severity: MEDIUM
Condition: Channel auth age > 7 days (varies by channel)
Action: Plan re-authentication, monitor for expiration
Query: |
  secureclaw_channel_auth_age_seconds > 604800
```

### Channel Probe Failures

```yaml
Alert: channel_probe_failing
Severity: MEDIUM
Condition: Channel health probe failing for > 3 consecutive checks
Action: Investigate channel connectivity, check credentials
Query: |
  secureclaw_channel_probe_success{channel="telegram"} == 0
```

---

## 9. Security Coach Alerts

### High Security Alerts

```yaml
Alert: security_coach_critical_alerts
Severity: HIGH
Condition: > 5 critical security alerts in 10 minutes
Action: Review security posture, investigate alert patterns
Query: |
  rate(secureclaw_security_coach_alerts_total{severity="critical"}[10m]) > 5

Alert: security_coach_blocked_commands
Severity: MEDIUM
Condition: > 20 blocked commands in 1 hour
Action: Review blocked patterns, check for false positives
Query: |
  rate(secureclaw_security_coach_blocked_total[1h]) > 20
```

### SIEM Delivery Failures

```yaml
Alert: siem_delivery_failures
Severity: MEDIUM
Condition: SIEM batch failures > 10% over 15 minutes
Action: Check SIEM connectivity, verify credentials
Query: |
  rate(secureclaw_siem_batches_failed_total[15m]) /
  rate(secureclaw_siem_batches_sent_total[15m]) > 0.10
```

---

## 10. Cache & Database Alerts

### Low Cache Hit Rate

```yaml
Alert: low_cache_hit_rate
Severity: LOW
Condition: Cache hit rate < 50% for 1 hour
Action: Investigate cache configuration, check cache size
Query: |
  (rate(secureclaw_cache_hits_total[1h]) /
   (rate(secureclaw_cache_hits_total[1h]) + rate(secureclaw_cache_misses_total[1h]))) < 0.50
```

### High Database Query Rate

```yaml
Alert: high_db_query_rate
Severity: MEDIUM
Condition: Database queries/sec > 1000 for 15 minutes
Action: Investigate query patterns, check for N+1 queries
Query: |
  rate(secureclaw_database_queries_total[15m]) > 1000
```

---

## 11. Network & Connectivity Alerts

### High Network Usage

```yaml
Alert: high_network_bandwidth
Severity: MEDIUM
Condition: Network bandwidth > 100 Mbps for 30 minutes
Action: Investigate traffic patterns, check for data leaks
Query: |
  rate(secureclaw_network_bytes_total[30m]) * 8 > 100000000
```

### Connection Pool Exhaustion

```yaml
Alert: connection_pool_exhausted
Severity: HIGH
Condition: Active connections > 90% of pool size
Action: Increase pool size or investigate connection leaks
Query: |
  secureclaw_active_connections / secureclaw_connection_pool_size > 0.90
```

---

## Alert Configuration Examples

### Prometheus AlertManager

```yaml
# alertmanager.yml

groups:
  - name: secureclaw_critical
    interval: 30s
    rules:
      - alert: SecureClawDown
        expr: up{job="secureclaw"} == 0
        for: 90s
        labels:
          severity: critical
        annotations:
          summary: "SecureClaw gateway is down"
          description: "Gateway {{ $labels.instance }} has been down for 90 seconds"

      - alert: HighErrorRate
        expr: |
          rate(secureclaw_errors_total[5m]) /
          rate(secureclaw_requests_total[5m]) > 0.10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} on {{ $labels.instance }}"

  - name: secureclaw_performance
    interval: 1m
    rules:
      - alert: SlowResponses
        expr: |
          histogram_quantile(0.95,
            rate(secureclaw_message_duration_ms_bucket[10m])
          ) > 5000
        for: 10m
        labels:
          severity: medium
        annotations:
          summary: "Slow response times detected"
          description: "P95 latency is {{ $value | humanizeDuration }} on {{ $labels.instance }}"
```

### Datadog Monitors

```yaml
# datadog_monitors.tf (Terraform)

resource "datadog_monitor" "secureclaw_down" {
name    = "SecureClaw Gateway Down"
type    = "service check"
message = "Gateway is down! @pagerduty-secureclaw"

query = <<-EOT
"http.can_connect".over("instance:secureclaw").by("*").last(2).count_by_status()
EOT

monitor_thresholds {
critical = 1
ok       = 1
}

notify_no_data    = true
no_data_timeframe = 5
require_full_window = false
priority = 1
}

resource "datadog_monitor" "high_memory_usage" {
name    = "SecureClaw High Memory Usage"
type    = "metric alert"
message = "Memory usage is high! @slack-secureclaw-alerts"

query = <<-EOT
avg(last_10m):avg:secureclaw.memory.usage{*} > 0.80
EOT

monitor_thresholds {
critical = 0.90
warning  = 0.80
}

notify_no_data = false
priority = 2
}
```

### PagerDuty Integration

```yaml
# Send critical alerts to PagerDuty

alert_webhook:
  - name: pagerduty
    url: https://events.pagerduty.com/v2/enqueue
    headers:
      Content-Type: application/json
      Authorization: Token token=${PAGERDUTY_TOKEN}
    body: |
      {
        "routing_key": "${PAGERDUTY_ROUTING_KEY}",
        "event_action": "trigger",
        "payload": {
          "summary": "{{ .GroupLabels.alertname }}",
          "severity": "{{ .GroupLabels.severity }}",
          "source": "secureclaw",
          "custom_details": {
            "description": "{{ .CommonAnnotations.description }}",
            "instance": "{{ .CommonLabels.instance }}"
          }
        }
      }
```

---

## Testing Alerts

### Test Health Check Alerts

```bash
# Simulate gateway down
docker stop secureclaw-gateway

# Wait for alert to fire (should trigger within 90s)
# Check AlertManager: http://localhost:9093

# Restore service
docker start secureclaw-gateway
```

### Test Error Rate Alerts

```bash
# Generate errors by sending invalid requests
for i in {1..100}; do
  curl -X POST http://localhost:18789/api/invalid-endpoint &
done

# Check metrics
curl http://localhost:9090/api/v1/query?query=rate(secureclaw_errors_total[1m])
```

### Test Resource Alerts

```bash
# Simulate high memory usage
# (requires stress tool or custom script)
stress-ng --vm 1 --vm-bytes 90% --timeout 60s

# Check Prometheus metrics
curl http://localhost:9090/api/v1/query?query=process_resident_memory_bytes
```

---

## Alert Runbooks

### Gateway Down Runbook

1. **Check process status:**

   ```bash
   systemctl status secureclaw
   ps aux | grep secureclaw
   ```

2. **Check logs:**

   ```bash
   tail -f /tmp/secureclaw/secureclaw-*.log
   journalctl -u secureclaw -n 100
   ```

3. **Restart if needed:**

   ```bash
   systemctl restart secureclaw
   ```

4. **Verify health:**
   ```bash
   curl http://localhost:18789/health/live
   ```

### High Error Rate Runbook

1. **Identify error types:**

   ```bash
   tail -f /tmp/secureclaw/secureclaw-*.log | jq 'select(.logLevelName == "ERROR")'
   ```

2. **Check recent changes:**

   ```bash
   git log --oneline -10
   ```

3. **Check external dependencies:**

   ```bash
   # Model APIs
   curl https://api.anthropic.com/health

   # Channels
   secureclaw health --verbose
   ```

4. **Rollback if needed:**
   ```bash
   git revert <commit-hash>
   systemctl restart secureclaw
   ```

---

## Customization Guidelines

### Adjust for Your Environment

1. **Low Traffic (< 100 messages/day):**
   - Increase alert thresholds to avoid false positives
   - Extend time windows (5m → 15m)
   - Use MEDIUM severity for most alerts

2. **High Traffic (> 10,000 messages/day):**
   - Tighten thresholds for faster detection
   - Shorten time windows (10m → 5m)
   - Add more granular alerts per channel

3. **Resource-Constrained (Raspberry Pi):**
   - Adjust memory/CPU thresholds (80% → 70%)
   - Monitor disk I/O more closely
   - Add alerts for swap usage

4. **Enterprise Production:**
   - Implement all CRITICAL and HIGH alerts
   - Add redundancy checks
   - Set up multi-channel notifications (PagerDuty + Slack)

---

## Related Documentation

- [Health Check Endpoints](./health-endpoints.md) - HTTP health endpoints
- [Monitoring & Observability Report](/MONITORING-OBSERVABILITY-REPORT.md) - Full observability guide
- [Gateway Configuration](./configuration-reference.md) - Gateway settings
- [Troubleshooting](./troubleshooting.md) - Common issues
