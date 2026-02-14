---
title: "Disaster Recovery Plan"
description: "Comprehensive disaster recovery procedures for SecureClaw production systems"
---

# Disaster Recovery Plan

## Overview

This document outlines the disaster recovery (DR) procedures for SecureClaw production systems. It covers failure scenarios, recovery procedures, and incident response workflows.

## Recovery Objectives

- **Recovery Time Objective (RTO):** < 15 minutes
- **Recovery Point Objective (RPO):** < 1 hour
- **Maximum Tolerable Downtime (MTD):** 4 hours

## Failure Scenarios & Recovery Procedures

### Scenario 1: Gateway Process Crash

**Symptoms:**

- Gateway not responding
- Channels disconnected
- No new messages processed
- Health endpoints return 503

**Detection:**

```bash
# Check if gateway is running
ps aux | grep "secureclaw.*gateway"

# Check health endpoint
curl http://localhost:8080/health
```

**Recovery Steps:**

1. **Verify Process State**

   ```bash
   # Check for zombie processes
   ps aux | grep secureclaw

   # Check system logs
   journalctl -u secureclaw-gateway -n 100

   # Check gateway logs
   tail -n 100 ~/.secureclaw/logs/gateway.log
   ```

2. **Identify Root Cause**

   ```bash
   # Check for common issues

   # Out of memory?
   dmesg | grep -i "out of memory"

   # Port conflict?
   lsof -i :8080

   # Permission issues?
   ls -la ~/.secureclaw/
   ```

3. **Restart Gateway**

   ```bash
   # Clean restart
   pkill -f "secureclaw.*gateway"
   sleep 2

   # Start with logging
   secureclaw gateway 2>&1 | tee -a ~/gateway-restart.log
   ```

4. **Validate Recovery**

   ```bash
   # Check health
   curl http://localhost:8080/health

   # Check channels
   curl http://localhost:8080/api/channels

   # Send test message
   secureclaw agent --agent main --message "health check"
   ```

**Expected RTO:** < 5 minutes

**Prevention:**

- Enable process monitoring (systemd, PM2, supervisord)
- Set up automatic restart on failure
- Configure memory limits and monitoring
- Use `--max-old-space-size` for Node.js memory

---

### Scenario 2: Data Corruption

**Symptoms:**

- Gateway fails to start
- Configuration load errors
- "Corrupted file" errors in logs
- JSON parse errors

**Detection:**

```bash
# Validate configuration JSON
jq . ~/.secureclaw/secureclaw.json

# Check file integrity
ls -la ~/.secureclaw/secureclaw.json
cat ~/.secureclaw/secureclaw.json | head -20
```

**Recovery Steps:**

1. **Isolate Corrupted Files**

   ```bash
   # Move corrupted config aside
   mv ~/.secureclaw/secureclaw.json ~/.secureclaw/secureclaw.json.corrupted

   # Check for backups
   ls -la ~/.secureclaw/*.bak
   ```

2. **Restore from Backup**

   ```bash
   # Option A: Use automatic backup
   cp ~/.secureclaw/secureclaw.json.bak ~/.secureclaw/secureclaw.json

   # Option B: Restore from backup script
   ~/scripts/secureclaw-restore.sh /path/to/latest/backup

   # Option C: Restore from cloud backup
   aws s3 cp s3://backups/secureclaw/latest.tar.gz .
   tar xzf latest.tar.gz
   cp backup/secureclaw.json ~/.secureclaw/
   ```

3. **Validate Restored Configuration**

   ```bash
   # Validate JSON syntax
   jq . ~/.secureclaw/secureclaw.json

   # Run config validation
   secureclaw doctor --deep
   ```

4. **Restart Gateway**
   ```bash
   secureclaw gateway
   ```

**Expected RTO:** < 10 minutes

**Prevention:**

- Automatic configuration backups before changes
- Use atomic writes for configuration updates
- Enable filesystem journaling
- Regular backup verification

---

### Scenario 3: Channel Disconnection

**Symptoms:**

- Specific channel(s) offline
- Authentication errors
- "Session expired" warnings
- Messages not sending/receiving

**Detection:**

```bash
# Check channel status
curl http://localhost:8080/api/channels

# Check channel-specific logs
tail -f ~/.secureclaw/logs/gateway.log | grep -i "whatsapp\|telegram\|slack"
```

**Recovery Steps:**

#### For WhatsApp:

1. **Check Connection Status**

   ```bash
   # View WhatsApp status in logs
   tail -f ~/.secureclaw/logs/gateway.log | grep -i whatsapp
   ```

2. **Attempt Automatic Reconnection**

   ```bash
   # Gateway should auto-reconnect
   # Wait 2-5 minutes for reconnection
   # Check status:
   curl http://localhost:8080/api/channels/whatsapp/status
   ```

3. **Manual Reconnection**

   ```bash
   # If auto-reconnect fails, relink
   secureclaw channel:whatsapp link
   # Scan QR code with WhatsApp mobile app
   ```

4. **Restore Session from Backup** (if relinking fails)

   ```bash
   # Stop gateway
   pkill -f "secureclaw.*gateway"

   # Restore WhatsApp credentials
   rm -rf ~/.secureclaw/credentials/whatsapp
   cp -a /path/to/backup/credentials/whatsapp ~/.secureclaw/credentials/

   # Restart gateway
   secureclaw gateway
   ```

#### For Telegram:

1. **Check Bot Token**

   ```bash
   # Verify token in config
   jq '.channels.telegram.botToken' ~/.secureclaw/secureclaw.json
   ```

2. **Test Token Validity**

   ```bash
   # Test with Telegram API
   BOT_TOKEN="your-bot-token"
   curl "https://api.telegram.org/bot${BOT_TOKEN}/getMe"
   ```

3. **Reconnect**
   ```bash
   # Restart gateway to trigger reconnection
   pkill -f "secureclaw.*gateway"
   secureclaw gateway
   ```

#### For Slack:

1. **Check OAuth Token**

   ```bash
   # Verify token exists
   jq '.channels.slack.token' ~/.secureclaw/secureclaw.json
   ```

2. **Refresh Token** (if expired)
   ```bash
   # Re-authorize with Slack OAuth
   secureclaw channel:slack setup
   # Follow OAuth flow in browser
   ```

**Expected RTO:** < 5 minutes (auto-reconnect), < 10 minutes (manual)

**Prevention:**

- Configure reconnection settings with exponential backoff
- Monitor channel health endpoints
- Set up alerting for channel disconnections
- Keep backup credentials and tokens

---

### Scenario 4: Database/Session Loss

**Symptoms:**

- All conversation history lost
- Agents don't remember context
- "No session found" errors
- Empty session directories

**Detection:**

```bash
# Check session files
ls -la ~/.secureclaw/agents/*/sessions/

# Check session count
find ~/.secureclaw/agents -name "*.json" -type f | wc -l
```

**Recovery Steps:**

1. **Verify Data Loss Scope**

   ```bash
   # Check all agent session directories
   for agent in ~/.secureclaw/agents/*; do
     echo "Agent: $(basename $agent)"
     echo "  Sessions: $(ls $agent/sessions 2>/dev/null | wc -l)"
   done
   ```

2. **Restore from Backup**

   ```bash
   # Stop gateway to prevent conflicts
   pkill -f "secureclaw.*gateway"

   # Restore sessions from latest backup
   LATEST_BACKUP=$(ls -t ~/backups/secureclaw/daily_*.tar.gz | head -1)
   tar xzf "${LATEST_BACKUP}"

   # Copy session data
   cp -a backup/agents/*/sessions ~/.secureclaw/agents/

   # Verify restore
   find ~/.secureclaw/agents -name "*.json" -type f | wc -l
   ```

3. **Restart Gateway**

   ```bash
   secureclaw gateway
   ```

4. **Validate Recovery**
   ```bash
   # Test agent memory
   secureclaw agent --agent main --message "What did we discuss last time?"
   ```

**Expected RTO:** < 15 minutes

**Expected RPO:** < 1 hour (depends on backup frequency)

**Prevention:**

- Hourly session backups in production
- Use reliable storage (EBS, persistent volumes)
- Enable filesystem snapshots
- Test restore procedures regularly

---

### Scenario 5: Complete System Failure

**Symptoms:**

- Server unreachable
- Hardware failure
- Datacenter outage
- Complete data loss

**Detection:**

```bash
# Server health check
ping your-server.com

# SSH connectivity
ssh user@your-server.com

# Cloud provider status
# Check AWS/GCP/Azure status pages
```

**Recovery Steps:**

1. **Assess Damage**
   - Determine if server is recoverable
   - Identify what data is lost
   - Check if backups are accessible

2. **Provision New Server**

   ```bash
   # Using cloud provider CLI

   # AWS example:
   aws ec2 run-instances \
     --image-id ami-12345678 \
     --instance-type t3.medium \
     --key-name your-key \
     --security-group-ids sg-12345678 \
     --subnet-id subnet-12345678 \
     --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=secureclaw-recovery}]'

   # GCP example:
   gcloud compute instances create secureclaw-recovery \
     --machine-type=n1-standard-2 \
     --zone=us-central1-a
   ```

3. **Install SecureClaw**

   ```bash
   # SSH to new server
   ssh user@new-server

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install SecureClaw
   npm install -g @secureclaw/cli
   ```

4. **Restore from Backup**

   ```bash
   # Download backup from cloud storage
   aws s3 cp s3://backups/secureclaw/latest.tar.gz.gpg .

   # Decrypt backup
   gpg --decrypt latest.tar.gz.gpg | tar xzf -

   # Restore data
   cp -a backup/* ~/.secureclaw/

   # Fix permissions
   chmod 700 ~/.secureclaw
   chmod 600 ~/.secureclaw/secureclaw.json
   chmod -R 600 ~/.secureclaw/credentials/*
   ```

5. **Update Configuration**

   ```bash
   # Update network configuration for new server
   jq '.gateway.host = "new-server.com"' ~/.secureclaw/secureclaw.json > temp.json
   mv temp.json ~/.secureclaw/secureclaw.json

   # Update DNS or load balancer to point to new server
   ```

6. **Start Gateway**

   ```bash
   # Start gateway
   secureclaw gateway

   # Enable as service
   sudo systemctl enable secureclaw-gateway
   sudo systemctl start secureclaw-gateway
   ```

7. **Validate Recovery**

   ```bash
   # Run full diagnostics
   secureclaw doctor --deep

   # Test all channels
   curl http://localhost:8080/api/channels

   # Send test messages to each channel
   ```

**Expected RTO:** < 2 hours (full recovery)

**Expected RPO:** < 1 hour (with hourly backups)

**Prevention:**

- Automate server provisioning (Terraform, CloudFormation)
- Store backups in geographically distributed locations
- Test disaster recovery procedures quarterly
- Document all infrastructure as code

---

## Incident Response Workflow

### Phase 1: Detection & Assessment (0-5 minutes)

1. **Receive Alert**
   - Monitoring system alert
   - User report
   - Health check failure

2. **Verify Incident**

   ```bash
   # Quick health checks
   curl http://localhost:8080/health
   ps aux | grep secureclaw
   tail -n 50 ~/.secureclaw/logs/gateway.log
   ```

3. **Assess Severity**
   - **P0 (Critical):** Complete outage, data loss, security breach
   - **P1 (High):** Partial outage, degraded performance
   - **P2 (Medium):** Single channel down, non-critical errors
   - **P3 (Low):** Minor issues, warnings

4. **Notify Stakeholders**
   - Post in incident channel (#incidents)
   - Page on-call engineer (P0/P1)
   - Update status page

### Phase 2: Containment (5-15 minutes)

1. **Stop Further Damage**

   ```bash
   # For security incidents: isolate system
   sudo iptables -A INPUT -j DROP

   # For data corruption: stop writes
   pkill -f "secureclaw.*gateway"
   ```

2. **Preserve Evidence**

   ```bash
   # Capture logs
   cp -a ~/.secureclaw/logs ~/incident-logs-$(date +%Y%m%d_%H%M%S)

   # Capture system state
   ps aux > ~/incident-ps.txt
   netstat -tulpn > ~/incident-netstat.txt
   dmesg > ~/incident-dmesg.txt
   ```

3. **Engage Response Team**
   - Incident commander
   - Technical lead
   - Communications lead

### Phase 3: Recovery (15-60 minutes)

1. **Execute Recovery Plan**
   - Follow scenario-specific recovery steps above
   - Document all actions taken
   - Track time to recovery

2. **Restore Service**

   ```bash
   # Restore from backup
   ~/scripts/secureclaw-restore.sh /path/to/backup

   # Start gateway
   secureclaw gateway

   # Validate recovery
   ~/scripts/secureclaw-validate-restore.sh
   ```

3. **Monitor Stability**

   ```bash
   # Watch logs for errors
   tail -f ~/.secureclaw/logs/gateway.log

   # Monitor resource usage
   watch -n 5 'ps aux | grep secureclaw'

   # Check channel status
   watch -n 10 'curl -s http://localhost:8080/api/channels | jq'
   ```

### Phase 4: Validation (30-90 minutes)

1. **Verify Full Functionality**
   - [ ] Gateway health checks pass
   - [ ] All channels connected
   - [ ] Messages sending/receiving
   - [ ] Agent responses working
   - [ ] Session data intact
   - [ ] Security Coach functional
   - [ ] Logs being written

2. **Performance Testing**

   ```bash
   # Test response time
   time curl http://localhost:8080/health

   # Test message throughput
   for i in {1..10}; do
     secureclaw agent --agent main --message "Test $i"
   done
   ```

3. **User Acceptance**
   - Test with real users
   - Verify no data loss
   - Check conversation continuity

### Phase 5: Post-Mortem (1-3 days after incident)

1. **Timeline Documentation**
   - Detection time
   - Response time
   - Resolution time
   - User impact

2. **Root Cause Analysis**
   - What failed?
   - Why did it fail?
   - Why wasn't it detected earlier?

3. **Action Items**
   - Immediate fixes
   - Long-term improvements
   - Process changes
   - Monitoring enhancements

4. **Post-Mortem Report Template**

   ```markdown
   # Incident Post-Mortem

   ## Incident Summary

   - **Date:** YYYY-MM-DD
   - **Duration:** X hours
   - **Severity:** P0/P1/P2/P3
   - **Impact:** X users affected, Y messages lost

   ## Timeline

   - 14:00 - Incident detected
   - 14:05 - Response team engaged
   - 14:15 - Root cause identified
   - 14:30 - Recovery initiated
   - 15:00 - Service restored
   - 15:30 - Validated and monitoring

   ## Root Cause

   [Detailed technical analysis]

   ## Resolution

   [What was done to fix it]

   ## Impact

   - Users affected: X
   - Messages lost: Y
   - Downtime: Z minutes

   ## Action Items

   - [ ] Immediate fix: [description] (Owner: @user, Due: date)
   - [ ] Monitoring: [description] (Owner: @user, Due: date)
   - [ ] Process: [description] (Owner: @user, Due: date)

   ## Lessons Learned

   - What went well
   - What could be improved
   - What surprised us
   ```

---

## Communication Templates

### Initial Incident Notification

```
🚨 INCIDENT: SecureClaw Gateway Outage

Severity: P0
Status: Investigating
Started: 2026-02-14 14:00 UTC

Issue: Gateway is not responding. All channels affected.

Current Actions:
- Response team engaged
- Investigating root cause
- ETA for update: 14:15 UTC

Affected: All users, all channels
```

### Status Update

```
📊 UPDATE: SecureClaw Gateway Outage

Severity: P0
Status: Identified
Time: 2026-02-14 14:15 UTC

Root Cause: Process crash due to memory exhaustion

Current Actions:
- Restarting with increased memory limits
- Restoring from backup
- ETA for resolution: 14:30 UTC

Next update: 14:30 UTC or when resolved
```

### Resolution Notification

```
✅ RESOLVED: SecureClaw Gateway Outage

Severity: P0
Status: Resolved
Duration: 30 minutes (14:00 - 14:30 UTC)

Resolution:
- Gateway restarted with increased memory
- All channels reconnected
- No data loss detected

Impact:
- 127 users affected
- ~200 messages delayed
- All messages now delivered

Next Steps:
- Monitoring for stability
- Post-mortem scheduled for 2026-02-15
- Action items to be shared by EOD
```

---

## Emergency Contacts

### On-Call Rotation

- **Primary:** [Name] - [Phone] - [Email]
- **Secondary:** [Name] - [Phone] - [Email]
- **Manager:** [Name] - [Phone] - [Email]

### Escalation Path

1. On-call engineer (0-15 min)
2. Team lead (15-30 min)
3. Engineering manager (30-60 min)
4. VP Engineering (60+ min, P0 only)

### External Contacts

- **Cloud Provider Support:** [Support URL/Phone]
- **DNS Provider:** [Support URL/Phone]
- **Security Team:** [Email/Slack]

---

## Testing & Drills

### Quarterly DR Test Checklist

- [ ] Simulate gateway crash and recovery
- [ ] Simulate data corruption and restore
- [ ] Simulate complete system failure
- [ ] Test backup restore procedures
- [ ] Verify communication channels work
- [ ] Validate emergency contacts are current
- [ ] Review and update runbook
- [ ] Time recovery procedures
- [ ] Document gaps and improvements

### Annual DR Review

- [ ] Review all disaster scenarios
- [ ] Update contact information
- [ ] Audit backup procedures
- [ ] Test encrypted backup decryption
- [ ] Verify cloud provider access
- [ ] Review RTO/RPO targets
- [ ] Update post-mortem template
- [ ] Train new team members

---

## Related Documentation

- [Backup & Restore Guide](/operations/backup-restore) - Detailed backup procedures
- [Production Deployment Checklist](/operations/production-checklist) - Pre-deploy validation
- [Gateway Health Endpoints](/gateway/health-endpoints) - Monitoring and health checks
- [Gateway Alerting Thresholds](/gateway/alerting-thresholds) - Alert configuration

---

## Support

- **Documentation:** https://docs.secureclaw.app
- **GitHub Issues:** https://github.com/mbhatt1/secureclaw/issues
- **Emergency Slack:** #secureclaw-incidents
- **Discord:** https://discord.gg/secureclaw
