---
title: "Backup & Restore Guide"
description: "Comprehensive guide to backing up and restoring SecureClaw data"
---

# Backup & Restore Guide

## Overview

SecureClaw stores critical data in `~/.secureclaw/`. This guide covers what to backup, when to backup, and how to restore in case of data loss or system migration.

## What to Backup

### Critical Data (Backup Before Every Deployment)

#### 1. Configuration Files

**Location:** `~/.secureclaw/secureclaw.json`

The main configuration file contains:

- Gateway settings (port, token, TLS)
- Channel configurations (WhatsApp, Telegram, Slack, etc.)
- Security Coach settings
- SIEM integration settings
- Agent configurations

**Backup frequency:** Before every configuration change, before every deployment

#### 2. Credentials

**Location:** `~/.secureclaw/credentials/`

Contains authentication data for all channels:

- WhatsApp session data
- Telegram API credentials
- Slack bot tokens
- Discord bot tokens
- Email OAuth tokens

**Backup frequency:** Before every deployment, daily for production

**⚠️ Security Note:** Credentials contain sensitive authentication tokens. Store backups in encrypted storage with restricted access (file permissions 600 or equivalent).

### Important Data (Daily Backups Recommended)

#### 3. Agent Sessions

**Location:** `~/.secureclaw/agents/*/sessions/`

Contains conversation history for all agents:

- Message history
- Conversation context
- User preferences
- Session state

**Backup frequency:** Daily for production, weekly for development

**Storage size:** Varies by usage (typically 10-100MB per agent)

#### 4. Agent State

**Location:** `~/.secureclaw/agents/*/state/`

Contains agent-specific state:

- Memory and context
- User data
- Agent preferences
- Plugin state

**Backup frequency:** Daily for production

#### 5. Workspace Files

**Location:** `~/.secureclaw/workspace/`

Contains files created or modified by agents:

- Generated code
- Documents
- Analysis results
- Temporary files

**Backup frequency:** Weekly for production, or on-demand before major operations

### Optional Data (Weekly Backups or On-Demand)

#### 6. Logs

**Location:** `~/.secureclaw/logs/`

Contains debugging and audit logs:

- Gateway logs
- Channel logs
- Error logs
- SIEM audit logs (if configured)

**Backup frequency:** Weekly, or on-demand for incident investigation

**Storage size:** Can grow large (100MB-1GB+)

**Retention:** Keep 30-90 days of logs, archive older logs

#### 7. Internal State

**Location:** `~/.secureclaw/state/`

Contains internal gateway state:

- Queue state
- Health check data
- Temporary state

**Backup frequency:** Optional, recreates on restart

## Backup Frequency Recommendations

| Data Type     | Development | Production    | Critical Systems    |
| ------------- | ----------- | ------------- | ------------------- |
| Configuration | On change   | Before deploy | Before every change |
| Credentials   | Weekly      | Daily         | Before every deploy |
| Sessions      | On-demand   | Daily         | Every 6 hours       |
| Workspace     | On-demand   | Weekly        | Daily               |
| Logs          | Never       | Weekly        | Daily               |
| State         | Never       | Optional      | Weekly              |

### Recovery Objectives

- **Recovery Time Objective (RTO):** < 15 minutes
- **Recovery Point Objective (RPO):** < 1 hour for critical systems

## Automated Backup Script

### Basic Backup Script

```bash
#!/bin/bash
# SecureClaw Backup Script
# Save as: ~/scripts/secureclaw-backup.sh
# Usage: ./secureclaw-backup.sh [daily|weekly|pre-deploy]

set -euo pipefail

# Configuration
SECURECLAW_DIR="${HOME}/.secureclaw"
BACKUP_ROOT="${BACKUP_ROOT:-${HOME}/backups/secureclaw}"
BACKUP_TYPE="${1:-daily}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_ROOT}/${BACKUP_TYPE}_${TIMESTAMP}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "Starting SecureClaw backup: ${BACKUP_TYPE}"
echo "Backup location: ${BACKUP_DIR}"

# Function to backup with verification
backup_path() {
  local src="$1"
  local dest="$2"

  if [ -e "${src}" ]; then
    echo "Backing up: ${src}"
    cp -a "${src}" "${dest}"
    echo "  ✓ Backed up to: ${dest}"
  else
    echo "  ⚠ Warning: ${src} does not exist, skipping"
  fi
}

# Always backup configuration
backup_path "${SECURECLAW_DIR}/secureclaw.json" "${BACKUP_DIR}/"

# Always backup credentials (CRITICAL)
if [ -d "${SECURECLAW_DIR}/credentials" ]; then
  backup_path "${SECURECLAW_DIR}/credentials" "${BACKUP_DIR}/"
else
  echo "  ⚠ Warning: No credentials directory found"
fi

# Backup type-specific data
case "${BACKUP_TYPE}" in
  daily|pre-deploy)
    # Backup sessions
    if [ -d "${SECURECLAW_DIR}/agents" ]; then
      echo "Backing up agent sessions..."
      mkdir -p "${BACKUP_DIR}/agents"
      for agent_dir in "${SECURECLAW_DIR}"/agents/*; do
        if [ -d "${agent_dir}/sessions" ]; then
          agent_name=$(basename "${agent_dir}")
          backup_path "${agent_dir}/sessions" "${BACKUP_DIR}/agents/${agent_name}/"
        fi
      done
    fi

    # Backup state
    backup_path "${SECURECLAW_DIR}/state" "${BACKUP_DIR}/"
    ;;

  weekly)
    # Full backup including workspace and logs
    backup_path "${SECURECLAW_DIR}/agents" "${BACKUP_DIR}/"
    backup_path "${SECURECLAW_DIR}/workspace" "${BACKUP_DIR}/"
    backup_path "${SECURECLAW_DIR}/logs" "${BACKUP_DIR}/"
    backup_path "${SECURECLAW_DIR}/state" "${BACKUP_DIR}/"
    ;;

  *)
    echo "Unknown backup type: ${BACKUP_TYPE}"
    echo "Usage: $0 [daily|weekly|pre-deploy]"
    exit 1
    ;;
esac

# Create backup manifest
cat > "${BACKUP_DIR}/manifest.txt" <<EOF
SecureClaw Backup
=================
Backup Type: ${BACKUP_TYPE}
Timestamp: ${TIMESTAMP}
Date: $(date)
Hostname: $(hostname)
SecureClaw Version: $(secureclaw --version 2>/dev/null || echo "unknown")

Backed up directories:
$(ls -lah "${BACKUP_DIR}")

Backup size: $(du -sh "${BACKUP_DIR}" | cut -f1)
EOF

# Set secure permissions on backup
chmod 700 "${BACKUP_DIR}"
if [ -d "${BACKUP_DIR}/credentials" ]; then
  chmod -R 600 "${BACKUP_DIR}/credentials"/*
fi

# Compress backup (optional)
if command -v tar &> /dev/null; then
  echo "Compressing backup..."
  tar czf "${BACKUP_DIR}.tar.gz" -C "${BACKUP_ROOT}" "$(basename "${BACKUP_DIR}")"
  chmod 600 "${BACKUP_DIR}.tar.gz"
  echo "  ✓ Compressed to: ${BACKUP_DIR}.tar.gz"
fi

# Cleanup old backups (keep last 7 daily, 4 weekly, 3 pre-deploy)
case "${BACKUP_TYPE}" in
  daily)
    KEEP_COUNT=7
    ;;
  weekly)
    KEEP_COUNT=4
    ;;
  pre-deploy)
    KEEP_COUNT=3
    ;;
esac

echo "Cleaning up old ${BACKUP_TYPE} backups (keeping ${KEEP_COUNT})..."
ls -dt "${BACKUP_ROOT}/${BACKUP_TYPE}_"* 2>/dev/null | tail -n +$((KEEP_COUNT + 1)) | xargs -r rm -rf

echo ""
echo "✅ Backup complete!"
echo "Backup location: ${BACKUP_DIR}"
echo "Compressed backup: ${BACKUP_DIR}.tar.gz"
echo ""
echo "To restore: ./secureclaw-restore.sh ${BACKUP_DIR}"
```

### Production Backup Script (with encryption)

```bash
#!/bin/bash
# SecureClaw Production Backup with Encryption
# Requires: gpg or age for encryption

set -euo pipefail

# Configuration
SECURECLAW_DIR="${HOME}/.secureclaw"
BACKUP_ROOT="${BACKUP_ROOT:-${HOME}/backups/secureclaw}"
BACKUP_TYPE="${1:-daily}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_ROOT}/${BACKUP_TYPE}_${TIMESTAMP}"
ENCRYPTION_KEY="${SECURECLAW_BACKUP_KEY:-}"

# Check encryption key
if [ -z "${ENCRYPTION_KEY}" ]; then
  echo "❌ Error: SECURECLAW_BACKUP_KEY environment variable not set"
  echo "Set with: export SECURECLAW_BACKUP_KEY='your-gpg-key-id'"
  exit 1
fi

# Create backup (same as basic script above)
# ... (include backup logic from basic script) ...

# Encrypt backup
echo "Encrypting backup..."
if command -v gpg &> /dev/null; then
  tar czf - -C "${BACKUP_ROOT}" "$(basename "${BACKUP_DIR}")" | \
    gpg --encrypt --recipient "${ENCRYPTION_KEY}" \
        --output "${BACKUP_DIR}.tar.gz.gpg"

  # Verify encryption
  if gpg --list-packets "${BACKUP_DIR}.tar.gz.gpg" &> /dev/null; then
    echo "  ✓ Encrypted backup: ${BACKUP_DIR}.tar.gz.gpg"
    # Remove unencrypted backup
    rm -rf "${BACKUP_DIR}" "${BACKUP_DIR}.tar.gz"
  else
    echo "  ❌ Encryption verification failed"
    exit 1
  fi
elif command -v age &> /dev/null; then
  tar czf - -C "${BACKUP_ROOT}" "$(basename "${BACKUP_DIR}")" | \
    age -r "${ENCRYPTION_KEY}" > "${BACKUP_DIR}.tar.gz.age"

  echo "  ✓ Encrypted backup: ${BACKUP_DIR}.tar.gz.age"
  rm -rf "${BACKUP_DIR}" "${BACKUP_DIR}.tar.gz"
else
  echo "  ❌ No encryption tool found (gpg or age required)"
  exit 1
fi

echo "✅ Encrypted backup complete!"
```

## Restore Procedures

### Basic Restore

```bash
#!/bin/bash
# SecureClaw Restore Script
# Save as: ~/scripts/secureclaw-restore.sh
# Usage: ./secureclaw-restore.sh /path/to/backup

set -euo pipefail

BACKUP_SOURCE="$1"
SECURECLAW_DIR="${HOME}/.secureclaw"

if [ ! -e "${BACKUP_SOURCE}" ]; then
  echo "❌ Error: Backup source does not exist: ${BACKUP_SOURCE}"
  exit 1
fi

# Stop SecureClaw gateway if running
echo "Stopping SecureClaw gateway..."
pkill -f "secureclaw.*gateway" || true
sleep 2

# Create backup of current state (just in case)
if [ -d "${SECURECLAW_DIR}" ]; then
  CURRENT_BACKUP="${HOME}/backups/secureclaw/pre-restore_$(date +%Y%m%d_%H%M%S)"
  echo "Creating backup of current state: ${CURRENT_BACKUP}"
  mkdir -p "${CURRENT_BACKUP}"
  cp -a "${SECURECLAW_DIR}" "${CURRENT_BACKUP}/"
fi

# Extract backup if compressed
if [[ "${BACKUP_SOURCE}" == *.tar.gz ]]; then
  echo "Extracting backup archive..."
  TEMP_DIR=$(mktemp -d)
  tar xzf "${BACKUP_SOURCE}" -C "${TEMP_DIR}"
  BACKUP_DIR="${TEMP_DIR}/$(ls "${TEMP_DIR}")"
elif [[ "${BACKUP_SOURCE}" == *.tar.gz.gpg ]]; then
  echo "Decrypting and extracting backup..."
  TEMP_DIR=$(mktemp -d)
  gpg --decrypt "${BACKUP_SOURCE}" | tar xzf - -C "${TEMP_DIR}"
  BACKUP_DIR="${TEMP_DIR}/$(ls "${TEMP_DIR}")"
else
  BACKUP_DIR="${BACKUP_SOURCE}"
fi

# Restore configuration
if [ -f "${BACKUP_DIR}/secureclaw.json" ]; then
  echo "Restoring configuration..."
  cp -a "${BACKUP_DIR}/secureclaw.json" "${SECURECLAW_DIR}/"
  chmod 600 "${SECURECLAW_DIR}/secureclaw.json"
  echo "  ✓ Configuration restored"
fi

# Restore credentials
if [ -d "${BACKUP_DIR}/credentials" ]; then
  echo "Restoring credentials..."
  rm -rf "${SECURECLAW_DIR}/credentials"
  cp -a "${BACKUP_DIR}/credentials" "${SECURECLAW_DIR}/"
  chmod -R 600 "${SECURECLAW_DIR}/credentials"/*
  echo "  ✓ Credentials restored"
fi

# Restore agent sessions
if [ -d "${BACKUP_DIR}/agents" ]; then
  echo "Restoring agent sessions..."
  for agent_backup in "${BACKUP_DIR}"/agents/*; do
    if [ -d "${agent_backup}" ]; then
      agent_name=$(basename "${agent_backup}")
      mkdir -p "${SECURECLAW_DIR}/agents/${agent_name}"
      cp -a "${agent_backup}"/* "${SECURECLAW_DIR}/agents/${agent_name}/"
      echo "  ✓ Restored agent: ${agent_name}"
    fi
  done
fi

# Restore workspace
if [ -d "${BACKUP_DIR}/workspace" ]; then
  echo "Restoring workspace..."
  rm -rf "${SECURECLAW_DIR}/workspace"
  cp -a "${BACKUP_DIR}/workspace" "${SECURECLAW_DIR}/"
  echo "  ✓ Workspace restored"
fi

# Restore state
if [ -d "${BACKUP_DIR}/state" ]; then
  echo "Restoring state..."
  rm -rf "${SECURECLAW_DIR}/state"
  cp -a "${BACKUP_DIR}/state" "${SECURECLAW_DIR}/"
  echo "  ✓ State restored"
fi

# Cleanup temporary extraction
if [ -n "${TEMP_DIR:-}" ]; then
  rm -rf "${TEMP_DIR}"
fi

echo ""
echo "✅ Restore complete!"
echo ""
echo "Next steps:"
echo "1. Verify configuration: cat ~/.secureclaw/secureclaw.json"
echo "2. Run diagnostics: secureclaw doctor"
echo "3. Start gateway: secureclaw gateway"
echo "4. Test channel connections"
```

### Validation After Restore

After restoring from backup, validate the restore was successful:

```bash
#!/bin/bash
# SecureClaw Restore Validation
# Save as: ~/scripts/secureclaw-validate-restore.sh

set -euo pipefail

SECURECLAW_DIR="${HOME}/.secureclaw"
VALIDATION_FAILED=0

echo "Validating SecureClaw restore..."
echo ""

# Check configuration
if [ -f "${SECURECLAW_DIR}/secureclaw.json" ]; then
  echo "✓ Configuration file exists"
  if jq . "${SECURECLAW_DIR}/secureclaw.json" &> /dev/null; then
    echo "✓ Configuration is valid JSON"
  else
    echo "❌ Configuration is not valid JSON"
    VALIDATION_FAILED=1
  fi
else
  echo "❌ Configuration file missing"
  VALIDATION_FAILED=1
fi

# Check credentials
if [ -d "${SECURECLAW_DIR}/credentials" ]; then
  echo "✓ Credentials directory exists"
  CRED_COUNT=$(find "${SECURECLAW_DIR}/credentials" -type f | wc -l)
  echo "  Found ${CRED_COUNT} credential files"
else
  echo "⚠ Credentials directory missing"
fi

# Check agent sessions
if [ -d "${SECURECLAW_DIR}/agents" ]; then
  AGENT_COUNT=$(ls -1 "${SECURECLAW_DIR}/agents" | wc -l)
  echo "✓ Found ${AGENT_COUNT} agent(s)"
else
  echo "⚠ No agents directory found"
fi

# Run secureclaw doctor
echo ""
echo "Running secureclaw doctor..."
if secureclaw doctor; then
  echo "✓ SecureClaw doctor check passed"
else
  echo "❌ SecureClaw doctor check failed"
  VALIDATION_FAILED=1
fi

# Test gateway start (dry run)
echo ""
echo "Testing gateway configuration..."
if secureclaw gateway --validate-config; then
  echo "✓ Gateway configuration valid"
else
  echo "❌ Gateway configuration invalid"
  VALIDATION_FAILED=1
fi

echo ""
if [ ${VALIDATION_FAILED} -eq 0 ]; then
  echo "✅ All validation checks passed!"
  exit 0
else
  echo "❌ Some validation checks failed"
  echo "Review errors above and check logs: ~/.secureclaw/logs/gateway.log"
  exit 1
fi
```

## Common Restore Issues and Fixes

### Issue 1: Permission Denied Errors

**Symptoms:**

- Cannot read configuration files
- Channel authentication fails
- Gateway won't start

**Fix:**

```bash
# Fix permissions
chmod 700 ~/.secureclaw
chmod 600 ~/.secureclaw/secureclaw.json
chmod -R 600 ~/.secureclaw/credentials/*
```

### Issue 2: Corrupted Configuration

**Symptoms:**

- Gateway fails to start
- JSON parse errors
- Invalid configuration warnings

**Fix:**

```bash
# Validate JSON
jq . ~/.secureclaw/secureclaw.json

# If invalid, restore from backup
cp ~/.secureclaw/secureclaw.json.bak ~/.secureclaw/secureclaw.json

# Or reset to defaults
secureclaw config --reset
```

### Issue 3: Missing Credentials

**Symptoms:**

- Channel fails to connect
- Authentication errors
- "No session found" errors

**Fix:**

```bash
# Check if credentials exist
ls -la ~/.secureclaw/credentials/

# Restore credentials from backup
cp -a /path/to/backup/credentials ~/.secureclaw/

# Or re-authenticate channels
secureclaw channel:whatsapp link
secureclaw channel:telegram setup
```

### Issue 4: Incomplete Session Data

**Symptoms:**

- Missing conversation history
- Agent doesn't remember previous context
- Empty session files

**Fix:**

```bash
# Restore sessions from backup
cp -a /path/to/backup/agents/*/sessions ~/.secureclaw/agents/

# Or accept data loss and start fresh
rm -rf ~/.secureclaw/agents/*/sessions
# Sessions will recreate on next conversation
```

## Testing Backup/Restore

### Development Environment Test

Test your backup/restore procedures in a development environment before relying on them in production:

```bash
#!/bin/bash
# Test backup/restore in dev environment

set -euo pipefail

echo "Testing SecureClaw backup/restore..."

# 1. Create test data
echo "1. Creating test configuration..."
mkdir -p ~/.secureclaw-test
cat > ~/.secureclaw-test/secureclaw.json <<EOF
{
  "gateway": {
    "port": 8080,
    "token": "test-token-12345"
  }
}
EOF

# 2. Run backup
echo "2. Running backup..."
SECURECLAW_DIR=~/.secureclaw-test ./secureclaw-backup.sh daily

# 3. Destroy test data
echo "3. Destroying test data..."
rm -rf ~/.secureclaw-test

# 4. Restore from backup
echo "4. Restoring from backup..."
LATEST_BACKUP=$(ls -t ~/backups/secureclaw/daily_*.tar.gz | head -1)
SECURECLAW_DIR=~/.secureclaw-test ./secureclaw-restore.sh "${LATEST_BACKUP}"

# 5. Verify restore
echo "5. Verifying restore..."
if [ -f ~/.secureclaw-test/secureclaw.json ]; then
  echo "✓ Configuration restored successfully"
  if grep -q "test-token-12345" ~/.secureclaw-test/secureclaw.json; then
    echo "✓ Configuration content matches"
  else
    echo "❌ Configuration content mismatch"
    exit 1
  fi
else
  echo "❌ Configuration restore failed"
  exit 1
fi

# Cleanup
rm -rf ~/.secureclaw-test

echo ""
echo "✅ Backup/restore test passed!"
```

### Production Validation Checklist

Before trusting your backup/restore procedures in production:

- [ ] Test backup script in development
- [ ] Test restore script in development
- [ ] Verify encrypted backups can be decrypted
- [ ] Test restore from 1-day-old backup
- [ ] Test restore from 1-week-old backup
- [ ] Document backup storage location and access
- [ ] Test restore on clean system (VM or container)
- [ ] Verify channel authentication after restore
- [ ] Verify conversation history after restore
- [ ] Document time to complete restore (RTO)
- [ ] Set up automated backup monitoring
- [ ] Test backup integrity verification

## Automated Backup Setup

### Cron Job (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/user/scripts/secureclaw-backup.sh daily 2>&1 | logger -t secureclaw-backup

# Add weekly backup on Sunday at 3 AM
0 3 * * 0 /home/user/scripts/secureclaw-backup.sh weekly 2>&1 | logger -t secureclaw-backup
```

### Systemd Timer (Linux)

```ini
# /etc/systemd/system/secureclaw-backup.timer
[Unit]
Description=SecureClaw Daily Backup

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/secureclaw-backup.service
[Unit]
Description=SecureClaw Backup Service

[Service]
Type=oneshot
User=secureclaw
ExecStart=/home/secureclaw/scripts/secureclaw-backup.sh daily
```

Enable timer:

```bash
sudo systemctl enable secureclaw-backup.timer
sudo systemctl start secureclaw-backup.timer
```

## Backup Storage Recommendations

### Local Storage

- **Pros:** Fast, simple, no external dependencies
- **Cons:** Lost if system fails
- **Best for:** Development, temporary backups

### Network Storage (NAS)

- **Pros:** Centralized, accessible from multiple systems
- **Cons:** Network dependency
- **Best for:** Team environments, local production

### Cloud Storage (S3, Azure, GCS)

- **Pros:** Durable, versioned, geographically distributed
- **Cons:** Cost, requires internet
- **Best for:** Production, disaster recovery

### Recommended Strategy

1. **Local:** Keep 7 days of local backups
2. **NAS:** Keep 30 days on network storage
3. **Cloud:** Keep 90 days in cloud storage (encrypted)
4. **Archive:** Keep annual backups indefinitely

## Next Steps

- Review [Disaster Recovery Plan](/operations/disaster-recovery) for incident response
- Check [Production Deployment Checklist](/operations/production-checklist) before going live
- Set up monitoring and alerting for backup failures
- Test restore procedures quarterly
- Document backup schedule in your runbook

## Support

- **Documentation:** https://docs.secureclaw.app
- **GitHub Issues:** https://github.com/mbhatt1/secureclaw/issues
- **Discord:** https://discord.gg/secureclaw
