# Environment Variables Reference

Complete reference of all SecureClaw environment variables.

## Configuration Loading

Environment variables are loaded with the following precedence (highest to lowest):

1. **Process environment** (e.g., `SECURECLAW_GATEWAY_PORT=8080`)
2. **Local .env file** (`./env` in current directory)
3. **User .env file** (`~/.secureclaw/.env`)
4. **Profile .env file** (e.g., `.env.pi` for Raspberry Pi)
5. **Config file** (`~/.secureclaw/secureclaw.json`)

## Gateway Configuration

| Variable                                   | Type   | Default | Description                                            |
| ------------------------------------------ | ------ | ------- | ------------------------------------------------------ |
| `SECURECLAW_GATEWAY_PORT`                  | number | 18789   | Gateway server port                                    |
| `SECURECLAW_GATEWAY_TOKEN`                 | string | -       | Gateway authentication token                           |
| `SECURECLAW_GATEWAY_PASSWORD`              | string | -       | Gateway authentication password (alternative to token) |
| `SECURECLAW_GATEWAY_MAX_PAYLOAD_BYTES`     | number | 8388608 | Max WebSocket payload size (8MB)                       |
| `SECURECLAW_GATEWAY_HANDSHAKE_TIMEOUT_MS`  | number | 10000   | WebSocket handshake timeout                            |
| `SECURECLAW_GATEWAY_MESSAGE_BUFFER_SIZE`   | number | 1000    | Message buffer size                                    |
| `SECURECLAW_GATEWAY_MESSAGE_BUFFER_TTL_MS` | number | 300000  | Message buffer TTL (5 minutes)                         |

## Agent Configuration

| Variable                              | Type    | Default | Description                     |
| ------------------------------------- | ------- | ------- | ------------------------------- |
| `SECURECLAW_AGENT_MAX_CONCURRENT`     | number  | 4       | Max concurrent agent instances  |
| `SECURECLAW_AGENT_THINKING_ENABLED`   | boolean | false   | Enable agent thinking mode      |
| `SECURECLAW_AGENT_VOICE_ENABLED`      | boolean | false   | Enable agent voice capabilities |
| `SECURECLAW_AGENT_MAX_CONTEXT_TOKENS` | number  | 100000  | Max context window tokens       |

## Memory & Embeddings

| Variable                                  | Type    | Default | Description                          |
| ----------------------------------------- | ------- | ------- | ------------------------------------ |
| `SECURECLAW_MEMORY_CACHE_MAX_ENTRIES`     | number  | 5000    | Max embedding cache entries          |
| `SECURECLAW_MEMORY_SYNC_BATCH_SIZE`       | number  | 50      | Memory sync batch size               |
| `SECURECLAW_EMBEDDING_CACHE_MAX_MB`       | number  | 50      | Max embedding cache size (MB)        |
| `SECURECLAW_MEMORY_SYNC_WATCH`            | boolean | false   | Enable file watching for memory sync |
| `SECURECLAW_MEMORY_SYNC_INTERVAL_MINUTES` | number  | 30      | Memory sync interval (minutes)       |

## Session Management

| Variable                                  | Type    | Default | Description               |
| ----------------------------------------- | ------- | ------- | ------------------------- |
| `SECURECLAW_SESSION_MANAGER_CACHE_TTL_MS` | number  | 45000   | Session manager cache TTL |
| `SECURECLAW_SESSION_PRELOAD_ENABLED`      | boolean | false   | Enable session preloading |

## Security Coach

| Variable                                          | Type   | Default | Description                 |
| ------------------------------------------------- | ------ | ------- | --------------------------- |
| `SECURECLAW_SECURITY_COACH_LLM_CACHE_MAX_ENTRIES` | number | 1000    | LLM judge cache max entries |
| `SECURECLAW_SECURITY_COACH_LLM_CACHE_TTL_MS`      | number | 3600000 | LLM cache TTL (1 hour)      |
| `SECURECLAW_SECURITY_COACH_LLM_MAX_LATENCY_MS`    | number | 2000    | Max LLM latency             |

## WebSocket Configuration

| Variable                        | Type   | Default | Description                          |
| ------------------------------- | ------ | ------- | ------------------------------------ |
| `SECURECLAW_WS_MAX_CONNECTIONS` | number | 20      | Max concurrent WebSocket connections |
| `SECURECLAW_WS_IDLE_TIMEOUT_MS` | number | 300000  | WebSocket idle timeout (5 minutes)   |
| `SECURECLAW_WS_MAX_PAYLOAD_MB`  | number | 16      | Max WebSocket payload (MB)           |

## Memory Monitoring

| Variable                                  | Type    | Default | Description                  |
| ----------------------------------------- | ------- | ------- | ---------------------------- |
| `SECURECLAW_MEMORY_MONITOR_ENABLED`       | boolean | true    | Enable memory monitoring     |
| `SECURECLAW_MEMORY_MAX_HEAP_MB`           | number  | 450     | Max heap size (MB)           |
| `SECURECLAW_MEMORY_WARNING_THRESHOLD_PCT` | number  | 80      | Memory warning threshold (%) |
| `SECURECLAW_MEMORY_CHECK_INTERVAL_MS`     | number  | 30000   | Memory check interval        |

## Media Processing

| Variable                            | Type    | Default | Description             |
| ----------------------------------- | ------- | ------- | ----------------------- |
| `SECURECLAW_MEDIA_IMAGE_MAX_WIDTH`  | number  | 1920    | Max image width         |
| `SECURECLAW_MEDIA_IMAGE_MAX_HEIGHT` | number  | 1080    | Max image height        |
| `SECURECLAW_MEDIA_IMAGE_QUALITY`    | number  | 80      | Image quality (0-100)   |
| `SECURECLAW_MEDIA_VIDEO_ENABLED`    | boolean | false   | Enable video processing |

## SQLite Configuration

| Variable                       | Type    | Default | Description                     |
| ------------------------------ | ------- | ------- | ------------------------------- |
| `SECURECLAW_SQLITE_WAL_MODE`   | boolean | true    | Enable WAL mode                 |
| `SECURECLAW_SQLITE_CACHE_SIZE` | number  | -2000   | SQLite cache size (-2000 = 2MB) |
| `SECURECLAW_SQLITE_MMAP_SIZE`  | number  | 0       | SQLite mmap size (0 = disabled) |

## Logging

| Variable                     | Type   | Default | Description                          |
| ---------------------------- | ------ | ------- | ------------------------------------ |
| `SECURECLAW_LOG_LEVEL`       | string | info    | Log level (debug, info, warn, error) |
| `SECURECLAW_LOG_MAX_FILES`   | number | 7       | Max log files to retain              |
| `SECURECLAW_LOG_MAX_SIZE_MB` | number | 50      | Max log file size (MB)               |

## Paths

| Variable                 | Type   | Default                       | Description                 |
| ------------------------ | ------ | ----------------------------- | --------------------------- |
| `SECURECLAW_STATE_DIR`   | string | ~/.secureclaw                 | State directory path        |
| `SECURECLAW_CONFIG_PATH` | string | ~/.secureclaw/secureclaw.json | Config file path            |
| `SECURECLAW_HOME`        | string | ~                             | Home directory override     |
| `SECURECLAW_OAUTH_DIR`   | string | ~/.secureclaw/credentials     | OAuth credentials directory |

## System Integration

| Variable                          | Type    | Default | Description                                         |
| --------------------------------- | ------- | ------- | --------------------------------------------------- |
| `SECURECLAW_LOAD_SHELL_ENV`       | boolean | false   | Import missing keys from shell profile              |
| `SECURECLAW_SHELL_ENV_TIMEOUT_MS` | number  | 15000   | Shell env loading timeout                           |
| `SECURECLAW_NIX_MODE`             | boolean | false   | Enable Nix mode                                     |
| `SECURECLAW_PROFILE`              | string  | -       | Config profile to load (e.g., "raspberry-pi-4-4gb") |

## Model Provider API Keys

| Variable             | Description           |
| -------------------- | --------------------- |
| `OPENAI_API_KEY`     | OpenAI API key        |
| `ANTHROPIC_API_KEY`  | Anthropic API key     |
| `GEMINI_API_KEY`     | Google Gemini API key |
| `OPENROUTER_API_KEY` | OpenRouter API key    |
| `ZAI_API_KEY`        | ZAI API key           |
| `AI_GATEWAY_API_KEY` | AI Gateway API key    |
| `MINIMAX_API_KEY`    | MiniMax API key       |
| `SYNTHETIC_API_KEY`  | Synthetic API key     |

## Channel Tokens

| Variable                         | Description           |
| -------------------------------- | --------------------- |
| `TELEGRAM_BOT_TOKEN`             | Telegram bot token    |
| `DISCORD_BOT_TOKEN`              | Discord bot token     |
| `SLACK_BOT_TOKEN`                | Slack bot token       |
| `SLACK_APP_TOKEN`                | Slack app token       |
| `MATTERMOST_BOT_TOKEN`           | Mattermost bot token  |
| `MATTERMOST_URL`                 | Mattermost server URL |
| `ZALO_BOT_TOKEN`                 | Zalo bot token        |
| `SECURECLAW_TWITCH_ACCESS_TOKEN` | Twitch access token   |

## Tools & Services

| Variable             | Description                    |
| -------------------- | ------------------------------ |
| `BRAVE_API_KEY`      | Brave Search API key           |
| `PERPLEXITY_API_KEY` | Perplexity API key             |
| `FIRECRAWL_API_KEY`  | Firecrawl API key              |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS API key         |
| `XI_API_KEY`         | ElevenLabs TTS API key (alias) |
| `DEEPGRAM_API_KEY`   | Deepgram transcription API key |

## Legacy/Compatibility

These variables are supported for backwards compatibility:

- `OPENCLAW_*` - Legacy OpenClaw prefix
- `CLAWDBOT_*` - Legacy ClawdBot prefix
- `CLAUDE_CODE_*` - Legacy Claude Code prefix

## Profile-Specific Configuration

### Raspberry Pi Profile (.env.pi)

The `.env.pi` file contains optimized settings for Raspberry Pi deployments:

```bash
# Node.js memory limits
NODE_OPTIONS="--max-old-space-size=450 --max-semi-space-size=16"

# Memory-constrained settings
SECURECLAW_MEMORY_CACHE_MAX_ENTRIES=5000
SECURECLAW_MEMORY_SYNC_BATCH_SIZE=50
SECURECLAW_EMBEDDING_CACHE_MAX_MB=50
SECURECLAW_MEMORY_SYNC_WATCH=false
SECURECLAW_MEMORY_SYNC_INTERVAL_MINUTES=30

# Gateway optimizations
SECURECLAW_GATEWAY_MESSAGE_BUFFER_SIZE=1000
SECURECLAW_GATEWAY_MESSAGE_BUFFER_TTL_MS=300000

# Agent limits
SECURECLAW_AGENT_THINKING_ENABLED=false
SECURECLAW_AGENT_VOICE_ENABLED=false
SECURECLAW_AGENT_MAX_CONTEXT_TOKENS=100000

# Media processing limits
SECURECLAW_MEDIA_IMAGE_MAX_WIDTH=1920
SECURECLAW_MEDIA_IMAGE_MAX_HEIGHT=1080
SECURECLAW_MEDIA_IMAGE_QUALITY=80
SECURECLAW_MEDIA_VIDEO_ENABLED=false

# Logging
SECURECLAW_LOG_LEVEL=info
SECURECLAW_LOG_MAX_FILES=7
SECURECLAW_LOG_MAX_SIZE_MB=50

# SQLite optimizations
SECURECLAW_SQLITE_WAL_MODE=true
SECURECLAW_SQLITE_CACHE_SIZE=-2000
SECURECLAW_SQLITE_MMAP_SIZE=0
```

## Type Conversions

### Boolean Values

Accepted boolean values (case-insensitive):

- **True**: `true`, `1`, `yes`
- **False**: `false`, `0`, `no`

### Number Values

Numbers should be valid integers or floats. Invalid values fall back to defaults.

### String Values

String values are used as-is after trimming whitespace.

## See Also

- [Configuration Guide](./configuration.md)
- [Raspberry Pi Deployment](./raspberry-pi.md)
- [Security Best Practices](./security.md)
