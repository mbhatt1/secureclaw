# 🦀 Krumpus ↔️ SecureClaw Integration Plan

## Executive Summary

**Krumpus** is an enterprise EDR (Endpoint Detection and Response) platform with LLM-powered autonomous investigations.

**SecureClaw** is an AI agent gateway with Security Coach threat prevention and multi-channel communication.

**Together**, they create a complete security operations platform: Krumpus monitors endpoints and detects threats, while SecureClaw provides AI orchestration, threat prevention, and communication.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                   Integrated Security Platform                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐        ┌─────────────────────┐          │
│  │  Krumpus Agents     │        │  SecureClaw Gateway │          │
│  │  (C++/Endpoints)    │───────▶│  (AI Orchestration) │          │
│  └─────────────────────┘        └──────────┬──────────┘          │
│           │                                 │                     │
│           │ Events/Alerts                   │ Secure Commands    │
│           │                                 │ Threat Prevention  │
│           ▼                                 ▼                     │
│  ┌─────────────────────┐        ┌─────────────────────┐          │
│  │  Krumpus Server     │◄──────▶│  Security Coach     │          │
│  │  (Python/FastAPI)   │        │  (Pattern + LLM)    │          │
│  └─────────────────────┘        └─────────────────────┘          │
│           │                                 │                     │
│           │ Investigation                   │ Multi-Channel       │
│           │ Requests                        │ Notifications       │
│           ▼                                 ▼                     │
│  ┌─────────────────────┐        ┌─────────────────────┐          │
│  │  LLM Investigation  │◄──────▶│  Slack/Discord/     │          │
│  │  Engine             │        │  WhatsApp/Telegram  │          │
│  └─────────────────────┘        └─────────────────────┘          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### 1. 🔐 Authentication & SSO

**Problem**: Krumpus has JWT auth, SecureClaw has OAuth + API keys
**Solution**: Unified SSO with shared user directory

**Implementation**:

```typescript
// SecureClaw provides OAuth provider
// Krumpus validates tokens via SecureClaw

// In Krumpus (Python):
@app.get("/api/v1/auth/secureclaw/callback")
async def secureclaw_oauth_callback(code: str):
    # Exchange code for token with SecureClaw
    token = await secureclaw_client.exchange_code(code)
    return create_session(token)

// In SecureClaw (TypeScript):
// Add OAuth provider for Krumpus
export const krumpusOAuthProvider = {
  clientId: process.env.KRUMPUS_CLIENT_ID,
  clientSecret: process.env.KRUMPUS_CLIENT_SECRET,
  redirectUri: "https://krumpus.example.com/auth/callback",
  scopes: ["read:agents", "write:investigations", "read:alerts"],
};
```

**Benefits**:

- Single sign-on for users
- Centralized user management
- Shared RBAC policies

---

### 2. 🚨 Alert & Event Streaming

**Problem**: Krumpus generates alerts, but lacks multi-channel notifications
**Solution**: Stream alerts to SecureClaw for delivery to Slack, Discord, WhatsApp

**Implementation**:

```python
# Krumpus sends alerts to SecureClaw
async def send_alert_to_secureclaw(alert: Alert):
    payload = {
        "severity": alert.severity,
        "title": alert.title,
        "description": alert.description,
        "agent_id": alert.agent_id,
        "iocs": [ioc.value for ioc in alert.iocs],
        "mitre_techniques": alert.mitre_techniques,
    }

    # Post to SecureClaw webhook
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://secureclaw.example.com/webhooks/krumpus/alerts",
            json=payload,
            headers={"Authorization": f"Bearer {SECURECLAW_API_KEY}"}
        )

# SecureClaw receives and routes to channels
// src/webhooks/krumpus.ts
export async function handleKrumpusAlert(alert: KrumpusAlert) {
    const message = formatAlertMessage(alert);

    // Send to configured channels
    await sendToSlack(message, alert.severity);
    await sendToDiscord(message, alert.severity);
    await sendToPagerDuty(alert); // If critical
}
```

**Alert Routing**:

```typescript
// SecureClaw config
export const krumpusAlertRouting = {
  critical: ["slack-security-ops", "pagerduty"],
  high: ["slack-security-ops", "discord-soc"],
  medium: ["slack-security-alerts"],
  low: ["discord-soc"],
};
```

**Benefits**:

- Real-time Slack/Discord alerts
- Escalation to PagerDuty for critical
- On-call notifications
- Mobile push via WhatsApp/Telegram

---

### 3. 🛡️ Security Coach for Agent Commands

**Problem**: Krumpus agents execute arbitrary commands from investigations
**Solution**: Route commands through Security Coach for threat validation

**Implementation**:

```python
# Krumpus investigation runner
async def execute_tool_on_agent(
    agent_id: str,
    tool_name: str,
    params: dict
) -> ToolResult:
    # BEFORE: Direct execution
    # result = await agent_executor.run(agent_id, tool_name, params)

    # AFTER: Security Coach validation
    validated = await secureclaw_security_coach_validate(
        tool_name=tool_name,
        params=params,
        agent_id=agent_id,
    )

    if not validated.allowed:
        raise SecurityException(
            f"Blocked by Security Coach: {validated.reason}"
        )

    result = await agent_executor.run(agent_id, tool_name, params)
    return result

async def secureclaw_security_coach_validate(
    tool_name: str,
    params: dict,
    agent_id: str,
) -> SecurityCoachResult:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://secureclaw.example.com/api/security-coach/validate",
            json={
                "toolName": tool_name,
                "params": params,
                "agentId": agent_id,
                "sessionKey": f"krumpus-agent-{agent_id}",
            },
            headers={"Authorization": f"Bearer {SECURECLAW_API_KEY}"}
        )
        return response.json()
```

**Security Coach Rules for Krumpus**:

```typescript
// SecureClaw security-coach rules
export const krumpusAgentRules = [
  {
    id: "krumpus-no-rm-rf",
    pattern: /rm\s+-rf\s+\/(?!var\/log|tmp)/,
    severity: "critical",
    message: "Blocked recursive deletion outside safe directories",
  },
  {
    id: "krumpus-no-arbitrary-code-exec",
    pattern: /eval|exec|system/i,
    severity: "high",
    message: "Blocked arbitrary code execution attempt",
  },
  {
    id: "krumpus-no-credential-access",
    pattern: /\/etc\/shadow|\.ssh\/|\.aws\/credentials/,
    severity: "critical",
    message: "Blocked credential file access",
  },
];
```

**Benefits**:

- Prevent malicious investigation commands
- Pattern + LLM threat detection
- Audit trail of blocked commands
- Fail-closed security

---

### 4. 🤖 SecureClaw as Investigation LLM

**Problem**: Krumpus uses local llama.cpp or OpenAI/Anthropic directly
**Solution**: Route LLM requests through SecureClaw for unified model management

**Implementation**:

```python
# Krumpus LLM client wrapper
class SecureClawLLMClient(LLMClient):
    async def chat_completion(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
        **kwargs
    ) -> LLMResponse:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://secureclaw.example.com/api/llm/chat",
                json={
                    "messages": messages,
                    "tools": tools,
                    "model": self.model_name,
                    "agentId": "krumpus-investigator",
                },
                headers={"Authorization": f"Bearer {SECURECLAW_API_KEY}"}
            )
            return response.json()

# Use in Krumpus investigation runner
llm_client = SecureClawLLMClient(model="claude-sonnet-4")
investigation_result = await run_investigation(
    alert=alert,
    llm_client=llm_client,
    tools=agent_tools,
)
```

**Benefits**:

- Centralized LLM billing and rate limits
- Model fallback and retries
- Unified LLM observability
- Cost optimization

---

### 5. 📊 Unified SIEM Integration

**Problem**: Both systems generate security events
**Solution**: Merge event streams and send to SIEM

**Implementation**:

```typescript
// SecureClaw SIEM dispatcher with Krumpus events
import { SiemDispatcher } from "./security-coach/siem/dispatcher.js";

export class UnifiedSiemDispatcher extends SiemDispatcher {
  async sendKrumpusEvent(event: KrumpusEvent) {
    const siemEvent = this.convertKrumpusToSiem(event);
    await this.dispatch(siemEvent);
  }

  private convertKrumpusToSiem(event: KrumpusEvent): SiemEvent {
    return {
      timestamp: event.timestamp,
      source: "krumpus",
      eventType: event.event_type,
      severity: event.severity,
      agentId: event.agent_id,
      hostName: event.agent_hostname,
      user: event.user,
      process: event.process_name,
      commandLine: event.command_line,
      fileHash: event.file_hash,
      networkConnection: event.network_connection,
      mitreAttack: event.mitre_techniques,
      raw: event,
    };
  }
}
```

**SIEM Destinations**:

- Splunk
- Datadog
- Azure Sentinel
- Elasticsearch

**Benefits**:

- Unified security analytics
- Cross-system correlation
- Compliance reporting
- Threat hunting

---

### 6. 🔗 Threat Intelligence Sharing

**Problem**: IOCs discovered by investigations should be shared
**Solution**: Bidirectional IOC feed between systems

**Implementation**:

```python
# Krumpus sends IOCs to SecureClaw
async def share_ioc_with_secureclaw(ioc: IOC):
    await secureclaw_api.post("/api/threat-intel/iocs", {
        "type": ioc.ioc_type,  # ip, domain, hash, url
        "value": ioc.value,
        "severity": ioc.severity,
        "source": "krumpus-investigation",
        "confidence": ioc.confidence,
        "tags": ioc.tags,
        "context": ioc.investigation_context,
    })

# SecureClaw uses IOCs for Security Coach rules
async function getKrumpusIOCs(): Promise<IOC[]> {
    const response = await fetch("https://secureclaw.example.com/api/threat-intel/iocs");
    return response.json();
}

// Add to Security Coach patterns
export async function loadKrumpusIOCPatterns() {
    const iocs = await getKrumpusIOCs();
    return iocs.map(ioc => ({
        id: `krumpus-ioc-${ioc.id}`,
        pattern: new RegExp(escapeRegex(ioc.value)),
        severity: ioc.severity,
        category: "threat_intel",
        message: `Blocked known malicious ${ioc.type}: ${ioc.value}`,
    }));
}
```

**Benefits**:

- Real-time threat intelligence
- Automatic pattern updates
- Reduced investigation time
- Prevent known threats

---

### 7. 🎯 Playbook Orchestration

**Problem**: Complex response workflows span both systems
**Solution**: SecureClaw orchestrates Krumpus + other tools

**Implementation**:

```typescript
// SecureClaw playbook that uses Krumpus
export const ransomwareResponsePlaybook: Playbook = {
  name: "Ransomware Detection & Response",
  trigger: {
    type: "alert",
    source: "krumpus",
    conditions: {
      severity: "critical",
      mitreAttack: ["T1486"], // Data Encrypted for Impact
    },
  },
  steps: [
    {
      name: "Isolate infected hosts",
      tool: "krumpus",
      action: "isolate_agent",
      params: { agentIds: "{{alert.agent_id}}" },
    },
    {
      name: "Notify SOC team",
      tool: "slack",
      action: "send_message",
      params: {
        channel: "#incident-response",
        message: "🚨 RANSOMWARE DETECTED: {{alert.title}}",
      },
    },
    {
      name: "Start investigation",
      tool: "krumpus",
      action: "start_investigation",
      params: {
        alertId: "{{alert.id}}",
        priority: "critical",
      },
    },
    {
      name: "Collect forensics",
      tool: "krumpus",
      action: "collect_forensics",
      params: {
        agentId: "{{alert.agent_id}}",
        artifacts: ["memory_dump", "disk_image", "process_tree"],
      },
    },
    {
      name: "Create incident ticket",
      tool: "jira",
      action: "create_issue",
      params: {
        project: "SEC",
        type: "Incident",
        priority: "Critical",
      },
    },
  ],
};
```

**Benefits**:

- Automated incident response
- Consistent response procedures
- Reduced MTTR (Mean Time To Respond)
- Audit trail

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] Set up mutual authentication (API keys)
- [ ] Implement webhook endpoints
- [ ] Basic alert streaming Krumpus → SecureClaw
- [ ] Test end-to-end alert delivery to Slack

### Phase 2: Security Integration (Week 3-4)

- [ ] Integrate Security Coach for command validation
- [ ] Add Krumpus-specific threat patterns
- [ ] Implement command audit logging
- [ ] Test blocking of malicious investigation commands

### Phase 3: LLM & Investigation (Week 5-6)

- [ ] Route Krumpus LLM requests through SecureClaw
- [ ] Implement investigation playbooks
- [ ] Add LLM Judge for investigation validation
- [ ] Performance testing (latency < 100ms)

### Phase 4: SIEM & Intelligence (Week 7-8)

- [ ] Unified SIEM event pipeline
- [ ] Bidirectional IOC feed
- [ ] Threat intelligence integration
- [ ] Analytics dashboard

### Phase 5: Orchestration (Week 9-10)

- [ ] Playbook engine
- [ ] Cross-system workflows
- [ ] Response automation
- [ ] Production hardening

---

## Configuration

### Environment Variables

**Krumpus** (`.env`):

```bash
# SecureClaw Integration
SECURECLAW_API_URL=https://secureclaw.example.com
SECURECLAW_API_KEY=sk-secureclaw-...
SECURECLAW_WEBHOOK_SECRET=whsec_...

# Features
SECURECLAW_SECURITY_COACH_ENABLED=true
SECURECLAW_ALERT_ROUTING_ENABLED=true
SECURECLAW_LLM_PROXY_ENABLED=true
```

**SecureClaw** (`.env`):

```bash
# Krumpus Integration
KRUMPUS_API_URL=https://krumpus.example.com
KRUMPUS_API_KEY=sk-krumpus-...
KRUMPUS_WEBHOOK_SECRET=whsec_...

# Features
KRUMPUS_ALERT_INGESTION_ENABLED=true
KRUMPUS_COMMAND_VALIDATION_ENABLED=true
```

---

## API Contracts

### SecureClaw → Krumpus

**Execute Investigation**

```bash
POST /api/v1/investigations
Authorization: Bearer <krumpus-api-key>

{
  "alert_id": "alert-123",
  "priority": "high",
  "investigation_type": "autonomous",
  "tools_allowed": ["osquery_query", "process_tree", "fim_query"]
}

Response: 200 OK
{
  "investigation_id": "inv-456",
  "status": "running",
  "estimated_duration_seconds": 120
}
```

**Get Investigation Status**

```bash
GET /api/v1/investigations/{id}
Authorization: Bearer <krumpus-api-key>

Response: 200 OK
{
  "investigation_id": "inv-456",
  "status": "completed",
  "findings": [...],
  "iocs_discovered": [...],
  "response_actions_recommended": [...]
}
```

### Krumpus → SecureClaw

**Validate Command**

```bash
POST /api/security-coach/validate
Authorization: Bearer <secureclaw-api-key>

{
  "toolName": "osquery_query",
  "params": {
    "query": "SELECT * FROM processes WHERE name LIKE '%malware%'"
  },
  "agentId": "krumpus-agent-123",
  "sessionKey": "krumpus-inv-456"
}

Response: 200 OK
{
  "allowed": true,
  "reason": null,
  "source": "pattern"
}
```

**Send Alert**

```bash
POST /webhooks/krumpus/alerts
Authorization: Bearer <secureclaw-api-key>

{
  "severity": "critical",
  "title": "Ransomware Detected on Host",
  "description": "File encryption behavior detected",
  "agent_id": "agent-123",
  "hostname": "workstation-42",
  "mitre_techniques": ["T1486"],
  "iocs": ["sha256:abc123...", "ip:192.168.1.100"]
}

Response: 202 Accepted
{
  "message_id": "msg-789",
  "channels_notified": ["slack", "discord"]
}
```

---

## Security Considerations

### 1. Mutual Authentication

- Both systems use API keys for authentication
- Rotate keys every 90 days
- Store keys in HashiCorp Vault or AWS Secrets Manager

### 2. Network Security

- TLS 1.3 for all API communication
- mTLS optional for high-security environments
- IP allowlisting for webhook endpoints

### 3. Rate Limiting

- Krumpus: 1000 req/min per API key
- SecureClaw: 500 req/min per API key
- Webhook deliveries: 100/min

### 4. Data Privacy

- PII redaction in alerts
- Sensitive data encryption at rest
- GDPR compliance (data retention policies)

### 5. Audit Logging

- Log all cross-system API calls
- Immutable audit trail
- 1-year retention

---

## Performance Targets

| Metric                      | Target   | Notes                          |
| --------------------------- | -------- | ------------------------------ |
| Alert delivery latency      | < 1s     | Krumpus → SecureClaw → Slack   |
| Command validation latency  | < 100ms  | Security Coach check           |
| LLM proxy latency           | < 500ms  | Additional overhead acceptable |
| Investigation start latency | < 2s     | SecureClaw → Krumpus           |
| Webhook throughput          | 1000/min | Burst capacity                 |
| API availability            | 99.9%    | 8.76 hours downtime/year       |

---

## Cost Analysis

### Infrastructure

- **Additional SecureClaw instances**: $200/mo (2x workers)
- **Additional Krumpus Redis**: $50/mo (webhook queue)
- **Network egress**: ~$20/mo (API calls)

### LLM Costs

- **Without integration**: Krumpus pays OpenAI/Anthropic directly
- **With integration**: Centralized billing through SecureClaw
- **Savings**: ~15% via shared caching and rate limit optimization

### Operational Savings

- **Faster incident response**: 30% reduction in MTTR
- **Automation**: 50% fewer manual investigation steps
- **Reduced false positives**: Security Coach blocks 20% of unnecessary alerts

**ROI**: 3-6 months

---

## Testing Strategy

### Unit Tests

- Mock Krumpus API responses in SecureClaw
- Mock SecureClaw API responses in Krumpus
- Validate data serialization/deserialization

### Integration Tests

- End-to-end alert flow
- Command validation with Security Coach
- LLM proxy functionality
- Webhook delivery reliability

### Load Tests

- 1000 alerts/min sustained
- 10,000 command validations/min
- 100 concurrent investigations

### Security Tests

- API key rotation
- Invalid token handling
- Rate limit enforcement
- Injection attack prevention

---

## Monitoring & Observability

### Metrics to Track

```
# Krumpus → SecureClaw
krumpus_alerts_sent_total
krumpus_alerts_sent_latency_seconds
krumpus_commands_validated_total
krumpus_commands_blocked_total

# SecureClaw → Krumpus
secureclaw_investigations_started_total
secureclaw_investigations_completed_total
secureclaw_webhook_delivery_success_total
secureclaw_webhook_delivery_failures_total

# End-to-end
integration_alert_to_slack_latency_seconds
integration_investigation_duration_seconds
```

### Dashboards

- **Integration Health**: API success rates, latencies
- **Security Posture**: Commands blocked, threats detected
- **Operational Efficiency**: Investigation time, MTTR

### Alerts

- API error rate > 5%
- Webhook delivery failure rate > 10%
- Command validation latency > 200ms
- Investigation queue depth > 100

---

## Rollout Plan

### 1. Development Environment

- Set up local Krumpus + SecureClaw
- Implement webhook endpoints
- Test alert flow

### 2. Staging Environment

- Deploy to staging
- Load testing
- Security penetration testing

### 3. Production Canary

- Enable for 10% of Krumpus agents
- Monitor for 1 week
- Rollback plan ready

### 4. Production Rollout

- Gradual rollout (25% → 50% → 100%)
- Monitor metrics closely
- On-call team ready

---

## Success Criteria

- [ ] 99% alert delivery success rate
- [ ] < 100ms command validation latency
- [ ] 0 security incidents due to integration
- [ ] 30% reduction in MTTR
- [ ] Positive SOC team feedback
- [ ] Cost-neutral or positive ROI

---

## Future Enhancements

### Year 1

- [ ] Automated threat hunting playbooks
- [ ] ML-based anomaly detection
- [ ] GraphQL API for complex queries
- [ ] Mobile app with push notifications

### Year 2

- [ ] Federated learning across tenants
- [ ] Behavioral analytics
- [ ] Supply chain security integration
- [ ] Compliance automation (SOC 2, ISO 27001)

---

## Summary

Integrating Krumpus with SecureClaw creates a **unified security operations platform** that combines:

- **Endpoint visibility** (Krumpus agents)
- **AI-powered threat prevention** (Security Coach)
- **Autonomous investigations** (LLM orchestration)
- **Real-time communication** (Multi-channel alerts)
- **Orchestrated response** (Cross-system playbooks)

The integration leverages the strengths of both systems while maintaining modularity and security. With proper authentication, rate limiting, and monitoring, the combined platform will significantly improve security posture and operational efficiency.

**Next Step**: Implement Phase 1 (Foundation) and validate the basic alert streaming flow.
