# Raspberry Pi Deployment Guide

SecureClaw runs efficiently on Raspberry Pi devices with optimized configuration profiles designed for resource-constrained environments.

## Hardware Requirements

### Supported Devices

- **Raspberry Pi 4 (2GB, 4GB, 8GB RAM)**
- **Raspberry Pi 5**
- **Raspberry Pi 3B+** (limited support, use 2GB profile)

### Requirements

- 64-bit Raspberry Pi OS (required)
- At least 2GB free disk space
- Stable power supply (official Pi power supply recommended)
- SD card with at least 16GB capacity (Class 10 or better)
- Internet connection

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

Deploy from your development machine to your Pi:

```bash
# Basic deployment
./scripts/deploy.sh pi@raspberrypi.local pi raspberry-pi-4-4gb

# Custom hostname and profile
./scripts/deploy.sh my-gateway.local myuser raspberry-pi-5
```

The deployment script will:

1. Check system requirements
2. Install dependencies (Node.js, build tools)
3. Configure swap if needed
4. Install SecureClaw
5. Set up systemd service
6. Apply power optimizations
7. Start the gateway

### Option 2: Manual Installation

SSH into your Raspberry Pi:

```bash
ssh pi@raspberrypi.local
```

Install SecureClaw:

```bash
# Install Node.js 22 (if not installed)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install SecureClaw
npm install -g secureclaw@latest

# Run onboarding with Pi profile
secureclaw onboard --profile raspberry-pi-4-4gb
```

## Configuration Profiles

### Available Profiles

#### raspberry-pi-4-2gb

**Target**: <5s startup, <80MB idle RAM, <1W idle power

Best for:

- 2GB Raspberry Pi 4
- Minimal channel setup
- Long-running deployments
- Battery-powered setups

Features:

- Ultra-lightweight configuration
- Minimal memory usage
- Maximum power efficiency
- Reduced logging

#### raspberry-pi-4-4gb (Recommended)

**Target**: <5s startup, <100MB idle RAM, <1W idle power

Best for:

- 4GB Raspberry Pi 4
- Balanced performance
- Multiple channels
- General home server use

Features:

- Balanced memory and performance
- Full channel support
- Reasonable logging
- Background memory indexing

#### raspberry-pi-4-8gb

**Target**: <5s startup, <150MB idle RAM, <1.2W idle power

Best for:

- 8GB Raspberry Pi 4
- Heavy usage
- Many concurrent channels
- Full feature set

Features:

- Full features enabled
- Larger caches
- More aggressive indexing
- Detailed logging

#### raspberry-pi-5

**Target**: <3s startup, <200MB idle RAM, <2W idle power

Best for:

- Raspberry Pi 5
- High performance
- Demanding workloads
- Fast response times

Features:

- Optimized for Pi 5's faster CPU
- Higher memory limits
- Faster startup
- Full features with minimal compromise

### Using Profiles

#### Method 1: CLI Flag

```bash
secureclaw gateway --profile raspberry-pi-4-4gb
```

#### Method 2: Environment Variable

```bash
export SECURECLAW_PROFILE=raspberry-pi-4-4gb
secureclaw gateway
```

#### Method 3: Auto-detection

SecureClaw automatically detects Raspberry Pi hardware and selects an appropriate profile:

```bash
secureclaw gateway  # Auto-detects Pi 4/5 and RAM size
```

#### Method 4: Merge with Existing Config

The profile acts as a base configuration. Your user config in `~/.secureclaw/secureclaw.json` will override profile settings:

```json
{
  "$profile": "raspberry-pi-4-4gb",
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-opus-4-20250514"
      }
    }
  }
}
```

## Optimization Details

### Startup Optimizations

1. **Lazy Module Loading**
   - Heavy modules (Playwright, media tools) load on-demand
   - Reduces startup time by 2-3 seconds

2. **Parallel Channel Initialization**
   - Channels start concurrently on capable systems
   - Disabled on 2GB systems to reduce memory spikes

3. **Async Memory Backend**
   - Memory indexing happens in background
   - Gateway becomes responsive faster

4. **Reduced Heartbeats**
   - Longer intervals between system checks
   - Reduces CPU wake-ups and power consumption

### Memory Optimizations

1. **SQLite Configuration**
   - WAL mode for better concurrency
   - Memory-mapped I/O for faster reads
   - Optimized cache sizes per profile
   - Temp files in memory

2. **Write Buffering**
   - Batched writes to reduce disk I/O
   - Configurable flush intervals
   - Prevents SD card wear

3. **Embedding Quantization**
   - int8 quantization for vector embeddings
   - Reduces memory by ~75% with minimal accuracy loss

### Power Optimizations

1. **CPU Frequency Management**
   - Monitors for throttling
   - Warns on under-voltage conditions

2. **Reduced I/O**
   - Batched logging
   - Deferred disk writes
   - Lazy module loading

3. **System Tuning**
   - Disables unused services (Bluetooth)
   - Reduces GPU memory allocation
   - Optimizes swappiness

## Health Monitoring

### Raspberry Pi-Specific Monitoring

SecureClaw includes built-in health monitoring for Raspberry Pi:

1. **CPU Temperature**
   - Warning at 70°C
   - Critical at 80°C
   - Auto-throttling detection

2. **Memory Pressure**
   - Real-time memory usage tracking
   - Pressure levels: none/low/medium/high/critical
   - Automatic warnings at thresholds

3. **Disk Space**
   - Warning at 80% usage
   - Critical at 90% usage
   - Prevents SD card overflow

4. **Power State**
   - Under-voltage detection
   - Throttling alerts
   - Power supply recommendations

### Viewing Health Status

```bash
# Check system health
secureclaw doctor --health

# View startup performance
secureclaw doctor --bench

# Real-time monitoring via logs
journalctl --user -u secureclaw -f | grep health
```

## Performance Tuning

### Swap Configuration

For systems with <3GB RAM, the deployment script automatically configures 2GB swap:

```bash
# Manual swap setup if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### SD Card Optimization

Reduce write wear on SD cards:

1. **Enable log buffering** (automatic in profiles)
2. **Use external storage** for workspace:

   ```json
   {
     "agents": {
       "defaults": {
         "workspace": "/mnt/external/secureclaw"
       }
     }
   }
   ```

3. **Periodic backups**:

   ```bash
   # Backup config
   cp ~/.secureclaw/secureclaw.json ~/backup/

   # Backup memory database
   cp ~/.secureclaw/memory.db ~/backup/
   ```

### Network Access

#### SSH Tunnel (Secure)

```bash
# From your laptop
ssh -L 18789:localhost:18789 pi@raspberrypi.local

# Access dashboard
open http://localhost:18789
```

#### Tailscale (Recommended for Remote Access)

```bash
# On your Pi
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Configure SecureClaw to use Tailscale
secureclaw config set gateway.tailscale.mode serve
```

## Troubleshooting

### High CPU Temperature

If CPU temperature is consistently above 70°C:

1. **Check cooling**:
   - Ensure proper airflow
   - Add heatsinks
   - Consider fan or active cooling

2. **Reduce load**:
   - Switch to lighter profile
   - Disable unused channels
   - Reduce heartbeat frequency

### Memory Issues

If experiencing out-of-memory errors:

1. **Add swap** (see above)
2. **Use lighter profile**:
   ```bash
   secureclaw gateway --profile raspberry-pi-4-2gb
   ```
3. **Reduce cache sizes** in config:
   ```json
   {
     "agents": {
       "defaults": {
         "memory": {
           "options": {
             "cacheSize": 2000
           }
         }
       }
     }
   }
   ```

### Slow Startup

If startup takes >10 seconds:

1. **Check SD card performance**:

   ```bash
   sudo hdparm -t /dev/mmcblk0
   ```

   - Should be >20 MB/s
   - Upgrade to Class 10 or A2-rated card if slower

2. **Enable startup optimizations** (automatic in profiles)

3. **Reduce plugin load**:
   - Disable unused plugins
   - Use lazy loading

### Under-Voltage Warnings

If seeing under-voltage warnings:

1. **Upgrade power supply**:
   - Use official Raspberry Pi power supply
   - Minimum 3A for Pi 4
   - Minimum 5A for Pi 5

2. **Check cable quality**:
   - Use short, high-quality USB-C cable
   - Avoid cheap adapters

### Disk Space Issues

If running out of disk space:

1. **Clean up logs**:

   ```bash
   sudo journalctl --vacuum-size=100M
   ```

2. **Move workspace to external drive**

3. **Disable unnecessary features**:
   ```json
   {
     "agents": {
       "defaults": {
         "tools": {
           "tts": { "enabled": false },
           "media": { "enabled": false }
         }
       }
     }
   }
   ```

## Maintenance

### Updating SecureClaw

```bash
# Update via CLI
secureclaw update

# Or manually
npm install -g secureclaw@latest
sudo systemctl --user restart secureclaw
```

### Monitoring Service

```bash
# Check service status
systemctl --user status secureclaw

# View logs
journalctl --user -u secureclaw -f

# Restart service
systemctl --user restart secureclaw
```

### Backup and Restore

```bash
# Backup
tar -czf ~/secureclaw-backup.tar.gz ~/.secureclaw/

# Restore
tar -xzf ~/secureclaw-backup.tar.gz -C ~/
```

## Best Practices

1. **Use quality SD card**:
   - SanDisk Extreme or Samsung EVO Plus
   - A2 rating for better random I/O

2. **Keep system updated**:

   ```bash
   sudo apt update && sudo apt upgrade
   ```

3. **Monitor health regularly**:
   - Check logs weekly
   - Watch for temperature warnings
   - Monitor disk space

4. **Regular backups**:
   - Weekly config backups
   - Monthly full backups

5. **Power management**:
   - Use UPS for important deployments
   - Clean power supply
   - Proper ventilation

6. **Security**:
   - Keep SSH keys secure
   - Use Tailscale for remote access
   - Regular security updates

## Performance Benchmarks

Typical performance on Raspberry Pi 4 (4GB) with `raspberry-pi-4-4gb` profile:

- **Startup time**: 3-5 seconds
- **Idle memory**: 80-100 MB
- **Idle power**: <1W
- **CPU usage (idle)**: <5%
- **Response latency**: <100ms (local network)

## Additional Resources

- [Main Documentation](https://docs.secureclaw.app)
- [Configuration Reference](https://docs.secureclaw.app/config)
- [Troubleshooting Guide](https://docs.secureclaw.app/troubleshooting)
- [Discord Community](https://discord.gg/clawd)

## Support

For Pi-specific issues:

1. Check logs: `journalctl --user -u secureclaw -f`
2. Run health check: `secureclaw doctor --health`
3. Join Discord: https://discord.gg/clawd
4. Open issue: https://github.com/secureclaw/secureclaw/issues
