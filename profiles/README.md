# SecureClaw Configuration Profiles

This directory contains optimized configuration profiles for different deployment scenarios.

## Raspberry Pi Profiles

Optimized configurations for Raspberry Pi deployments. See the [Raspberry Pi Optimization Guide](../docs/platforms/OPTIMIZATION-RASPBERRY-PI.md) for detailed information.

### Available Profiles

#### raspberry-pi-4-2gb.json

**Target Hardware:** Raspberry Pi 4 with 2GB RAM
**Mode:** Minimal
**Requirements:** Swap recommended

**Performance Targets:**

- Startup: <6s
- Idle RAM: <80MB
- Idle Power: <0.9W

**Features:**

- Telegram only (lightest channel)
- SQLite embedded database
- Browser/TTS/Media disabled
- Aggressive power saving (10m heartbeat)
- Minimal logging

**Use Case:** Budget Pi setup, headless gateway, single-channel bot

---

#### raspberry-pi-4-4gb.json

**Target Hardware:** Raspberry Pi 4 with 4GB RAM
**Mode:** Standard

**Performance Targets:**

- Startup: <5s
- Idle RAM: <100MB
- Idle Power: <1W

**Features:**

- Telegram + optional WhatsApp
- SQLite embedded database
- Browser tools (lazy loaded)
- Balanced power saving (5m heartbeat)
- Control UI (lazy loaded)

**Use Case:** Recommended for most users, good balance of features and performance

---

#### raspberry-pi-4-8gb.json

**Target Hardware:** Raspberry Pi 4 with 8GB RAM
**Mode:** Standard

**Performance Targets:**

- Startup: <4s
- Idle RAM: <120MB
- Idle Power: <1W

**Features:**

- Multiple channels (Telegram, WhatsApp)
- SQLite embedded database
- All tools enabled (Browser, TTS, Media)
- Standard heartbeat (2m)
- Full Control UI
- Real-time indexing

**Use Case:** Power users, multiple channels, full feature set

---

#### raspberry-pi-5.json

**Target Hardware:** Raspberry Pi 5 (4GB or 8GB)
**Mode:** Full

**Performance Targets:**

- Startup: <3s
- Idle RAM: <100MB
- Idle Power: <0.8W

**Features:**

- Multiple channels (Telegram, WhatsApp, Discord)
- SQLite embedded database with ARM NEON SIMD
- All tools enabled with hardware acceleration
- Video hardware decoding (h264_v4l2m2m)
- Real-time indexing
- Module preloading for faster response

**Use Case:** Best-in-class Pi performance, latest hardware, all features

---

## Using a Profile

### Option 1: Copy Profile Directly

```bash
# Choose a profile
cp profiles/raspberry-pi-4-4gb.json ~/.secureclaw/secureclaw.json

# Restart gateway
systemctl --user restart secureclaw
```

### Option 2: Use Deployment Script

```bash
# Deploy to Pi with specific profile
./scripts/raspberry-pi/deploy.sh gateway-host pi raspberry-pi-4-4gb
```

### Option 3: Manual Merge

Copy relevant sections from the profile into your existing `~/.secureclaw/secureclaw.json`:

```json5
{
  // Your existing config
  agents: {
    defaults: {
      // Merge memory settings from profile
      memory: {
        backend: "sqlite",
        options: {
          cacheSize: 4000,
          // ... other SQLite optimizations
        },
      },
    },
  },
}
```

## Customizing Profiles

All profiles are JSON5 files (comments and trailing commas allowed). Customize as needed:

### Add API Keys

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-20250514",
      },
      providers: {
        anthropic: {
          apiKey: "sk-ant-...", // Add your key
        },
      },
    },
  },
}
```

### Enable Additional Channels

```json5
{
  channels: {
    telegram: { enabled: true },
    whatsapp: {
      enabled: true, // Enable WhatsApp
      allowFrom: ["+1234567890"],
    },
  },
}
```

### Adjust Memory Limits

```json5
{
  agents: {
    defaults: {
      memory: {
        options: {
          cacheSize: 2000, // Reduce for lower RAM
          // or
          cacheSize: 8000, // Increase for more RAM
        },
      },
    },
  },
}
```

## Profile Selection Guide

| Pi Model | RAM | Recommended Profile  | Notes            |
| -------- | --- | -------------------- | ---------------- |
| Pi 5 8GB | 8GB | `raspberry-pi-5`     | Best performance |
| Pi 5 4GB | 4GB | `raspberry-pi-5`     | Excellent        |
| Pi 4 8GB | 8GB | `raspberry-pi-4-8gb` | Full features    |
| Pi 4 4GB | 4GB | `raspberry-pi-4-4gb` | **Recommended**  |
| Pi 4 2GB | 2GB | `raspberry-pi-4-2gb` | Add swap         |
| Pi 4 1GB | 1GB | `raspberry-pi-4-2gb` | Add 2GB swap     |

## Performance Verification

After applying a profile, verify performance:

```bash
# Check startup time
time systemctl --user restart secureclaw

# Check memory usage
ps aux | grep secureclaw

# Run benchmark
./scripts/raspberry-pi/benchmark.sh gateway-host pi

# Full diagnostics
secureclaw doctor --bench
```

## Troubleshooting

### Out of Memory

Use a lighter profile or add swap:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Slow Startup

- Disable unused channels
- Enable `parallelChannels` in gateway startup
- Move database to USB SSD

### High CPU Usage

- Increase polling intervals
- Reduce heartbeat frequency
- Disable background indexing

## See Also

- [Raspberry Pi Installation Guide](../docs/platforms/raspberry-pi.md)
- [Raspberry Pi Optimization Guide](../docs/platforms/OPTIMIZATION-RASPBERRY-PI.md)
- [Configuration Reference](../docs/gateway/configuration-reference.md)
- [Performance Tuning](../docs/concepts/performance.md)
