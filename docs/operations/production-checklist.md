---
title: "Production Deployment Checklist"
description: "Comprehensive pre-deployment validation checklist for SecureClaw production systems"
---

# Production Deployment Checklist

## Overview

This checklist ensures your SecureClaw deployment is production-ready, secure, and reliable. Complete all items before deploying to production or exposing your gateway to external access.

---

## Security Configuration

### 1. Change Default Gateway Token

**Why:** Default tokens are a critical security risk. Attackers can gain full access to your system if you use default credentials.

**Check:**

```bash
# Verify token is not default
jq '.gateway.token' ~/.secureclaw/secureclaw.json

# Should NOT be: "default-insecure-token" or similar
```

**Fix:**

```bash
# Generate secure token
SECURE_TOKEN=$(openssl rand -base64 32)

# Update config
jq --arg token "$SECURE_TOKEN" '.gateway.token = $token' \
  ~/.secureclaw/secureclaw.json > temp.json && mv temp.json ~/.secureclaw/secureclaw.json

# Secure the token
chmod 600 ~/.secureclaw/secureclaw.json

echo "✅ Gateway token updated to: $SECURE_TOKEN"
echo "⚠️  Save this token securely - you'll need it for API access"
```

**Validation:**

- [ ] Token is at least 32 characters
- [ ] Token is randomly generated
- [ ] Token is documented in secure location (password manager)
- [ ] Old token is invalidated

---

### 2. Enable TLS for External Access

**Why:** Unencrypted HTTP exposes sensitive data (tokens, messages, credentials) to network interception.

**Check:**

```bash
# Check if TLS is enabled
jq '.gateway.tls' ~/.secureclaw/secureclaw.json
```

**Fix (Option A - Self-Signed Certificate):**

```bash
# Generate self-signed certificate (development only)
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout ~/.secureclaw/gateway-key.pem \
  -out ~/.secureclaw/gateway-cert.pem \
  -days 365 -subj "/CN=localhost"

# Update config
jq '.gateway.tls = {
  "enabled": true,
  "cert": "~/.secureclaw/gateway-cert.pem",
  "key": "~/.secureclaw/gateway-key.pem"
}' ~/.secureclaw/secureclaw.json > temp.json && mv temp.json ~/.secureclaw/secureclaw.json

# Secure certificates
chmod 600 ~/.secureclaw/gateway-*.pem
```

**Fix (Option B - Let's Encrypt):**

```bash
# Install certbot
sudo apt-get install certbot  # Ubuntu/Debian
sudo yum install certbot      # CentOS/RHEL
brew install certbot          # macOS

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Update config
jq '.gateway.tls = {
  "enabled": true,
  "cert": "/etc/letsencrypt/live/your-domain.com/fullchain.pem",
  "key": "/etc/letsencrypt/live/your-domain.com/privkey.pem"
}' ~/.secureclaw/secureclaw.json > temp.json && mv temp.json ~/.secureclaw/secureclaw.json

# Set up auto-renewal
sudo certbot renew --dry-run
```

**Fix (Option C - Reverse Proxy):**

```nginx
# /etc/nginx/sites-available/secureclaw
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Validation:**

- [ ] TLS enabled or reverse proxy configured
- [ ] Certificate is valid (not expired)
- [ ] Certificate matches domain name
- [ ] HTTPS redirects working
- [ ] Test with: `curl -I https://your-domain.com`

---

### 3. Configure Trusted Proxies

**Why:** Without trusted proxy configuration, IP-based security features may be bypassed or incorrectly applied.

**Check:**

```bash
# Check trusted proxy configuration
jq '.gateway.trustedProxies' ~/.secureclaw/secureclaw.json
```

**Fix:**

```bash
# Add trusted proxy IPs
jq '.gateway.trustedProxies = ["127.0.0.1", "::1", "10.0.0.0/8"]' \
  ~/.secureclaw/secureclaw.json > temp.json && mv temp.json ~/.secureclaw/secureclaw.json

# For cloud load balancers:
# AWS ALB: Include VPC CIDR
# GCP: Include "35.191.0.0/16" and "130.211.0.0/22"
# Cloudflare: Include Cloudflare IP ranges
```

**Validation:**

- [ ] Only legitimate proxy IPs are trusted
- [ ] X-Forwarded-For headers correctly parsed
- [ ] Rate limiting works correctly behind proxy

---

### 4. Set Appropriate Rate Limits

**Why:** Prevent abuse, DoS attacks, and resource exhaustion.

**Check:**

```bash
# Check rate limit configuration
jq '.gateway.rateLimit' ~/.secureclaw/secureclaw.json
```

**Fix:**

```bash
# Configure rate limits
jq '.gateway.rateLimit = {
  "enabled": true,
  "windowMs": 60000,
  "maxRequests": 100,
  "blockDuration": 300000
}' ~/.secureclaw/secureclaw.json > temp.json && mv temp.json ~/.secureclaw/secureclaw.json
```

**Recommended Limits:**

| Environment | Requests/Min | Block Duration |
| ----------- | ------------ | -------------- |
| Development | 1000         | 5 min          |
| Staging     | 500          | 10 min         |
| Production  | 100          | 15 min         |
| Public API  | 60           | 30 min         |

**Validation:**

- [ ] Rate limits configured appropriately
- [ ] Test rate limiting: `for i in {1..200}; do curl http://localhost:8080/health; done`
- [ ] Verify 429 responses after limit exceeded

---

### 5. Review Security Coach Settings

**Why:** Ensure threat detection is properly configured for your environment.

**Check:**

```bash
# Check Security Coach configuration
jq '.securityCoach' ~/.secureclaw/secureclaw.json
```

**Recommended Production Configuration:**

```json
{
  "securityCoach": {
    "enabled": true,
    "mode": "block",
    "llmJudge": {
      "enabled": true,
      "model": "claude-sonnet-4",
      "fallbackToPatterns": true,
      "cacheEnabled": true,
      "cacheTTL": 3600000,
      "maxLatency": 1000,
      "confidenceThreshold": 75,
      "confirmPatternMatches": true
    },
    "siemIntegration": {
      "enabled": true,
      "endpoint": "https://siem.company.com/api/events",
      "authToken": "${SIEM_TOKEN}"
    }
  }
}
```

**Validation:**

- [ ] Security Coach enabled
- [ ] Mode set to "block" (not "warn" or "audit")
- [ ] LLM judge configured with API key
- [ ] Test with malicious command: `secureclaw agent --message "rm -rf /"`
- [ ] Verify command is blocked
- [ ] SIEM integration tested (if applicable)

**See:** [Security Coach Documentation](/security-coach) for full configuration guide

---

### 6. Configure SIEM Integration (Enterprise)

**Why:** Enterprise audit logging and compliance requirements.

**Check:**

```bash
# Check SIEM configuration
jq '.securityCoach.siemIntegration' ~/.secureclaw/secureclaw.json
```

**Fix:**

```bash
# Configure SIEM endpoint
jq '.securityCoach.siemIntegration = {
  "enabled": true,
  "endpoint": "https://siem.company.com/api/events",
  "authToken": "${SIEM_TOKEN}",
  "batchSize": 100,
  "flushInterval": 5000
}' ~/.secureclaw/secureclaw.json > temp.json && mv temp.json ~/.secureclaw/secureclaw.json

# Set SIEM token in environment
echo "export SIEM_TOKEN='your-siem-token'" >> ~/.bashrc
source ~/.bashrc
```

**Validation:**

- [ ] SIEM endpoint configured
- [ ] Authentication token set
- [ ] Test event delivery
- [ ] Verify events appear in SIEM
- [ ] Check batch processing works

---

### 7. Test with allowInsecureAuth: false

**Why:** Ensure authentication works correctly without insecure fallbacks.

**Check:**

```bash
# Check allowInsecureAuth setting
jq '.gateway.allowInsecureAuth' ~/.secureclaw/secureclaw.json
```

**Fix:**

```bash
# Disable insecure auth
jq '.gateway.allowInsecureAuth = false' \
  ~/.secureclaw/secureclaw.json > temp.json && mv temp.json ~/.secureclaw/secureclaw.json
```

**Validation:**

- [ ] Gateway starts successfully
- [ ] API authentication works with token
- [ ] Channels authenticate correctly
- [ ] No "insecure auth" warnings in logs

---

### 8. Verify CORS Allowed Origins

**Why:** Prevent unauthorized web applications from accessing your gateway.

**Check:**

```bash
# Check CORS configuration
jq '.gateway.cors' ~/.secureclaw/secureclaw.json
```

**Fix:**

```bash
# Configure strict CORS
jq '.gateway.cors = {
  "enabled": true,
  "allowedOrigins": ["https://your-app.com", "https://dashboard.your-app.com"],
  "allowCredentials": true
}' ~/.secureclaw/secureclaw.json > temp.json && mv temp.json ~/.secureclaw/secureclaw.json
```

**⚠️ Avoid:**

```json
{
  "allowedOrigins": ["*"] // NEVER use in production!
}
```

**Validation:**

- [ ] Only legitimate origins allowed
- [ ] Wildcard origins not used
- [ ] Test CORS with browser DevTools
- [ ] Verify preflight requests work

---

## Operational Readiness

### 9. Test Backup/Restore Procedures

**Why:** Ensure you can recover from data loss or system failure.

**Validation:**

```bash
# Create test backup
~/scripts/secureclaw-backup.sh daily

# Verify backup exists
ls -lah ~/backups/secureclaw/

# Test restore in isolated environment
~/scripts/secureclaw-validate-restore.sh

# Document backup location
echo "Backups stored in: ~/backups/secureclaw/" >> ~/RUNBOOK.md
```

**Checklist:**

- [ ] Backup script exists and is executable
- [ ] Automated backups configured (cron/systemd)
- [ ] Backup includes all critical data
- [ ] Restore script tested successfully
- [ ] Backup verification passes
- [ ] Backup location documented
- [ ] Recovery procedures documented
- [ ] Team knows how to restore

**See:** [Backup & Restore Guide](/operations/backup-restore) for full procedures

---

### 10. Set Up Monitoring and Alerts

**Why:** Detect and respond to issues before users are impacted.

**Required Monitoring:**

#### Health Endpoint Monitoring

```bash
# Add to monitoring system (Prometheus, Datadog, etc.)
curl http://localhost:8080/health

# Expected response:
# {"status":"ok","uptime":12345,"channels":{"whatsapp":"connected"}}
```

#### Resource Monitoring

```bash
# Monitor CPU, memory, disk
# Alert if:
# - CPU > 80% for 5 minutes
# - Memory > 90% for 5 minutes
# - Disk > 85%
```

#### Log Monitoring

```bash
# Monitor gateway logs for errors
tail -f ~/.secureclaw/logs/gateway.log | grep -i "error\|warn\|fatal"

# Alert on:
# - "FATAL" level logs
# - "ERROR" level logs (> 10/minute)
# - "Channel disconnected" messages
```

**Validation:**

- [ ] Health endpoint monitored (1 min interval)
- [ ] Resource usage monitored
- [ ] Log aggregation configured
- [ ] Alert channels configured (PagerDuty, Slack, email)
- [ ] Alert thresholds set appropriately
- [ ] Test alerts by triggering conditions
- [ ] On-call rotation configured

**See:** [Gateway Health Endpoints](/gateway/health-endpoints) and [Alerting Thresholds](/gateway/alerting-thresholds)

---

### 11. Document Emergency Contacts

**Why:** Ensure rapid response during incidents.

**Required Documentation:**

Create `~/EMERGENCY_CONTACTS.md`:

```markdown
# Emergency Contacts

## On-Call Rotation

- **Primary:** Name - phone - email
- **Secondary:** Name - phone - email
- **Manager:** Name - phone - email

## External Contacts

- **Cloud Provider:** AWS Support - 1-800-xxx-xxxx
- **DNS Provider:** Cloudflare - support@cloudflare.com
- **Security Team:** security@company.com - Slack: #security

## Escalation Path

1. On-call engineer (0-15 min)
2. Team lead (15-30 min)
3. Engineering manager (30-60 min)

## Communication Channels

- **Incidents:** Slack #incidents
- **Status Page:** https://status.company.com
- **Team Chat:** Slack #secureclaw-team

## Access

- **Server SSH:** ssh user@production.company.com
- **Cloud Console:** https://console.aws.amazon.com/...
- **Monitoring Dashboard:** https://monitoring.company.com/...
```

**Validation:**

- [ ] Contact list created and up-to-date
- [ ] Phone numbers verified
- [ ] Email addresses verified
- [ ] Slack channels exist and team has access
- [ ] Access credentials documented securely
- [ ] Team knows where to find contacts

---

### 12. Run `secureclaw doctor --deep`

**Why:** Comprehensive validation of configuration, dependencies, and system health.

**Execute:**

```bash
# Run deep diagnostics
secureclaw doctor --deep

# Save output for documentation
secureclaw doctor --deep > ~/pre-deploy-doctor-report.txt
```

**Expected Output:**

```
✅ Configuration
  ✓ Config file exists and valid JSON
  ✓ Gateway token is secure (not default)
  ✓ TLS configured correctly
  ✓ Rate limiting enabled

✅ Dependencies
  ✓ Node.js version: v20.11.0
  ✓ npm packages up to date
  ✓ Required system tools installed

✅ Security
  ✓ File permissions correct
  ✓ No hardcoded secrets detected
  ✓ Security Coach configured
  ✓ allowInsecureAuth: false

✅ Channels
  ✓ WhatsApp: connected
  ✓ Telegram: connected
  ✓ Slack: connected

✅ Storage
  ✓ Disk space: 45GB available
  ✓ Backup directory exists
  ✓ Log rotation configured

✅ Network
  ✓ Port 8080 available
  ✓ DNS resolution working
  ✓ Outbound connectivity OK
```

**Validation:**

- [ ] All checks pass
- [ ] No errors or warnings
- [ ] Configuration validated
- [ ] Dependencies satisfied
- [ ] Security checks pass
- [ ] Channels functioning
- [ ] Resources adequate

**If Any Checks Fail:**

1. Review error messages
2. Fix identified issues
3. Re-run `secureclaw doctor --deep`
4. Do not proceed until all checks pass

---

## Pre-Deployment Validation

### Final Checklist

Complete this checklist immediately before deployment:

#### Security

- [ ] Gateway token is secure (not default)
- [ ] TLS enabled or reverse proxy configured
- [ ] Trusted proxies configured
- [ ] Rate limits set appropriately
- [ ] Security Coach enabled and tested
- [ ] SIEM integration working (if applicable)
- [ ] allowInsecureAuth set to false
- [ ] CORS origins restricted
- [ ] No hardcoded secrets in config
- [ ] File permissions correct (600 for sensitive files)

#### Configuration

- [ ] Configuration validated (`jq . secureclaw.json`)
- [ ] Environment variables set
- [ ] Channels configured correctly
- [ ] Agent settings reviewed
- [ ] Logging configured
- [ ] Timezone set correctly

#### Operational

- [ ] Backup script configured and tested
- [ ] Restore procedure documented and tested
- [ ] Monitoring configured and tested
- [ ] Alerts configured and tested
- [ ] Emergency contacts documented
- [ ] Runbook created
- [ ] Team trained on procedures

#### Testing

- [ ] `secureclaw doctor --deep` passes
- [ ] Gateway starts successfully
- [ ] All channels connect
- [ ] Test messages send/receive
- [ ] Security Coach blocks threats
- [ ] Rate limiting works
- [ ] Health endpoints respond
- [ ] Logs are written correctly

#### Documentation

- [ ] Configuration documented
- [ ] Architecture diagram created
- [ ] Runbook updated
- [ ] Emergency procedures documented
- [ ] Team access documented
- [ ] Monitoring dashboard documented

---

## Post-Deployment Validation

After deployment, verify everything is working:

### Immediate Checks (0-15 minutes)

```bash
# 1. Gateway is running
ps aux | grep secureclaw
systemctl status secureclaw-gateway

# 2. Health endpoint responds
curl https://your-domain.com/health

# 3. Channels connected
curl -H "Authorization: Bearer $TOKEN" https://your-domain.com/api/channels

# 4. Logs are clean
tail -n 50 ~/.secureclaw/logs/gateway.log | grep -i error

# 5. Resources normal
top -p $(pgrep -f secureclaw)
```

### First Hour Checks

- [ ] Send test messages to each channel
- [ ] Verify message delivery
- [ ] Check conversation history
- [ ] Monitor error rates
- [ ] Verify backup ran
- [ ] Check monitoring dashboard

### First Day Checks

- [ ] Review all logs
- [ ] Check resource usage trends
- [ ] Verify automated backups
- [ ] Test disaster recovery procedure
- [ ] Collect user feedback
- [ ] Review security events

### First Week Checks

- [ ] Review performance metrics
- [ ] Analyze error patterns
- [ ] Tune rate limits if needed
- [ ] Update documentation
- [ ] Schedule post-deployment review

---

## Rollback Procedures

If deployment fails or critical issues arise:

### Quick Rollback

```bash
# 1. Stop new gateway
sudo systemctl stop secureclaw-gateway

# 2. Restore previous version
cp ~/.secureclaw/secureclaw.json.bak ~/.secureclaw/secureclaw.json

# 3. Restart previous version
sudo systemctl start secureclaw-gateway

# 4. Verify rollback
curl http://localhost:8080/health
```

### Full Rollback

```bash
# 1. Stop gateway
sudo systemctl stop secureclaw-gateway

# 2. Restore from pre-deploy backup
~/scripts/secureclaw-restore.sh ~/backups/secureclaw/pre-deploy_*/

# 3. Restart gateway
sudo systemctl start secureclaw-gateway

# 4. Validate rollback
~/scripts/secureclaw-validate-restore.sh
```

---

## Maintenance Windows

### Recommended Maintenance Schedule

| Task            | Frequency | Duration | User Impact        |
| --------------- | --------- | -------- | ------------------ |
| Gateway restart | Weekly    | 30 sec   | Minimal            |
| Package updates | Monthly   | 5 min    | Brief interruption |
| Major upgrades  | Quarterly | 30 min   | Planned downtime   |
| DR testing      | Quarterly | 2 hours  | None (test env)    |

### Maintenance Notification Template

```
🔧 MAINTENANCE: SecureClaw Gateway Update

Schedule: 2026-02-15 02:00-02:30 UTC (30 minutes)
Impact: Brief service interruption (~5 minutes)

Updates:
- Security patches
- Performance improvements
- Bug fixes

During maintenance:
- Messages may be delayed
- Gateway will be briefly unavailable
- Channels will reconnect automatically

Questions? Contact: ops@company.com
```

---

## Related Documentation

- [Backup & Restore Guide](/operations/backup-restore) - Backup procedures
- [Disaster Recovery Plan](/operations/disaster-recovery) - Incident response
- [Configuration Reference](/gateway/configuration-reference) - All config options
- [Security Coach](/security-coach) - Threat detection configuration
- [Gateway Health Endpoints](/gateway/health-endpoints) - Monitoring setup

---

## Support

- **Documentation:** https://docs.secureclaw.app
- **GitHub Issues:** https://github.com/mbhatt1/secureclaw/issues
- **Discord:** https://discord.gg/secureclaw
- **Security Issues:** security@secureclaw.app

---

## Appendix: Quick Reference Commands

```bash
# Validate configuration
jq . ~/.secureclaw/secureclaw.json

# Run diagnostics
secureclaw doctor --deep

# Start gateway
secureclaw gateway

# Check health
curl http://localhost:8080/health

# View logs
tail -f ~/.secureclaw/logs/gateway.log

# Create backup
~/scripts/secureclaw-backup.sh pre-deploy

# Restore from backup
~/scripts/secureclaw-restore.sh /path/to/backup

# Test Security Coach
secureclaw agent --message "rm -rf /"

# Restart gateway
sudo systemctl restart secureclaw-gateway
```

---

**Production deployment is a serious responsibility. Take the time to complete this checklist thoroughly. Your users depend on it.**
