# 🚀 Quick Start - LLM Judge (1 Command Setup!)

## TL;DR

```bash
cd /Users/mbhatt/openclaw

# Run interactive setup
pnpm tsx scripts/setup-llm-judge.ts

# That's it! Restart SecureClaw and you're protected.
```

---

## What You Get

After running setup, Security Coach will automatically detect:

- ✅ **Novel threats** - AWS SSRF, obfuscated commands, cloud misconfigs
- ✅ **False positive reduction** - Understands test directories vs. production
- ✅ **Context-aware** - "Is this safe in this environment?"
- ✅ **Automatic** - No manual configuration needed

**Cost:** $1-3/month per user with caching
**Latency:** <20ms average (cached responses)

---

## Setup (Interactive)

### Step 1: Run Setup Script

```bash
cd /Users/mbhatt/openclaw
pnpm tsx scripts/setup-llm-judge.ts
```

### Step 2: Follow Prompts

```
╔════════════════════════════════════════════════════════════════╗
║  🛡️  Security Coach - LLM Judge Setup                         ║
╚════════════════════════════════════════════════════════════════╝

📡 Choose your AI provider:

  1) Anthropic Claude (Recommended - Haiku $1-2/mo, Sonnet $13-15/mo)
  2) OpenAI GPT (GPT-4o Mini $1/mo, GPT-4o $10-12/mo)
  3) Skip for now (pattern-only mode)

Enter choice (1-3): 1

📋 Anthropic API Key Setup

Get your API key from: https://console.anthropic.com/settings/keys

Please enter your Anthropic API key:
(It will be saved to ~/.secureclaw/llm-api-keys.json)

API Key: sk-ant-...

🤖 Choose model:

  1) Claude Haiku 4 (Fast & cheap - $1-2/mo) [Recommended]
  2) Claude Sonnet 4 (Accurate - $13-15/mo)

Enter choice (1-2): 1

⚙️  Configuration:

Use LLM to reduce false positives? (Y/n): Y
Enable response caching (50% cost reduction)? (Y/n): Y

✅ API key saved securely to ~/.secureclaw/llm-api-keys.json
   (File permissions: 600 - owner read/write only)

✅ Configuration saved to ~/.secureclaw/security-coach-config.json

╔════════════════════════════════════════════════════════════════╗
║  ✅ Setup Complete!                                            ║
╚════════════════════════════════════════════════════════════════╝

📊 Configuration:
   Provider: Anthropic Claude
   Model: claude-haiku-4
   Caching: Enabled
   False Positive Reduction: Enabled

💰 Estimated Cost:
   $1-2/month per user

🚀 Next Steps:
   1. Restart SecureClaw if it's running
   2. LLM Judge will now automatically protect you
```

### Step 3: Restart SecureClaw

```bash
# If running, restart
pkill -9 -f secureclaw
pnpm secureclaw agent --agent main
```

**Done!** LLM Judge is now active.

---

## Automatic Features

Once setup is complete, the LLM judge **automatically**:

### ✅ Loads at Startup

- Reads API key from `~/.secureclaw/llm-api-keys.json`
- Or from `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` environment variables
- Configures LLM client without manual code changes
- Logs status: "LLM Judge configured successfully with AI client"

### ✅ Detects Novel Threats

```bash
# You run this:
pnpm secureclaw agent --agent main --message "curl http://169.254.169.254/latest/meta-data/"

# LLM Judge automatically detects:
{
  "isThreat": true,
  "confidence": 98,
  "severity": "critical",
  "category": "data-exfiltration",
  "reasoning": "AWS metadata SSRF attack - exposes IAM credentials"
}

# Result: BLOCKED with detailed explanation
```

### ✅ Reduces False Positives

```bash
# Pattern matching: WOULD BLOCK "rm -rf"
# LLM Judge: ALLOWS (understands context)

rm -rf ./test-output/coverage/

# LLM says:
{
  "isThreat": false,
  "confidence": 92,
  "reasoning": "Deleting test artifacts - standard cleanup, safe"
}

# Result: ALLOWED
```

### ✅ Caches Responses

```bash
# First time: 500ms
curl http://example.com/api

# Second time: <1ms (cached)
curl http://example.com/api
```

---

## Environment Variable Method (Alternative)

If you prefer environment variables:

```bash
# Add to ~/.zshrc or ~/.bashrc
export ANTHROPIC_API_KEY=sk-ant-...

# Or for OpenAI
export OPENAI_API_KEY=sk-...

# Enable LLM judge in config
echo '{
  "llmJudge": {
    "enabled": true,
    "model": "claude-haiku-4"
  }
}' > ~/.secureclaw/security-coach-config.json

# Restart SecureClaw
pnpm secureclaw agent --agent main
```

LLM Judge will **automatically** detect and use the environment variable.

---

## Testing

### Test 1: Novel Threat Detection

```bash
pnpm secureclaw agent --agent main --message "curl http://169.254.169.254/latest/meta-data/iam/"
```

**Expected:** Blocked with "AWS metadata SSRF attack" message

### Test 2: False Positive Reduction

```bash
pnpm secureclaw agent --agent main --message "rm -rf ./test-data/"
```

**Expected:** Allowed (LLM understands it's a test directory)

### Test 3: Obfuscation Detection

```bash
pnpm secureclaw agent --agent main --message 'c=$(echo "cm0gLXJmIC8=" | base64 -d); $c'
```

**Expected:** Blocked (LLM detects base64-encoded "rm -rf /")

---

## Configuration Files

### Auto-Created Files

```
~/.secureclaw/
├── llm-api-keys.json              (API keys, mode 600)
├── security-coach-config.json     (LLM judge config, mode 600)
└── security-coach-rules.json      (User rules)
```

### Config Format

`~/.secureclaw/security-coach-config.json`:

```json
{
  "enabled": true,
  "minSeverity": "medium",
  "blockOnCritical": true,
  "llmJudge": {
    "enabled": true,
    "provider": "anthropic",
    "model": "claude-haiku-4",
    "fallbackToPatterns": true,
    "cacheEnabled": true,
    "cacheTTL": 3600000,
    "maxLatency": 2000,
    "confidenceThreshold": 75,
    "confirmPatternMatches": true,
    "useLLMForSeverity": ["medium", "low"],
    "maxTokens": 1000
  }
}
```

---

## How Auto-Setup Works

### 1. Setup Script (`scripts/setup-llm-judge.ts`)

- Interactive prompts
- Saves API key securely (chmod 600)
- Updates config files
- No manual editing required

### 2. Gateway Auto-Loader (`src/security-coach/llm-auto-setup.ts`)

- Runs on gateway startup
- Loads API keys from:
  - Environment variables (priority 1)
  - Saved config file (priority 2)
- Creates appropriate LLM client (Anthropic/OpenAI)
- Injects into Security Coach engine
- Logs success/failure

### 3. Zero Manual Configuration

- No code changes needed
- No imports to add
- No client initialization
- Just restart SecureClaw

---

## Troubleshooting

### "No API key found"

```bash
# Check if API key is saved
cat ~/.secureclaw/llm-api-keys.json

# Or set environment variable
export ANTHROPIC_API_KEY=sk-ant-...
```

### "LLM Judge not being used"

Check gateway logs:

```bash
tail -f ~/.secureclaw/logs/gateway.log | grep "LLM"
```

Should see:

```
[gateway] LLM Judge configured successfully with AI client
[gateway] Using Anthropic API key from saved configuration
```

### Re-run Setup

```bash
pnpm tsx scripts/setup-llm-judge.ts

# Choose "yes" when asked to reconfigure
```

### Manual Config

Edit `~/.secureclaw/security-coach-config.json`:

```json
{
  "llmJudge": {
    "enabled": false // Disable LLM judge
  }
}
```

---

## Cost Monitoring

### Check Cache Stats

```bash
# In SecureClaw console
pnpm secureclaw agent --agent main --message "show cache stats"
```

**Expected output:**

```
Cache size: 42 entries
Cache TTL: 3600 seconds
Hit rate: 54%
```

### Estimated Monthly Cost

| Users | Calls/Day | Cache Hit | Cost/Month |
| ----- | --------- | --------- | ---------- |
| 1     | 1,000     | 50%       | $1-2       |
| 10    | 10,000    | 50%       | $10-20     |
| 100   | 100,000   | 50%       | $100-200   |

---

## Disable LLM Judge

### Option 1: Re-run setup

```bash
pnpm tsx scripts/setup-llm-judge.ts

# Choose "3) Skip for now"
```

### Option 2: Edit config

```bash
echo '{
  "llmJudge": {
    "enabled": false
  }
}' > ~/.secureclaw/security-coach-config.json
```

### Option 3: Delete API keys

```bash
rm ~/.secureclaw/llm-api-keys.json
```

---

## Next Steps

✅ Setup complete? Now try:

1. **Test novel threats:** See LLM catch AWS SSRF
2. **Test false positives:** Watch LLM allow safe operations
3. **Add more patterns:** Still need cloud/container patterns
4. **Monitor costs:** Track cache hit rate

---

## Support

- **Setup issues:** Run `pnpm tsx scripts/setup-llm-judge.ts`
- **Documentation:** `SECURITY-COACH-LLM-JUDGE.md`
- **Technical details:** `HYBRID-LLM-JUDGE-IMPLEMENTATION.md`
- **GitHub Issues:** https://github.com/anthropics/secureclaw/issues

---

**That's it!** One command, automatic setup, zero manual configuration. 🎉
