# Quick Start: Raspberry Pi Configuration Profiles

Get SecureClaw running on your Raspberry Pi in under 10 minutes with optimized profiles.

## 1. Choose Your Profile

| Pi Model   | RAM   | Use This Profile                        |
| ---------- | ----- | --------------------------------------- |
| Pi 5 (any) | 4/8GB | `raspberry-pi-5`                        |
| Pi 4       | 8GB   | `raspberry-pi-4-8gb`                    |
| Pi 4       | 4GB   | `raspberry-pi-4-4gb` ⭐ **Most common** |
| Pi 4       | 2GB   | `raspberry-pi-4-2gb`                    |

## 2. Deploy (One Command)

```bash
# From your laptop/desktop
git clone https://github.com/mbhatt1/secureclaw.git
cd secureclaw

# Replace with your Pi's hostname and username
./scripts/raspberry-pi/deploy.sh gateway-host pi raspberry-pi-4-4gb
```

This automatically:

- ✅ Installs SecureClaw
- ✅ Applies optimized config
- ✅ Sets up systemd service
- ✅ Configures power optimizations
- ✅ Starts the gateway

## 3. Complete Onboarding

```bash
# SSH into your Pi
ssh pi@gateway-host

# Run onboarding wizard
secureclaw onboard
```

Follow the prompts to:

1. Add API keys (Anthropic, OpenAI, etc.)
2. Configure channels (Telegram recommended)
3. Set up access controls

## 4. Verify

```bash
# Check status
secureclaw status

# View logs
journalctl --user -u secureclaw -f

# Run benchmark
secureclaw doctor --bench
```

## 5. Access Dashboard

### Option A: SSH Tunnel

```bash
# From your laptop
ssh -L 18789:localhost:18789 pi@gateway-host

# Open browser
open http://localhost:18789
```

### Option B: Tailscale (Recommended)

```bash
# On your Pi
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Update config
secureclaw config set gateway.bind tailnet
systemctl --user restart secureclaw
```

Now access from anywhere: `http://gateway-host:18789`

## Troubleshooting

### Out of Memory

```bash
# Add 2GB swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Slow Startup

```bash
# Use lighter profile
cp ~/secureclaw/profiles/raspberry-pi-4-2gb.json ~/.secureclaw/secureclaw.json
systemctl --user restart secureclaw
```

### Can't Connect

```bash
# Check firewall
sudo ufw allow 18789/tcp

# Check gateway is running
systemctl --user status secureclaw

# Check logs
journalctl --user -u secureclaw -n 50
```

## Next Steps

- Read the [full optimization guide](/platforms/OPTIMIZATION-RASPBERRY-PI)
- Explore [configuration options](/gateway/configuration-reference)
- Join the [Discord community](https://discord.gg/clawd)

## Performance Targets

After deployment, you should see:

| Metric     | Target | How to Check                               |
| ---------- | ------ | ------------------------------------------ |
| Startup    | <5s    | `time systemctl --user restart secureclaw` |
| Idle RAM   | <100MB | `ps aux \| grep secureclaw`                |
| Idle Power | <1W    | USB power meter                            |
| Database   | <500MB | `du -h ~/.secureclaw/memory.db`            |

## Common Customizations

### Enable WhatsApp

```bash
secureclaw config set channels.whatsapp.enabled true
secureclaw config set channels.whatsapp.allowFrom '["*"]'
systemctl --user restart secureclaw
```

### Change Model

```bash
secureclaw config set agents.defaults.model.primary "openai/gpt-4o"
```

### Disable Control UI (Save RAM)

```bash
secureclaw config set gateway.controlUI.enabled false
systemctl --user restart secureclaw
```

### Reduce Heartbeat (Save Power)

```bash
secureclaw config set agents.defaults.heartbeat.every "10m"
systemctl --user restart secureclaw
```

## Update

```bash
# From your laptop
./scripts/raspberry-pi/update.sh gateway-host pi
```

Or on the Pi:

```bash
systemctl --user stop secureclaw
npm install -g secureclaw@latest
secureclaw doctor --fix
systemctl --user restart secureclaw
```

## Support

- Documentation: https://docs.secureclaw.app
- Discord: https://discord.gg/clawd
- Issues: https://github.com/mbhatt1/secureclaw/issues
