# Raspberry Pi Deployment Guide

> **📌 Note**: This guide has been superseded by more comprehensive documentation.
>
> **For complete setup and optimization, see:**
>
> - **[Raspberry Pi Installation Guide](/platforms/raspberry-pi)** - Basic setup
> - **[Raspberry Pi Optimization Guide](/platforms/OPTIMIZATION-RASPBERRY-PI)** - Performance tuning
> - **[Configuration Profiles](../profiles/README.md)** - Pre-tuned configs
> - **[Quick Start Guide](../profiles/QUICKSTART.md)** - 5-minute deployment

---

## Quick Deploy (Recommended)

Use the automated deployment script:

```bash
git clone https://github.com/mbhatt1/secureclaw.git
cd secureclaw
./scripts/raspberry-pi/deploy.sh gateway-host pi raspberry-pi-4-4gb
```

---

## Legacy Documentation

The content below is preserved for reference but may be outdated.

### Hardware Requirements

- **Raspberry Pi 4** (4GB RAM minimum, 8GB recommended)
- **32GB+ microSD card** (Class 10 or better)
- **Stable power supply** (official 5V/3A recommended)
- **Ethernet or WiFi connection**

---

## Quick Start

### 1. Install SecureClaw

```bash
# Standard installation
curl -fsSL https://secureclaw.ai/install.sh | bash

# Or clone from source
git clone https://github.com/yourusername/secureclaw.git
cd secureclaw
npm install
npm run build
```

### 2. Copy Raspberry Pi Configuration

```bash
# Environment variables
cp .env.pi .env

# YAML configuration
cp config.pi.yaml config.yaml

# Edit as needed
nano .env
nano config.yaml
```

### 3. Configure Swap (Optional but Recommended)

```bash
# Increase swap to 1GB for safety margin
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set: CONF_SWAPSIZE=1024

sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### 4. Start SecureClaw

```bash
# Start with memory optimizations
NODE_OPTIONS="--max-old-space-size=450" npm start

# Or use systemd service (see below)
```

---

## Memory Optimization Details

### Memory Budget (Target: <500MB)

| Component               | Allocation | Notes                    |
| ----------------------- | ---------- | ------------------------ |
| Memory Manager (SQLite) | 150 MB     | Embeddings + chunks      |
| Embedding Cache (LRU)   | 50 MB      | 5000 entries max         |
| WebSocket Pool          | 70 MB      | 20 connections max       |
| Security Coach Cache    | 8 MB       | 1000 entries LRU         |
| Agent Sessions          | 60 MB      | Streaming + lazy load    |
| Node.js Overhead        | 50 MB      | Runtime + V8             |
| **Total**               | **388 MB** | **112 MB safety margin** |

### Key Optimizations

1. **LRU Caches** - All unbounded Maps replaced with size-limited LRU caches
2. **Connection Limits** - Max 20 concurrent WebSocket clients
3. **Stream Processing** - Large files read line-by-line instead of full buffering
4. **Lazy Loading** - Sessions and modules loaded on-demand
5. **Aggressive GC** - Memory monitor triggers cleanup at 80% threshold

---

## Production Deployment

### Systemd Service

Create `/etc/systemd/system/secureclaw.service`:

```ini
[Unit]
Description=SecureClaw AI Gateway
After=network.target

[Service]
Type=simple
User=secureclaw
WorkingDirectory=/home/secureclaw/secureclaw
Environment="NODE_ENV=production"
Environment="NODE_OPTIONS=--max-old-space-size=450 --max-semi-space-size=16"
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10s

# Memory limits (systemd enforced)
MemoryMax=600M
MemoryHigh=550M

# CPU limits (prevent runaway processes)
CPUQuota=80%

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/home/secureclaw/secureclaw

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable secureclaw
sudo systemctl start secureclaw
sudo systemctl status secureclaw
```

### Log Rotation

Create `/etc/logrotate.d/secureclaw`:

```
/home/secureclaw/secureclaw/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
```

---

## Monitoring

### Memory Usage

```bash
# Real-time memory monitoring
watch -n 5 'ps aux | grep secureclaw | awk "{print \$6/1024 \" MB\"}"'

# Detailed memory breakdown
node --max-old-space-size=450 dist/index.js --memory-profile

# Check systemd memory limits
sudo systemctl status secureclaw | grep Memory
```

### Performance Metrics

```bash
# CPU usage
top -p $(pgrep -f secureclaw)

# Network connections
sudo netstat -tnp | grep secureclaw

# Disk I/O
sudo iotop -p $(pgrep -f secureclaw)
```

### Logs

```bash
# Follow logs
journalctl -u secureclaw -f

# Last 100 lines
journalctl -u secureclaw -n 100

# Filter by date
journalctl -u secureclaw --since "1 hour ago"
```

---

## Troubleshooting

### Out of Memory (OOM)

**Symptom:** Process killed, systemd shows `Main process exited, code=killed, status=9/KILL`

**Solutions:**

1. Check current memory usage:

   ```bash
   free -h
   journalctl -u secureclaw | grep -i oom
   ```

2. Reduce heap limit:

   ```bash
   # In .env
   NODE_OPTIONS="--max-old-space-size=400"
   ```

3. Disable expensive features:

   ```yaml
   # In config.yaml
   memory:
     sync:
       watch: false
       intervalMinutes: 60
   securityCoach:
     llmJudge:
       cacheMaxEntries: 500
   ```

4. Increase swap:
   ```bash
   sudo dphys-swapfile swapoff
   sudo nano /etc/dphys-swapfile
   # Set: CONF_SWAPSIZE=2048
   sudo dphys-swapfile setup
   sudo dphys-swapfile swapon
   ```

### High CPU Usage

**Symptom:** Pi becomes unresponsive, high temperature

**Solutions:**

1. Limit CPU quota (systemd):

   ```ini
   CPUQuota=60%
   ```

2. Reduce concurrent operations:

   ```yaml
   memory:
     sync:
       batch:
         concurrency: 1
   gateway:
     maxConnections: 10
   ```

3. Disable background tasks:
   ```yaml
   memory:
     sync:
       intervalMinutes: 0 # Disable auto-sync
   ```

### Slow Response Times

**Symptom:** UI laggy, API timeouts

**Solutions:**

1. Check memory pressure:

   ```bash
   cat /proc/pressure/memory
   ```

2. Reduce cache TTL (trade memory for speed):

   ```bash
   SECURECLAW_MEMORY_CACHE_MAX_ENTRIES=3000
   ```

3. Use local LLM instead of remote API:
   ```yaml
   securityCoach:
     llmJudge:
       enabled: false # Fallback to patterns only
   ```

---

## Performance Benchmarks

### Raspberry Pi 4 (4GB RAM)

| Metric                 | Value    | Notes               |
| ---------------------- | -------- | ------------------- |
| Memory usage (idle)    | 85 MB    | Fresh start         |
| Memory usage (load)    | 310 MB   | 10 clients, 2K docs |
| Memory usage (peak)    | 420 MB   | Heavy indexing      |
| Startup time           | 15 sec   | Cold start          |
| Vector search latency  | 135 ms   | 2000 embeddings     |
| LLM cache hit latency  | 0.8 ms   | In-memory           |
| WebSocket throughput   | 50 msg/s | Per client          |
| Max concurrent clients | 20       | Enforced limit      |

### Comparison to Cloud Deployment

| Resource | Raspberry Pi 4 | AWS t3.small | Notes             |
| -------- | -------------- | ------------ | ----------------- |
| Memory   | 4 GB           | 2 GB         | Pi has more       |
| vCPU     | 4 cores        | 2 cores      | Pi has more       |
| Cost     | $60 one-time   | $15/month    | Pi wins long-term |
| Power    | 5-10W          | N/A          | Pi more efficient |

---

## Best Practices

### DO

✅ Enable swap (1-2GB) for emergency overflow
✅ Monitor memory usage regularly
✅ Use systemd memory limits as safeguard
✅ Keep system updated (Raspberry Pi OS)
✅ Use wired Ethernet if possible (more reliable)
✅ Enable SSH for remote management
✅ Set up automated backups (config + data)

### DON'T

❌ Run on Raspberry Pi Zero/3 (insufficient RAM)
❌ Disable memory monitor in production
❌ Set NODE_OPTIONS above 500MB (risky)
❌ Run multiple memory-intensive apps simultaneously
❌ Use microSD cards < 32GB or < Class 10
❌ Forget to configure log rotation
❌ Expose directly to internet without firewall

---

## Security Hardening

```bash
# Firewall (allow only necessary ports)
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 8080/tcp # SecureClaw gateway
sudo ufw status

# Automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Fail2ban (protect SSH)
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

---

## Support

- **Documentation:** https://secureclaw.ai/docs
- **GitHub Issues:** https://github.com/yourusername/secureclaw/issues
- **Discord:** https://discord.gg/secureclaw
- **Email:** support@secureclaw.ai

---

## License

MIT License - See LICENSE file for details
