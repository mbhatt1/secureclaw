#!/usr/bin/env bash
# Update SecureClaw on Raspberry Pi
# Usage: ./update.sh [hostname] [username]

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PI_HOST="${1:-gateway-host}"
PI_USER="${2:-pi}"

echo -e "${BLUE}🦞 SecureClaw Update${NC}"
echo -e "${BLUE}==================${NC}"
echo ""
echo -e "Target: ${GREEN}$PI_USER@$PI_HOST${NC}"
echo ""

# Verify SSH connection
echo -e "${YELLOW}→ Testing SSH connection...${NC}"
if ! ssh -o ConnectTimeout=5 "$PI_USER@$PI_HOST" "echo 'SSH OK'" &>/dev/null; then
  echo -e "${RED}✗ Failed to connect to $PI_USER@$PI_HOST${NC}"
  exit 1
fi
echo -e "${GREEN}✓ SSH connection successful${NC}"

# Get current version
echo ""
echo -e "${YELLOW}→ Checking current version...${NC}"
CURRENT_VERSION=$(ssh "$PI_USER@$PI_HOST" "secureclaw --version 2>/dev/null || echo 'unknown'")
echo -e "${GREEN}✓ Current version: $CURRENT_VERSION${NC}"

# Backup config
echo ""
echo -e "${YELLOW}→ Backing up configuration...${NC}"
ssh "$PI_USER@$PI_HOST" bash <<'EOF'
  set -euo pipefail

  if [[ -f ~/.secureclaw/secureclaw.json ]]; then
    cp ~/.secureclaw/secureclaw.json ~/.secureclaw/secureclaw.json.bak
    echo "Config backed up to: ~/.secureclaw/secureclaw.json.bak"
  fi
EOF
echo -e "${GREEN}✓ Configuration backed up${NC}"

# Stop gateway
echo ""
echo -e "${YELLOW}→ Stopping gateway...${NC}"
ssh "$PI_USER@$PI_HOST" "systemctl --user stop secureclaw || true"
echo -e "${GREEN}✓ Gateway stopped${NC}"

# Update SecureClaw
echo ""
echo -e "${YELLOW}→ Updating SecureClaw...${NC}"
ssh "$PI_USER@$PI_HOST" bash <<'EOF'
  set -euo pipefail

  # Update to latest version
  npm install -g secureclaw@latest

  # Verify new version
  secureclaw --version
EOF
echo -e "${GREEN}✓ SecureClaw updated${NC}"

# Get new version
NEW_VERSION=$(ssh "$PI_USER@$PI_HOST" "secureclaw --version")
echo -e "${GREEN}✓ New version: $NEW_VERSION${NC}"

# Run doctor (auto-fix)
echo ""
echo -e "${YELLOW}→ Running health check and auto-fix...${NC}"
ssh "$PI_USER@$PI_HOST" "secureclaw doctor --fix || true"
echo -e "${GREEN}✓ Health check complete${NC}"

# Restart gateway
echo ""
echo -e "${YELLOW}→ Starting gateway...${NC}"
ssh "$PI_USER@$PI_HOST" "systemctl --user restart secureclaw"
sleep 3
echo -e "${GREEN}✓ Gateway restarted${NC}"

# Verify status
echo ""
echo -e "${YELLOW}→ Verifying status...${NC}"
STATUS=$(ssh "$PI_USER@$PI_HOST" "secureclaw status 2>&1" || echo "error")

if [[ "$STATUS" == *"running"* ]] || [[ "$STATUS" == *"active"* ]]; then
  echo -e "${GREEN}✓ Gateway is running${NC}"
else
  echo -e "${YELLOW}⚠ Gateway status:${NC}"
  echo "$STATUS"
fi

# Display summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Update Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Version:${NC} $CURRENT_VERSION → $NEW_VERSION"
echo ""
echo -e "${BLUE}Check logs:${NC}"
echo -e "  ${YELLOW}ssh $PI_USER@$PI_HOST${NC}"
echo -e "  ${YELLOW}journalctl --user -u secureclaw -f${NC}"
echo ""
