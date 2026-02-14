# 🚀 SecureClaw - Dead Simple Installation

## One-Command Install

```bash
git clone https://github.com/anthropics/secureclaw.git
cd secureclaw
bash install.sh
```

**That's it!** The script automatically:

- ✅ Checks system requirements
- ✅ Installs pnpm if needed
- ✅ Installs dependencies
- ✅ Builds the project
- ✅ Sets up OAuth/API keys
- ✅ Configures LLM Judge (optional)
- ✅ Creates shell alias
- ✅ Runs health checks

**Total time:** 5-10 minutes

---

## What install.sh Does

### 1. System Checks ✅

```
▶ Checking operating system...
✓ Operating system: Mac

▶ Checking Node.js...
✓ Node.js v22.0.0

▶ Checking pnpm...
✓ pnpm 8.15.0

▶ Checking git...
✓ git 2.39.0
```

### 2. Installation ⚙️

```
▶ Installing dependencies (2-3 minutes)...
✓ Dependencies installed

▶ Building SecureClaw (1-2 minutes)...
✓ Build complete
```

### 3. Configuration 🔧

```
▶ Setting up OpenAI authentication...

Choose authentication method:
  1) OAuth (ChatGPT Pro account) [Recommended]
  2) API Key (OpenAI API)
  3) Skip for now

Enter choice (1-3): 1

▶ Starting OAuth flow...
✓ OAuth configured

▶ Setting up LLM Judge (optional security feature)...

Enable LLM Judge? (y/N): y

▶ Running interactive setup...
✓ LLM Judge configured
```

### 4. Health Check ✅

```
▶ Running health check...
✓ Health check passed

▶ Creating shell alias...
✓ Shell alias added to ~/.zshrc
```

### 5. Success! 🎉

```
╔════════════════════════════════════════════════════════════════╗
║  ✅ Installation Complete!                                     ║
╚════════════════════════════════════════════════════════════════╝

🚀 Start SecureClaw:
   secureclaw agent --agent main

📖 Documentation: README.md, QUICK-START-LLM-JUDGE.md
```

---

## Alternative: Manual Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/anthropics/secureclaw.git
cd secureclaw
```

### Step 2: Install Dependencies

```bash
npm install -g pnpm  # If pnpm not installed
pnpm install
```

### Step 3: Build

```bash
pnpm build
```

### Step 4: Configure OAuth

```bash
pnpm secureclaw setup-oauth
```

### Step 5: (Optional) Configure LLM Judge

```bash
pnpm setup-llm-judge
```

### Step 6: Run

```bash
pnpm secureclaw agent --agent main
```

---

## Requirements

### System Requirements

- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **OS:** macOS or Linux (Windows via WSL)
- **Memory:** 2GB RAM minimum
- **Disk:** 500MB for installation

### Accounts (Optional but Recommended)

- **OpenAI:** ChatGPT Pro account (OAuth) or API key
- **Anthropic:** API key (for LLM Judge) - Get from https://console.anthropic.com

---

## Post-Installation

### Start SecureClaw

**Interactive Terminal UI (Recommended):**

```bash
secureclaw tui
```

**Gateway Service (Background):**

```bash
secureclaw gateway
```

**One-off Message:**

```bash
secureclaw agent --agent main -m "Hello, SecureClaw!"
```

### Test It

```bash
secureclaw agent --agent main -m "Hello, SecureClaw!"
```

**Expected output:**

```
🛡️  SecureClaw v2026.2.13

Agent: main
Message: Hello, SecureClaw!

Response: Hello! I'm SecureClaw, your AI-powered security assistant...
```

### Configure LLM Judge (If Skipped During Install)

```bash
cd /path/to/secureclaw
pnpm setup-llm-judge
```

---

## Troubleshooting

### "Node.js is not installed"

**Fix:**

```bash
# macOS
brew install node

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or download from: https://nodejs.org
```

### "pnpm not found"

**Fix:**

```bash
npm install -g pnpm
```

### "Build failed"

**Fix:**

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

Check build log: `/tmp/secureclaw-build.log`

### "OAuth failed"

**Fix:**

```bash
# Re-run OAuth setup
pnpm secureclaw setup-oauth

# Or use API key instead
echo '{"openai": {"apiKey": "sk-..."}}' > ~/.secureclaw/models.json
chmod 600 ~/.secureclaw/models.json
```

### "secureclaw command not found" ⚠️ MOST COMMON ISSUE

**This happens after installation because your shell hasn't reloaded the alias yet.**

**Fix - Choose one:**

```bash
# Option 1: Reload shell config (RECOMMENDED)
source ~/.zshrc  # if using zsh
source ~/.bashrc # if using bash

# Option 2: Open a new terminal window (also works)

# Option 3: Use the full command instead (works immediately)
cd /path/to/secureclaw
pnpm secureclaw agent --agent main
```

**Why this happens:**
The install script adds the `secureclaw` alias to your shell config file (`~/.zshrc` or `~/.bashrc`), but your current terminal session was opened before the alias was added. Reloading the config or opening a new terminal loads the alias.

### Check Installation Health

```bash
cd /path/to/secureclaw

# Check build artifacts
ls -la dist/

# Check configuration
ls -la ~/.secureclaw/

# Check dependencies
pnpm list --depth=0

# Run tests
pnpm test
```

---

## Uninstall

```bash
# Remove installation
rm -rf /path/to/secureclaw

# Remove configuration
rm -rf ~/.secureclaw

# Remove shell alias
# Edit ~/.zshrc or ~/.bashrc and remove the "alias secureclaw=" line

# Remove pnpm (optional)
npm uninstall -g pnpm
```

---

## Update SecureClaw

```bash
cd /path/to/secureclaw

# Pull latest changes
git pull origin main

# Reinstall dependencies
pnpm install

# Rebuild
pnpm build

# Restart
pnpm secureclaw agent --agent main
```

---

## Configuration Files

After installation, these files are created:

```
~/.secureclaw/
├── secureclaw.json                # Main configuration
├── models.json                    # API keys (if using API key auth)
├── llm-api-keys.json              # LLM Judge API keys
├── security-coach-config.json     # Security Coach configuration
├── security-coach-rules.json      # User security rules
└── logs/
    └── gateway.log                # Gateway logs
```

---

## Next Steps

1. **Read Documentation**
   - `README.md` - Getting started
   - `QUICK-START-LLM-JUDGE.md` - LLM Judge setup
   - `SECURITY-COACH-LLM-JUDGE.md` - Security features

2. **Try Examples**

   ```bash
   # Ask a question
   secureclaw agent --agent main --message "What is SecureClaw?"

   # Test security detection
   secureclaw agent --agent main --message "rm -rf /"
   ```

3. **Configure Features**
   - Enable/disable Security Coach
   - Configure SIEM integration
   - Set up custom rules

4. **Integrate with Tools**
   - VS Code extension
   - Slack integration
   - WhatsApp integration

---

## Support

- **GitHub Issues:** https://github.com/anthropics/secureclaw/issues
- **Documentation:** https://docs.secureclaw.ai
- **Discord:** https://discord.gg/secureclaw
- **Email:** support@secureclaw.ai

---

## Quick Reference

```bash
# Install
git clone https://github.com/anthropics/secureclaw.git
cd secureclaw
bash install.sh

# Run
secureclaw agent --agent main

# Configure
pnpm setup-llm-judge           # LLM Judge
pnpm secureclaw setup-oauth    # OAuth

# Update
git pull && pnpm install && pnpm build

# Uninstall
rm -rf secureclaw ~/.secureclaw
```

---

**Installation made dead simple!** 🚀
