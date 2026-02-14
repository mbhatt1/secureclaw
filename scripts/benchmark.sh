#!/usr/bin/env bash
# Benchmark SecureClaw performance on Raspberry Pi
# Usage: ./benchmark.sh [hostname] [username]

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PI_HOST="${1:-gateway-host}"
PI_USER="${2:-pi}"

echo -e "${BLUE}🦞 SecureClaw Raspberry Pi Benchmark${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "Target: ${GREEN}$PI_USER@$PI_HOST${NC}"
echo ""

# Run benchmark on Pi
ssh "$PI_USER@$PI_HOST" bash <<'EOF'
  set -euo pipefail

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "System Information"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Hardware info
  echo "Hardware:"
  cat /proc/cpuinfo | grep "Model" | cut -d: -f2 | xargs || echo "  Unknown"

  # CPU
  echo "CPU:"
  lscpu | grep "Model name" | cut -d: -f2 | xargs || echo "  Unknown"
  echo "  Cores: $(nproc)"
  echo "  Architecture: $(uname -m)"

  # RAM
  echo "RAM:"
  echo "  Total: $(free -h | awk 'NR==2{print $2}')"
  echo "  Available: $(free -h | awk 'NR==2{print $7}')"

  # Disk
  echo "Disk:"
  echo "  Root: $(df -h / | awk 'NR==2{print $2 " total, " $4 " free"}')"

  # Temperature
  if [[ -f /sys/class/thermal/thermal_zone0/temp ]]; then
    TEMP=$(cat /sys/class/thermal/thermal_zone0/temp)
    TEMP_C=$((TEMP / 1000))
    echo "Temperature:"
    echo "  CPU: ${TEMP_C}°C"
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "SecureClaw Performance"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Check if gateway is running
  if systemctl --user is-active secureclaw &>/dev/null; then
    echo "Gateway Status: Running ✓"

    # Get process stats
    PID=$(systemctl --user show secureclaw -p MainPID | cut -d= -f2)

    if [[ "$PID" != "0" ]]; then
      # Memory usage
      RSS=$(ps -p "$PID" -o rss= | awk '{print $1}')
      RSS_MB=$((RSS / 1024))
      echo "Memory Usage: ${RSS_MB}MB"

      # CPU usage (sample over 2 seconds)
      CPU=$(ps -p "$PID" -o %cpu= || echo "0")
      echo "CPU Usage: ${CPU}%"
    fi
  else
    echo "Gateway Status: Not running"
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Startup Time Test"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Stop gateway for clean test
  systemctl --user stop secureclaw 2>/dev/null || true
  sleep 2

  # Measure startup time
  echo "Starting gateway..."
  START=$(date +%s%N)
  systemctl --user start secureclaw

  # Wait for gateway to be ready
  for i in {1..30}; do
    if systemctl --user is-active secureclaw &>/dev/null; then
      END=$(date +%s%N)
      ELAPSED=$(( (END - START) / 1000000 ))
      ELAPSED_SEC=$(echo "scale=2; $ELAPSED / 1000" | bc)
      echo "Startup time: ${ELAPSED_SEC}s"

      # Check if under target
      if (( $(echo "$ELAPSED_SEC < 5" | bc -l) )); then
        echo "✓ Startup target met (<5s)"
      else
        echo "⚠ Startup slower than target (>5s)"
      fi
      break
    fi
    sleep 0.5
  done

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Power Consumption Estimate"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Estimate based on CPU frequency
  if [[ -f /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq ]]; then
    FREQ=$(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq)
    FREQ_MHZ=$((FREQ / 1000))
    echo "CPU Frequency: ${FREQ_MHZ}MHz"

    # Rough power estimates for Pi models
    if cat /proc/cpuinfo | grep -q "Pi 5"; then
      echo "Estimated idle power: ~0.8W"
    elif cat /proc/cpuinfo | grep -q "Pi 4"; then
      echo "Estimated idle power: ~0.9W"
    fi
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Database Performance"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  if [[ -f ~/.secureclaw/memory.db ]]; then
    DB_SIZE=$(du -h ~/.secureclaw/memory.db | cut -f1)
    echo "Database size: $DB_SIZE"

    # Check if on SSD or SD card
    DB_DEVICE=$(df ~/.secureclaw/memory.db | awk 'NR==2{print $1}')
    if [[ "$DB_DEVICE" == *"mmcblk"* ]]; then
      echo "Storage: SD Card (consider USB SSD for better performance)"
    else
      echo "Storage: External (likely SSD) ✓"
    fi
  else
    echo "Database not found"
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Recommendations"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Check RAM
  RAM_MB=$(free -m | awk 'NR==2{print $2}')
  if [[ "$RAM_MB" -lt 2000 ]]; then
    echo "⚠ Low RAM detected (${RAM_MB}MB)"
    echo "  → Add swap: sudo fallocate -l 2G /swapfile"
    echo "  → Use minimal profile: raspberry-pi-4-2gb"
  fi

  # Check temperature
  if [[ -f /sys/class/thermal/thermal_zone0/temp ]]; then
    TEMP=$(cat /sys/class/thermal/thermal_zone0/temp)
    TEMP_C=$((TEMP / 1000))
    if [[ "$TEMP_C" -gt 70 ]]; then
      echo "⚠ High temperature (${TEMP_C}°C)"
      echo "  → Add heatsink or fan"
      echo "  → Improve ventilation"
    fi
  fi

  # Check if using SD card
  if df ~/.secureclaw | grep -q "mmcblk"; then
    echo "⚠ Using SD card for storage"
    echo "  → Consider USB SSD for 5-10x faster I/O"
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Benchmark Complete"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Run 'secureclaw doctor' for detailed diagnostics"
  echo ""
EOF
