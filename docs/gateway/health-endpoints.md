# Health Check HTTP Endpoints

SecureClaw provides HTTP health check endpoints for container orchestration platforms (Kubernetes, Docker, etc.) and load balancers.

## Endpoints

### Liveness Probe: `GET /health/live`

Checks if the process is alive and the Node.js event loop is responsive. Does **not** verify external dependencies.

**Use for:** Kubernetes liveness probes, Docker health checks

**Returns 200 if:**

- Process is running
- Event loop is responsive

**Example Response (200 OK):**

```json
{
  "status": "ok",
  "alive": true,
  "uptimeMs": 3600000,
  "timestamp": "2026-02-14T10:30:00.000Z",
  "memory": {
    "rss": 157286400,
    "heapTotal": 65536000,
    "heapUsed": 45678000,
    "external": 1234000
  },
  "nodeVersion": "v20.11.0"
}
```

**Example Response (500 Error):**

```json
{
  "status": "error",
  "alive": false,
  "error": "Internal error message"
}
```

---

### Readiness Probe: `GET /health/ready`

Checks if the service is ready to accept traffic. Verifies external dependencies (channels, session store, etc.).

**Use for:** Kubernetes readiness probes, load balancer health checks

**Returns 200 if:**

- Process is alive
- Health snapshot can be retrieved
- Channels are operational

**Returns 503 if:**

- Any channel is not linked
- Channel probes failed
- Service is degraded

**Query Parameters:**

- `probe=true` - Perform active channel probes (slower, more thorough)
- `timeout=5000` - Timeout in milliseconds (default: 5000, max: 30000)

**Example Response (200 OK):**

```json
{
  "status": "ready",
  "ready": true,
  "timestamp": "2026-02-14T10:30:00.000Z",
  "healthCheckDurationMs": 123,
  "channels": 3,
  "agents": 1,
  "sessions": 5,
  "metrics": {
    "diskWritesPerMin": 12.5,
    "networkMbps": 0.8,
    "cacheHitRate": 85.2
  }
}
```

**Example Response (503 Degraded):**

```json
{
  "status": "degraded",
  "ready": false,
  "timestamp": "2026-02-14T10:30:00.000Z",
  "healthCheckDurationMs": 456,
  "channels": 3,
  "agents": 1,
  "sessions": 5,
  "issues": ["whatsapp: not linked", "telegram: probe failed"]
}
```

---

### Legacy Endpoint: `GET /health`

Redirects to `/health/ready` for backward compatibility.

**Deprecated:** Use `/health/ready` instead.

---

## Kubernetes Configuration

### Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 18789
    scheme: HTTP
  initialDelaySeconds: 30
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3
```

### Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 18789
    scheme: HTTP
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 2
  successThreshold: 1
```

### With Channel Probing (more thorough, slower)

```yaml
readinessProbe:
  httpGet:
    path: /health/ready?probe=true&timeout=10000
    port: 18789
    scheme: HTTP
  initialDelaySeconds: 30
  periodSeconds: 30
  timeoutSeconds: 12
  failureThreshold: 2
```

---

## Docker Health Check

### Dockerfile

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:18789/health/live || exit 1
```

### docker-compose.yml

```yaml
services:
  secureclaw:
    image: secureclaw:latest
    ports:
      - "18789:18789"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:18789/health/live"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
```

---

## Load Balancer Configuration

### AWS Application Load Balancer (ALB)

```yaml
HealthCheckPath: /health/ready
HealthCheckIntervalSeconds: 30
HealthCheckTimeoutSeconds: 5
HealthyThresholdCount: 2
UnhealthyThresholdCount: 2
Matcher:
  HttpCode: 200
```

### NGINX Upstream Health Check

```nginx
upstream secureclaw {
    server localhost:18789 max_fails=2 fail_timeout=30s;
}

location /health {
    proxy_pass http://secureclaw/health/live;
    proxy_connect_timeout 5s;
    proxy_read_timeout 5s;
}
```

---

## Monitoring & Alerting

### Recommended Checks

1. **Liveness Check:**
   - Interval: 30s
   - Timeout: 5s
   - Failure threshold: 3 consecutive failures

2. **Readiness Check:**
   - Interval: 10-30s (depending on traffic)
   - Timeout: 5-10s
   - Failure threshold: 2 consecutive failures

3. **Alert Thresholds:**
   - Alert if liveness fails (process crash)
   - Alert if readiness fails for > 2 minutes (channel issues)
   - Alert if readiness degraded for > 5 minutes (performance issues)

### Prometheus Monitoring

```yaml
scrape_configs:
  - job_name: "secureclaw_health"
    metrics_path: /health/ready
    params:
      probe: ["true"]
    scrape_interval: 30s
    static_configs:
      - targets: ["localhost:18789"]
```

---

## Comparison with CLI Health Checks

### HTTP Endpoints vs CLI Commands

| Feature            | HTTP Endpoints           | CLI Commands            |
| ------------------ | ------------------------ | ----------------------- |
| **Purpose**        | Container orchestration  | Manual diagnostics      |
| **Speed**          | Fast (cached)            | Variable                |
| **Auth**           | None (unauthenticated)   | WebSocket auth required |
| **Format**         | JSON only                | JSON or colored text    |
| **Channel Probes** | Optional (`?probe=true`) | Default in `--verbose`  |
| **Use Case**       | Automated health checks  | Human troubleshooting   |

### When to Use Each

**Use HTTP Endpoints:**

- Kubernetes liveness/readiness probes
- Docker health checks
- Load balancer health checks
- Automated monitoring systems
- CI/CD health verification

**Use CLI Commands:**

- Manual troubleshooting (`secureclaw health`)
- Detailed diagnostics (`secureclaw status --all`)
- Channel-specific debugging (`secureclaw health --verbose`)
- Session store inspection

---

## Troubleshooting

### Liveness Probe Always Fails

**Possible Causes:**

- Gateway not started
- Port 18789 not accessible
- Firewall blocking connections
- Network policy blocking traffic (Kubernetes)

**Solutions:**

```bash
# Check if gateway is running
ps aux | grep secureclaw

# Check if port is listening
netstat -tlnp | grep 18789

# Test locally
curl http://localhost:18789/health/live

# Check Kubernetes network policy
kubectl describe networkpolicy -n your-namespace
```

### Readiness Probe Always Fails

**Possible Causes:**

- Channels not linked
- Authentication expired
- Health check timeout too short
- External dependencies down

**Solutions:**

```bash
# Check detailed health status
secureclaw health --verbose --json

# Relink channels
secureclaw channels login

# Test with longer timeout
curl "http://localhost:18789/health/ready?timeout=10000"

# Test without probing (faster)
curl "http://localhost:18789/health/ready?probe=false"
```

### Readiness Intermittently Fails

**Possible Causes:**

- Timeout too aggressive
- Resource constraints (CPU/memory)
- Network latency

**Solutions:**

```bash
# Increase timeout in probe config
readinessProbe:
  timeoutSeconds: 10  # Increase from 5

# Check resource usage
kubectl top pod secureclaw-xyz

# View recent health check logs
kubectl logs secureclaw-xyz | grep "readiness probe"
```

---

## Security Considerations

### No Authentication Required

Health check endpoints are **intentionally unauthenticated** to work with:

- Kubernetes liveness/readiness probes
- Docker health checks
- Load balancer health checks

These endpoints do **not** expose sensitive information:

- ✅ Process uptime, memory usage
- ✅ Channel counts, agent counts
- ✅ Aggregate metrics (writes/min, cache hit rate)
- ❌ Session keys, user data
- ❌ Authentication tokens
- ❌ Message contents
- ❌ Individual channel credentials

### Firewall Recommendations

If exposing the gateway publicly:

1. **Restrict health endpoints** to internal networks only
2. **Use network policies** (Kubernetes) to limit access
3. **Place behind reverse proxy** with IP whitelisting

```nginx
# NGINX: Restrict /health/* to internal IPs only
location /health/ {
    allow 10.0.0.0/8;
    allow 172.16.0.0/12;
    allow 192.168.0.0/16;
    deny all;

    proxy_pass http://secureclaw;
}
```

---

## Related Documentation

- [Health Checks (CLI)](./health.md) - CLI-based health commands
- [Gateway Configuration](./configuration-reference.md) - Gateway settings
- [Troubleshooting](./troubleshooting.md) - Common issues
- [Monitoring & Observability](/MONITORING-OBSERVABILITY-REPORT.md) - Full observability guide
