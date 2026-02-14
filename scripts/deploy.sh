#!/usr/bin/env bash
# Deploy SecureClaw to Raspberry Pi with optimized configuration
# Usage: ./deploy.sh [hostname] [username] [profile]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PI_HOST="${1:-gateway-host}"
PI_USER="${2:-pi}"
PROFILE="${3:-raspberry-pi-4-4gb}"

echo -e "${BLUE}🦞 SecureClaw Raspberry Pi Deployment${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "Target:  ${GREEN}$PI_USER@$PI_HOST${NC}"
echo -e "Profile: ${GREEN}$PROFILE${NC}"
echo ""

# Verify SSH connection
echo -e "${YELLOW}→ Testing SSH connection...${NC}"
if ! ssh -o ConnectTimeout=5 "$PI_USER@$PI_HOST" "echo 'SSH OK'" &>/dev/null; then
  echo -e "${RED}✗ Failed to connect to $PI_USER@$PI_HOST${NC}"
  echo -e "${YELLOW}  Make sure SSH is enabled and the Pi is reachable${NC}"
  exit 1
fi
echo -e "${GREEN}✓ SSH connection successful${NC}"

# Check if profile exists
# Try both old and new locations
if [[ -f "src/config/profiles/$PROFILE.json" ]]; then
  PROFILE_PATH="src/config/profiles/$PROFILE.json"
elif [[ -f "profiles/$PROFILE.json" ]]; then
  PROFILE_PATH="profiles/$PROFILE.json"
else
  echo -e "${RED}✗ Profile not found: $PROFILE${NC}"
  echo -e "${YELLOW}  Available profiles:${NC}"
  (ls -1 src/config/profiles/raspberry-pi-*.json 2>/dev/null || ls -1 profiles/raspberry-pi-*.json 2>/dev/null) | \
    sed 's|.*/||' | sed 's/.json//' | sed 's/^/  - /'
  exit 1
fi

# 1. Check system requirements
echo ""
echo -e "${YELLOW}→ Checking system requirements...${NC}"

# Check architecture
ARCH=$(ssh "$PI_USER@$PI_HOST" "uname -m")
if [[ "$ARCH" != "aarch64" ]]; then
  echo -e "${RED}✗ Warning: Not running 64-bit OS (detected: $ARCH)${NC}"
  echo -e "${YELLOW}  SecureClaw requires 64-bit Raspberry Pi OS${NC}"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check Node.js version
NODE_VERSION=$(ssh "$PI_USER@$PI_HOST" "node --version 2>/dev/null || echo 'none'")
if [[ "$NODE_VERSION" == "none" ]]; then
  echo -e "${YELLOW}⚠ Node.js not installed${NC}"
else
  echo -e "${GREEN}✓ Node.js: $NODE_VERSION${NC}"
fi

# Check available RAM
RAM_MB=$(ssh "$PI_USER@$PI_HOST" "free -m | awk 'NR==2{print \$2}'")
echo -e "${GREEN}✓ RAM: ${RAM_MB}MB${NC}"

if [[ "$RAM_MB" -lt 1500 ]]; then
  echo -e "${YELLOW}⚠ Low RAM detected. Consider adding swap (see docs)${NC}"
fi

# Check disk space
DISK_GB=$(ssh "$PI_USER@$PI_HOST" "df -BG / | awk 'NR==2{print \$4}' | sed 's/G//'")
echo -e "${GREEN}✓ Free disk space: ${DISK_GB}GB${NC}"

if [[ "$DISK_GB" -lt 2 ]]; then
  echo -e "${RED}✗ Insufficient disk space (need at least 2GB free)${NC}"
  exit 1
fi

# 2. Install system dependencies
echo ""
echo -e "${YELLOW}→ Installing system dependencies...${NC}"

ssh "$PI_USER@$PI_HOST" bash <<'EOF'
  set -euo pipefail

  # Update package list
  sudo apt update -qq

  # Install essential build tools
  sudo apt install -y --no-install-recommends \
    build-essential \
    git \
    curl \
    ca-certificates \
    libvips-dev \
    libsqlite3-dev \
    chromium-browser

  # Clean up
  sudo apt autoremove -y
  sudo apt clean
EOF

echo -e "${GREEN}✓ System dependencies installed${NC}"

# 3. Install Node.js if needed
if [[ "$NODE_VERSION" == "none" ]] || [[ ! "$NODE_VERSION" =~ ^v22\. ]]; then
  echo ""
  echo -e "${YELLOW}→ Installing Node.js 22...${NC}"

  ssh "$PI_USER@$PI_HOST" bash <<'EOF'
    set -euo pipefail

    # Install Node.js via NodeSource
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs

    # Verify
    node --version
    npm --version
EOF

  echo -e "${GREEN}✓ Node.js installed${NC}"
fi

# 4. Setup swap for low-RAM systems
if [[ "$RAM_MB" -lt 3000 ]]; then
  echo ""
  echo -e "${YELLOW}→ Setting up swap (detected <3GB RAM)...${NC}"

  ssh "$PI_USER@$PI_HOST" bash <<'EOF'
    set -euo pipefail

    # Check if swap already exists
    if [[ ! -f /swapfile ]] || [[ $(swapon --show | wc -l) -lt 2 ]]; then
      # Create 2GB swap
      sudo fallocate -l 2G /swapfile
      sudo chmod 600 /swapfile
      sudo mkswap /swapfile
      sudo swapon /swapfile

      # Make permanent
      if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
      fi

      # Optimize for low RAM
      if ! grep -q 'vm.swappiness' /etc/sysctl.conf; then
        echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
        sudo sysctl -p
      fi

      echo "Swap configured: 2GB"
    else
      echo "Swap already configured"
    fi
EOF

  echo -e "${GREEN}✓ Swap configured${NC}"
fi

# 5. Install SecureClaw
echo ""
echo -e "${YELLOW}→ Installing SecureClaw...${NC}"

ssh "$PI_USER@$PI_HOST" bash <<'EOF'
  set -euo pipefail

  # Install globally
  npm install -g secureclaw@latest

  # Verify installation
  secureclaw --version
EOF

echo -e "${GREEN}✓ SecureClaw installed${NC}"

# 6. Create config directory
echo ""
echo -e "${YELLOW}→ Setting up configuration...${NC}"

ssh "$PI_USER@$PI_HOST" "mkdir -p ~/.secureclaw"

# 7. Copy optimized config profile
echo -e "${YELLOW}→ Installing configuration profile: $PROFILE${NC}"

scp "$PROFILE_PATH" "$PI_USER@$PI_HOST:~/.secureclaw/secureclaw.json"

echo -e "${GREEN}✓ Configuration installed${NC}"

# 8. Setup systemd service
echo ""
echo -e "${YELLOW}→ Setting up systemd service...${NC}"

ssh "$PI_USER@$PI_HOST" bash <<'EOF'
  set -euo pipefail

  # Install daemon using secureclaw CLI
  secureclaw daemon install --user

  # Enable service
  systemctl --user enable secureclaw
EOF

echo -e "${GREEN}✓ Systemd service configured${NC}"

# 9. Optimize system for low power
echo ""
echo -e "${YELLOW}→ Applying power optimizations...${NC}"

ssh "$PI_USER@$PI_HOST" bash <<'EOF'
  set -euo pipefail

  # Disable Bluetooth if not needed
  if systemctl is-enabled bluetooth &>/dev/null; then
    sudo systemctl disable bluetooth
  fi

  # Reduce GPU memory (headless)
  if ! grep -q 'gpu_mem=16' /boot/config.txt 2>/dev/null; then
    echo 'gpu_mem=16' | sudo tee -a /boot/config.txt || true
  fi

  echo "Power optimizations applied"
EOF

echo -e "${GREEN}✓ Power optimizations applied${NC}"

# 10. Start gateway
echo ""
echo -e "${YELLOW}→ Starting SecureClaw gateway...${NC}"

ssh "$PI_USER@$PI_HOST" "systemctl --user start secureclaw"

# Wait for startup
echo -e "${YELLOW}→ Waiting for gateway to start...${NC}"
sleep 5

# 11. Verify installation
echo ""
echo -e "${YELLOW}→ Verifying installation...${NC}"

STATUS=$(ssh "$PI_USER@$PI_HOST" "secureclaw status 2>&1" || echo "error")

if [[ "$STATUS" == *"running"* ]] || [[ "$STATUS" == *"active"* ]]; then
  echo -e "${GREEN}✓ Gateway is running${NC}"
else
  echo -e "${YELLOW}⚠ Gateway status:${NC}"
  echo "$STATUS"
fi

# 12. Display summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo -e "  1. Complete onboarding:"
echo -e "     ${YELLOW}ssh $PI_USER@$PI_HOST${NC}"
echo -e "     ${YELLOW}secureclaw onboard${NC}"
echo ""
echo -e "  2. Access dashboard (via SSH tunnel):"
echo -e "     ${YELLOW}ssh -L 18789:localhost:18789 $PI_USER@$PI_HOST${NC}"
echo -e "     ${YELLOW}open http://localhost:18789${NC}"
echo ""
echo -e "  3. Or setup Tailscale for remote access:"
echo -e "     ${YELLOW}ssh $PI_USER@$PI_HOST${NC}"
echo -e "     ${YELLOW}curl -fsSL https://tailscale.com/install.sh | sh${NC}"
echo -e "     ${YELLOW}sudo tailscale up${NC}"
echo ""
echo -e "  4. Check logs:"
echo -e "     ${YELLOW}ssh $PI_USER@$PI_HOST${NC}"
echo -e "     ${YELLOW}journalctl --user -u secureclaw -f${NC}"
echo ""
echo -e "  5. Monitor performance:"
echo -e "     ${YELLOW}secureclaw doctor --bench${NC}"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo -e "  • Installation: https://docs.secureclaw.app/platforms/raspberry-pi"
echo -e "  • Optimization: https://docs.secureclaw.app/platforms/OPTIMIZATION-RASPBERRY-PI"
echo ""
