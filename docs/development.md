# Development Guide

## Getting Started

### Prerequisites

- **Node.js:** v22.0.0 or higher
- **Package Manager:** pnpm (recommended), npm, or bun
- **Git:** Latest version
- **OS:** macOS, Linux, or Windows (via WSL2)

### Clone and Setup

```bash
# Clone repository
git clone https://github.com/mbhatt1/secureclaw.git
cd secureclaw

# Install dependencies
pnpm install

# Build project
pnpm build

# Run tests
pnpm test

# Start development server
pnpm dev
```

## Project Structure

```
secureclaw/
├── src/                    # Source code
│   ├── gateway/           # Gateway server
│   ├── security-coach/    # Security Coach engine
│   ├── channels/          # Channel integrations
│   ├── skills/            # Built-in skills
│   └── cli/               # CLI commands
├── apps/                   # Platform apps
│   ├── macos/             # macOS desktop app
│   ├── ios/               # iOS app
│   └── android/           # Android app
├── docs/                   # Documentation
├── profiles/              # Configuration profiles
├── scripts/               # Build and deployment scripts
└── tests/                 # Test suites
```

## Development Workflow

### Building

```bash
# Full build
pnpm build

# Build specific package
pnpm build --filter @secureclaw/gateway

# Watch mode (auto-rebuild)
pnpm dev
```

### Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/security-coach/patterns.test.ts

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

### Code Quality

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Type checking
pnpm typecheck

# Run all checks
pnpm check
```

## Contributing

### How to Contribute

1. **Bugs & small fixes** → Open a PR!
2. **New features / architecture** → Start a [GitHub Discussion](https://github.com/mbhatt1/secureclaw/discussions) or ask in Discord first
3. **Questions** → Discord #setup-help

### Before You PR

- Test locally with your SecureClaw instance
- Run tests: `pnpm build && pnpm check && pnpm test`
- Ensure CI checks pass
- Keep PRs focused (one thing per PR)
- Describe what & why

### AI/Vibe-Coded PRs Welcome

Built with Codex, Claude, or other AI tools? Awesome - just mark it!

Please include in your PR:

- [ ] Mark as AI-assisted in the PR title or description
- [ ] Note the degree of testing (untested / lightly tested / fully tested)
- [ ] Include prompts or session logs if possible (super helpful!)
- [ ] Confirm you understand what the code does

AI PRs are first-class citizens here. We just want transparency so reviewers know what to look for.

## Performance Optimization

### General Guidelines

1. **Profile first** - Don't optimize without data
2. **Measure impact** - Benchmark before and after
3. **Target platforms** - Consider Raspberry Pi and resource-constrained devices
4. **Memory efficiency** - Minimize allocations and use caching wisely
5. **Lazy loading** - Load modules only when needed

### Optimization Areas

#### CPU Optimization

**Pattern Matching:**

- Pre-compile regex patterns
- Use early termination for critical matches
- Cache pattern results for repeated inputs
- Consider using faster pattern matching algorithms

**Security Coach:**

- Optimize threat pattern matching (150+ patterns)
- Cache LLM responses (50-80% hit rate typical)
- Use parallel evaluation where possible
- Profile with `node --prof` for bottlenecks

#### Memory Optimization

**Target:** <500MB RAM usage on Raspberry Pi 4

**Strategies:**

- Use WeakMap/WeakSet for caches
- Implement TTL-based cache eviction
- Avoid circular references
- Use streaming for large data
- Monitor heap size: `node --max-old-space-size=512`

**Caching:**

```typescript
// Good: TTL-based cache
class TTLCache<K, V> {
  private cache = new Map<K, { value: V; expires: number }>();

  set(key: K, value: V, ttl: number) {
    this.cache.set(key, { value, expires: Date.now() + ttl });
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }
}
```

#### I/O Optimization

**Database:**

- Use prepared statements
- Batch operations when possible
- Enable SQLite WAL mode: `PRAGMA journal_mode=WAL`
- Tune cache size: `PRAGMA cache_size=-10000` (10MB)

**Network:**

- Implement connection pooling
- Use keep-alive for HTTP connections
- Batch API requests
- Compress responses

#### Dependency Optimization

**Bundle Size:**

- Use dynamic imports for optional features
- Tree-shake unused code
- Analyze bundle: `pnpm analyze`
- Consider lighter alternatives:
  - `date-fns` → `date-fns/esm` (tree-shakeable)
  - `lodash` → `lodash-es` (tree-shakeable)
  - Heavy libraries → Native alternatives

**Example: Dynamic Imports**

```typescript
// Bad: Always loads heavy dependency
import { renderPDF } from "pdf-lib";

// Good: Load only when needed
async function generatePDF() {
  const { renderPDF } = await import("pdf-lib");
  return renderPDF();
}
```

### Raspberry Pi Optimization

For Raspberry Pi deployment, use optimized configuration profiles:

```bash
# Use Pi-specific profile
secureclaw gateway --profile raspberry-pi-4-4gb
```

**Key optimizations:**

- Reduced memory limits
- Lazy module loading
- Power-efficient polling
- Swap configuration for <4GB RAM
- ARM NEON SIMD acceleration (Pi 5)

See [Raspberry Pi Guide](./raspberry-pi.md) for details.

## Coding Standards

### TypeScript

- Use strict mode (`strict: true`)
- Prefer `const` over `let`
- Use type inference where possible
- Document complex types

```typescript
// Good
interface UserConfig {
  /** User's display name */
  name: string;
  /** Optional email for notifications */
  email?: string;
}

// Bad
let config: any = { name: "John" };
```

### Error Handling

```typescript
// Good: Specific error handling
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof NetworkError) {
    log.warn("Network error, retrying...");
    await retry();
  } else {
    throw error;
  }
}

// Bad: Silent failures
try {
  await riskyOperation();
} catch {
  // Silently ignored
}
```

### Logging

```typescript
import { log } from "./logger.js";

// Use appropriate log levels
log.debug("Detailed debug info");
log.info("Normal operation");
log.warn("Warning, but not critical");
log.error("Error occurred", { error });

// Don't log sensitive data
log.info("User authenticated", { userId }); // Good
log.info("User authenticated", { password }); // BAD!
```

### Testing

```typescript
import { describe, it, expect } from "vitest";

describe("SecurityCoach", () => {
  it("should block critical threats", () => {
    const result = evaluateThreat("rm -rf /");
    expect(result.blocked).toBe(true);
    expect(result.severity).toBe("critical");
  });

  it("should allow safe operations", () => {
    const result = evaluateThreat("ls -la");
    expect(result.blocked).toBe(false);
  });
});
```

## Debugging

### Debug Mode

```bash
# Enable debug logging
DEBUG=secureclaw:* secureclaw gateway

# Debug specific module
DEBUG=secureclaw:security-coach secureclaw gateway

# Node.js inspector
node --inspect dist/cli.js gateway
```

### Common Issues

**Memory Leaks:**

```bash
# Profile memory
node --inspect --expose-gc dist/cli.js gateway

# Heap snapshot
node --heap-prof dist/cli.js gateway
```

**CPU Profiling:**

```bash
# Generate CPU profile
node --prof dist/cli.js gateway

# Process profile
node --prof-process isolate-*.log > profile.txt
```

**Performance Tracing:**

```bash
# Chrome tracing
node --trace-events-enabled dist/cli.js gateway

# Open in chrome://tracing
```

## Architecture Notes

### Control UI Decorators

The Control UI uses Lit with **legacy** decorators (current Rollup parsing does not support `accessor` fields required for standard decorators). When adding reactive fields, keep the legacy style:

```typescript
@state() foo = "bar";
@property({ type: Number }) count = 0;
```

The root `tsconfig.json` is configured for legacy decorators (`experimentalDecorators: true`) with `useDefineForClassFields: false`. Avoid flipping these unless you are also updating the UI build tooling to support standard decorators.

### Dynamic Imports

Use dynamic imports for optional features to reduce initial bundle size:

```typescript
// Channel integrations
if (config.channels.telegram) {
  const { TelegramChannel } = await import("./channels/telegram.js");
  channels.push(new TelegramChannel());
}

// TTS engine
if (config.tts.enabled) {
  const { TTSEngine } = await import("./tts/index.js");
  tts = new TTSEngine();
}
```

### Security Coach Architecture

Security Coach uses a 3-layer hybrid detection system:

1. **Pattern Matching** (fast, deterministic)
2. **LLM Confirmation** (reduce false positives)
3. **LLM Novel Detection** (context-aware)

See [Security Coach Guide](./security-coach.md) for details.

## Release Process

### Versioning

We use semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes

### Creating a Release

```bash
# Update version
pnpm version minor

# Build and test
pnpm build
pnpm test

# Create git tag
git tag v1.2.0
git push origin v1.2.0

# Publish (maintainers only)
pnpm publish
```

## Documentation

### Writing Documentation

- Use clear, concise language
- Include code examples
- Add troubleshooting sections
- Update CHANGELOG.md

### Documentation Structure

```
docs/
├── raspberry-pi.md        # Pi deployment
├── configuration.md       # Config reference
├── security-coach.md      # Security Coach
└── development.md         # This file
```

## Resources

### Links

- **GitHub:** https://github.com/mbhatt1/secureclaw
- **Discord:** https://discord.gg/qkhbAGHRBT
- **Website:** https://secureclaw.app
- **Documentation:** https://docs.secureclaw.app

### Maintainers

- **Peter Steinberger** - Benevolent Dictator
  - GitHub: [@steipete](https://github.com/steipete) · X: [@steipete](https://x.com/steipete)

- **Shadow** - Discord + Slack subsystem
  - GitHub: [@thewilloftheshadow](https://github.com/thewilloftheshadow) · X: [@4shad0wed](https://x.com/4shad0wed)

- **Vignesh** - Memory (QMD), formal modeling, TUI, and Lobster
  - GitHub: [@vignesh07](https://github.com/vignesh07) · X: [@\_vgnsh](https://x.com/_vgnsh)

- **Jos** - Telegram, API, Nix mode
  - GitHub: [@joshp123](https://github.com/joshp123) · X: [@jjpcodes](https://x.com/jjpcodes)

- **Christoph Nakazawa** - JS Infra
  - GitHub: [@cpojer](https://github.com/cpojer) · X: [@cnakazawa](https://x.com/cnakazawa)

- **Gustavo Madeira Santana** - Multi-agents, CLI, web UI
  - GitHub: [@gumadeiras](https://github.com/gumadeiras) · X: [@gumadeiras](https://x.com/gumadeiras)

- **Maximilian Nussbaumer** - DevOps, CI, Code Sanity
  - GitHub: [@quotentiroler](https://github.com/quotentiroler) · X: [@quotentiroler](https://x.com/quotentiroler)

## Security

### Report a Vulnerability

We take security reports seriously. Report vulnerabilities directly to the repository where the issue lives:

- **Core CLI and gateway** — [secureclaw/secureclaw](https://github.com/mbhatt1/secureclaw)
- **macOS desktop app** — [secureclaw/secureclaw](https://github.com/mbhatt1/secureclaw) (apps/macos)
- **iOS app** — [secureclaw/secureclaw](https://github.com/mbhatt1/secureclaw) (apps/ios)
- **Android app** — [secureclaw/secureclaw](https://github.com/mbhatt1/secureclaw) (apps/android)
- **ClawHub** — [secureclaw/clawhub](https://github.com/secureclaw/clawhub)
- **Trust and threat model** — [secureclaw/trust](https://github.com/secureclaw/trust)

For issues that don't fit a specific repo, or if you're unsure, email **security@secureclaw.app** and we'll route it.

### Required in Reports

1. **Title**
2. **Severity Assessment**
3. **Impact**
4. **Affected Component**
5. **Technical Reproduction**
6. **Demonstrated Impact**
7. **Environment**
8. **Remediation Advice**

Reports without reproduction steps, demonstrated impact, and remediation advice will be deprioritized. Given the volume of AI-generated scanner findings, we must ensure we're receiving vetted reports from researchers who understand the issues.

---

**Happy coding!**
