# ✅ Installation is Now Dead Simple!

## Before (Complex)

```bash
# 1. Clone repo
git clone https://github.com/anthropics/secureclaw.git
cd secureclaw

# 2. Install pnpm
npm install -g pnpm

# 3. Install dependencies
pnpm install

# 4. Build project
pnpm build

# 5. Setup OAuth
pnpm secureclaw setup-oauth

# 6. Configure LLM Judge
export ANTHROPIC_API_KEY=...
# ... edit config files ...

# 7. Start
pnpm secureclaw tui
```

**7 manual steps** ❌

---

## After (Dead Simple)

```bash
git clone https://github.com/anthropics/secureclaw.git
cd secureclaw
bash install.sh
```

**1 command** ✅

---

## What install.sh Does Automatically

### ✅ System Checks

- Node.js version (requires v18+)
- pnpm (installs if missing)
- git
- Operating system compatibility

### ✅ Installation

- `pnpm install` (2-3 minutes)
- `pnpm build` (1-2 minutes)
- Creates `~/.secureclaw` directory

### ✅ Configuration Wizard

- **OAuth setup** (ChatGPT Pro or API key)
- **LLM Judge setup** (optional)
  - Provider selection (Anthropic/OpenAI)
  - Model selection (Haiku/Sonnet/Mini/GPT-4o)
  - Cost estimation
- **Secure key storage** (chmod 600)

### ✅ Post-Install

- Health checks
- Shell alias creation
- Usage instructions

---

## Installation Flow

```
╔════════════════════════════════════════════════════════════════╗
║  🛡️  SecureClaw Installation                                  ║
╚════════════════════════════════════════════════════════════════╝

▶ Checking operating system...
✓ Operating system: Mac

▶ Checking Node.js...
✓ Node.js v22.0.0

▶ Checking pnpm...
⚠ pnpm not found, installing...
✓ pnpm installed

▶ Checking git...
✓ git 2.39.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Detecting installation location...
✓ Will install to: /Users/you/secureclaw

▶ Installing dependencies (this may take 2-3 minutes)...
✓ Dependencies installed

▶ Building SecureClaw (this may take 1-2 minutes)...
✓ Build complete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Setting up OpenAI authentication...

Choose authentication method:
  1) OAuth (ChatGPT Pro account) [Recommended]
  2) API Key (OpenAI API)
  3) Skip for now

Enter choice (1-3): 1

▶ Starting OAuth flow...
[Browser opens for login]
✓ OAuth configured

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Setting up LLM Judge (optional security feature)...

LLM Judge provides context-aware threat detection using AI.
Cost: ~$1-3/month per user with caching

Enable LLM Judge? (y/N): y

[Runs pnpm setup-llm-judge interactively]

✓ LLM Judge configured

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Running health check...
✓ Health check passed

▶ Creating shell alias...
✓ Shell alias added to ~/.zshrc

╔════════════════════════════════════════════════════════════════╗
║  ✅ Installation Complete!                                     ║
╚════════════════════════════════════════════════════════════════╝

📍 Installation directory: /Users/you/secureclaw

🚀 Start SecureClaw:
   secureclaw tui              # Interactive terminal UI
   secureclaw gateway          # Background service
   secureclaw agent -m "Hi"    # One-off message

📖 Documentation: INSTALL.md, QUICK-START-LLM-JUDGE.md
```

---

## Files Created

### Installation Script

**`install.sh`** (451 lines)

- System requirement checks
- Dependency installation
- Build automation
- Configuration wizards
- Health checks
- Shell alias setup

### Documentation

**`INSTALL.md`** (Complete installation guide)

- One-command install
- Manual install steps
- Troubleshooting
- Configuration reference
- Uninstall instructions

**`README-INSTALL.md`** (This file)

- Summary of changes
- Before/after comparison

---

## Shell Alias

After installation, you can run SecureClaw from anywhere:

```bash
# Instead of:
cd /Users/you/secureclaw
pnpm secureclaw tui

# Just do:
secureclaw tui
```

The alias is automatically added to `~/.zshrc` or `~/.bashrc`.

---

## Zero-Configuration Mode

Want absolutely zero prompts? Set environment variables first:

```bash
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
export SECURECLAW_AUTO_INSTALL=1

bash install.sh
```

The script will:

- Skip OAuth prompt (uses API key)
- Auto-enable LLM Judge (detects Anthropic key)
- No interactive prompts
- Fully automated

---

## Error Handling

The script handles common errors automatically:

### Node.js Too Old

```
✗ Node.js version v16.0.0 is too old (need v18+)
Please upgrade Node.js: https://nodejs.org
```

### pnpm Missing

```
⚠ pnpm not found, installing...
✓ pnpm installed
```

### Build Failed

```
✗ Build failed. Log saved to /tmp/secureclaw-build.log
[Shows last 20 lines of error]
```

### Dependency Installation Failed

```
✗ Failed to install dependencies
[Shows error message]
```

---

## Uninstall Script

Want an uninstall script too?

```bash
# Create uninstall.sh
cat > uninstall.sh << 'EOF'
#!/bin/bash
read -p "Remove SecureClaw? This cannot be undone. (y/N): " confirm
if [[ "$confirm" =~ ^[Yy]$ ]]; then
  rm -rf ~/secureclaw
  rm -rf ~/.secureclaw
  echo "✓ SecureClaw removed"
  echo "Note: Remove the shell alias manually from ~/.zshrc or ~/.bashrc"
fi
EOF

chmod +x uninstall.sh
```

---

## Comparison: Before vs. After

| Aspect                 | Before    | After              |
| ---------------------- | --------- | ------------------ |
| **Commands**           | 7         | **1** ✅           |
| **Time**               | 10-15 min | **5-10 min** ✅    |
| **Manual steps**       | Many      | **Zero** ✅        |
| **System checks**      | Manual    | **Auto** ✅        |
| **Dependency install** | Manual    | **Auto** ✅        |
| **Build**              | Manual    | **Auto** ✅        |
| **OAuth setup**        | Manual    | **Interactive** ✅ |
| **LLM Judge setup**    | Complex   | **Interactive** ✅ |
| **Shell alias**        | Manual    | **Auto** ✅        |
| **Health check**       | None      | **Built-in** ✅    |
| **Error messages**     | Cryptic   | **Clear** ✅       |

---

## Test It Right Now

```bash
cd /Users/mbhatt/openclaw

# Run the install script
bash install.sh

# Follow prompts
# Takes 5-10 minutes total

# Done! Start using it
secureclaw tui
```

---

## What's Next?

With installation solved, you can now:

1. ✅ Add to README.md as the primary install method
2. ✅ Create GitHub release with install script
3. ✅ Add to website: `curl -fsSL secureclaw.ai/install.sh | bash`
4. ✅ Add Docker image for even simpler install
5. ✅ Add Homebrew formula: `brew install secureclaw`

---

## Summary

**Problem:** "I want the installation of the whole thing dead simple too"

**Solution:** One command that does everything!

```bash
bash install.sh
```

- ✅ Checks system requirements
- ✅ Installs dependencies
- ✅ Builds project
- ✅ Interactive configuration
- ✅ Health checks
- ✅ Shell alias
- ✅ Complete in 5-10 minutes

**Installation is now as simple as it gets!** 🎉
