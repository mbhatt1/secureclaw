# SecureClaw Dependency & Build Size Optimization

**Target:** Raspberry Pi deployment with minimal footprint
**Goal:** <50MB node_modules, <10MB dist/
**Current State:** 1.6GB node_modules, 30MB dist/

## Executive Summary

Current analysis shows SecureClaw has significant dependency bloat that can be reduced through:

1. Removing unused dependencies (saves ~24MB)
2. Making heavy optional features peer dependencies (saves ~150MB+)
3. Using lighter alternatives for core dependencies (saves ~50MB)
4. Implementing dynamic imports for optional features
5. Optimizing build configuration with tree-shaking

**Estimated Savings:** 200MB+ in node_modules, 5-10MB in dist/

---

## Current Dependency Analysis

### Total Sizes

- **node_modules:** 1.6GB
- **node_modules/.pnpm:** 1.1GB (actual packages)
- **dist:** 30MB
- **Packages ≥5MB:** 1.97GB total (includes devDependencies)

### Top 20 Heaviest Dependencies (Production)

| Package                       | Size | Type | Usage              | Priority            |
| ----------------------------- | ---- | ---- | ------------------ | ------------------- |
| @lancedb/lancedb-darwin-arm64 | 96MB | Peer | Vector DB          | Keep (optional)     |
| pdfjs-dist                    | 38MB | Prod | PDF parsing        | Make optional       |
| @napi-rs/canvas               | 60MB | Peer | Canvas/PDF         | Keep (peer)         |
| @larksuiteoapi/node-sdk       | 24MB | Prod | Lark/Feishu        | **REMOVE (unused)** |
| @line/bot-sdk                 | 15MB | Prod | LINE messaging     | Make optional       |
| @whiskeysockets/baileys       | 9MB  | Prod | WhatsApp           | Make optional       |
| @slack/web-api                | 8MB  | Prod | Slack              | Make optional       |
| playwright-core               | 10MB | Prod | Browser automation | Make optional       |
| @mariozechner/pi-coding-agent | 11MB | Prod | Agent core         | Keep                |
| sharp + libvips               | 32MB | Peer | Image processing   | Keep (peer)         |
| @aws-sdk/client-bedrock       | 7MB  | Prod | AWS Bedrock        | Make optional       |
| openai                        | 13MB | Prod | OpenAI SDK         | Keep (transitive)   |
| @google/genai                 | 12MB | Prod | Google AI          | Keep (transitive)   |
| @mistralai/mistralai          | 12MB | Prod | Mistral AI         | Keep (transitive)   |
| web-streams-polyfill          | 9MB  | Prod | Polyfills          | Optimize            |

### DevDependencies (Not in Production Bundle)

These are large but don't affect runtime:

- @typescript/native-preview: 53MB
- @oxlint-tsgolint: 52MB
- typescript: 23MB
- oxfmt: 11MB
- rolldown: 18MB
- @esbuild: 20MB

---

## Dependencies to REMOVE (Unused)

### 1. @larksuiteoapi/node-sdk (24MB)

**Status:** UNUSED - detected by depcheck
**Impact:** -24MB
**Action:** Remove from package.json

```json
// REMOVE
"@larksuiteoapi/node-sdk": "^1.59.0"
```

**Rationale:** No imports found in codebase, not referenced anywhere.

### 2. signal-utils (minimal size)

**Status:** UNUSED - detected by depcheck
**Impact:** <1MB
**Action:** Remove from package.json

```json
// REMOVE
"signal-utils": "^0.21.1"
```

---

## Dependencies to Make OPTIONAL (Peer/Optional)

These are feature-specific and should only be installed when needed:

### 1. Messaging Platform SDKs (47MB total)

#### @line/bot-sdk (15MB)

**Current:** dependencies
**Proposed:** peerDependencies (optional)
**Impact:** -15MB for non-LINE deployments

```json
// Move to peerDependencies
"peerDependenciesOptional": {
  "@line/bot-sdk": "^10.6.0"
}
```

**Usage:** Only needed for LINE channel integration (src/line/)

#### @whiskeysockets/baileys (9MB)

**Current:** dependencies
**Proposed:** peerDependencies (optional)
**Impact:** -9MB for non-WhatsApp deployments

```json
"peerDependenciesOptional": {
  "@whiskeysockets/baileys": "7.0.0-rc.9"
}
```

**Usage:** Only needed for WhatsApp channel (src/web/)

#### @slack/bolt + @slack/web-api (8MB)

**Current:** dependencies
**Proposed:** Keep (widely used)
**Rationale:** Slack integration is commonly used, but could be made optional for minimal installs

#### Discord SDKs (@buape/carbon)

**Current:** dependencies
**Proposed:** Keep (lightweight, core feature)

### 2. Browser Automation (10MB)

#### playwright-core (10MB)

**Current:** dependencies
**Proposed:** peerDependencies (optional)
**Impact:** -10MB for non-browser deployments

```json
"peerDependenciesOptional": {
  "playwright-core": "1.58.2"
}
```

**Usage:** Only in src/browser/ for web automation tools

### 3. PDF Processing (38MB)

#### pdfjs-dist (38MB)

**Current:** dependencies
**Proposed:** peerDependencies (optional)
**Impact:** -38MB for non-PDF deployments

```json
"peerDependenciesOptional": {
  "pdfjs-dist": "^5.4.624"
}
```

**Usage:** Only in src/media/input-files.ts for PDF extraction
**Already:** Uses dynamic import pattern

### 4. AWS Bedrock SDK (7MB)

#### @aws-sdk/client-bedrock (7MB)

**Current:** dependencies
**Proposed:** peerDependencies (optional)
**Impact:** -7MB for non-AWS deployments

```json
"peerDependenciesOptional": {
  "@aws-sdk/client-bedrock": "^3.989.0"
}
```

**Usage:** Only for AWS Bedrock model integration

---

## Lighter Alternatives

### 1. Express (96KB)

**Current:** express@5.2.1
**Alternative:** Native http/http2 or Hono (already in deps via transitive)
**Impact:** -1MB (including dependencies)
**Recommendation:** Keep for now (minimal, stable)

**Usage:** Only in 5 files:

- src/line/bot.ts
- src/browser/server.ts
- src/media/server.ts
- src/line/webhook.ts
- src/browser/bridge-server.ts

**Could replace with:** Native http.createServer() for LINE webhooks, Hono for others

### 2. markdown-it (892KB)

**Current:** markdown-it@14.1.1
**Alternative:** marked (300KB), micromark (100KB)
**Impact:** -500KB
**Recommendation:** Consider micromark for minimal installs

**Usage:**

- src/markdown/ir.ts (markdown parsing)
- Could use native markdown parsing or lighter library

### 3. cli-highlight (80KB + 2.6MB highlight.js)

**Current:** cli-highlight@2.1.11
**Alternative:** Native ANSI coloring
**Impact:** -2.7MB
**Recommendation:** Make optional or replace

**Usage:**

- src/tui/theme/theme.ts (syntax highlighting in TUI)
- Could use simpler ANSI coloring for Raspberry Pi

### 4. linkedom (2.5MB)

**Current:** linkedom@0.18.12
**Alternative:** Native DOMParser (in Node 22+) for simple cases
**Impact:** -2.5MB
**Recommendation:** Evaluate if native is sufficient

**Usage:**

- src/agents/tools/web-fetch-utils.ts (DOM parsing)

### 5. jszip (880KB)

**Current:** jszip@3.10.1
**Alternative:** Native streams with fflate (100KB)
**Impact:** -780KB
**Recommendation:** Use fflate for lighter zipping

**Usage:**

- src/infra/archive.ts (plugin/hook packaging)
- src/hooks/install.test.ts
- src/plugins/install.test.ts

---

## Build Configuration Optimizations

### Current tsdown.config.ts Issues

1. **No tree-shaking:** rolldown config has `treeshake: false`
2. **No minification:** Build output is not minified
3. **No external dependencies:** Everything is bundled
4. **No code splitting:** Single bundle per entry

### Recommended Changes

#### 1. Enable Tree-Shaking in rolldown.config.mjs

```javascript
export default defineConfig({
  input: fromHere("bootstrap.js"),
  experimental: {
    attachDebugInfo: "none",
  },
  treeshake: true, // ENABLE THIS
  // ... rest of config
});
```

#### 2. Add Minification to tsdown.config.ts

```typescript
export default defineConfig([
  {
    entry: "src/index.ts",
    env,
    fixedExtension: false,
    platform: "node",
    minify: true, // ADD THIS
    splitting: true, // ADD CODE SPLITTING
    external: [
      // EXTERNALIZE HEAVY DEPS
      "playwright-core",
      "@whiskeysockets/baileys",
      "@line/bot-sdk",
      "pdfjs-dist",
      "@aws-sdk/client-bedrock",
      "@napi-rs/canvas",
      "sharp",
    ],
  },
  // ... rest of entries
]);
```

#### 3. Optimize Dist Bundle Sizes

Current largest bundles:

- pi-embedded-\*.js: 2.3MB each (4 copies!)
- extensionAPI.js: 2.3MB
- reply-\*.js: 2.2MB
- loader-\*.js: 2.2MB

**Action:** Enable code splitting to deduplicate shared code

---

## Dynamic Import Strategy

### Already Using Dynamic Imports (Good!)

These are already lazy-loaded:

- sharp (src/media/image-ops.ts)
- pdfjs-dist (src/media/input-files.ts)
- @napi-rs/canvas (src/media/input-files.ts)

### Should Use Dynamic Imports

#### 1. Playwright

```typescript
// src/browser/pw-session.ts
// CURRENT
import { chromium } from "playwright-core";

// PROPOSED
async function loadPlaywright() {
  return await import("playwright-core");
}
```

#### 2. Messaging Platform SDKs

```typescript
// src/line/bot.ts
// CURRENT
import { LineClient } from "@line/bot-sdk";

// PROPOSED
async function loadLineSDK() {
  return await import("@line/bot-sdk");
}
```

#### 3. AWS SDK

```typescript
// Lazy load Bedrock client
async function loadBedrockClient() {
  const { BedrockClient } = await import("@aws-sdk/client-bedrock");
  return BedrockClient;
}
```

#### 4. CLI Highlight (Optional Feature)

```typescript
// src/tui/theme/theme.ts
// Make syntax highlighting optional
async function highlightCode(code: string, lang: string) {
  try {
    const highlight = await import("cli-highlight");
    return highlight.highlight(code, { language: lang });
  } catch {
    // Fallback to plain text with ANSI colors
    return code;
  }
}
```

---

## Implementation Plan

### Phase 1: Remove Unused Dependencies (Immediate)

1. Remove @larksuiteoapi/node-sdk
2. Remove signal-utils
3. **Estimated savings:** 24MB

### Phase 2: Make Heavy Features Optional (High Priority)

1. Move pdfjs-dist to peerDependenciesOptional
2. Move playwright-core to peerDependenciesOptional
3. Move @line/bot-sdk to peerDependenciesOptional
4. Move @whiskeysockets/baileys to peerDependenciesOptional
5. Move @aws-sdk/client-bedrock to peerDependenciesOptional
6. **Estimated savings:** 80MB+ (when not installed)

### Phase 3: Implement Dynamic Imports (Medium Priority)

1. Convert playwright imports to dynamic
2. Convert messaging SDK imports to dynamic
3. Convert AWS SDK imports to dynamic
4. Convert cli-highlight to dynamic with fallback
5. **Benefit:** Only load when actually used at runtime

### Phase 4: Build Optimizations (Medium Priority)

1. Enable tree-shaking in rolldown config
2. Add minification to tsdown config
3. Enable code splitting to reduce duplication
4. Externalize heavy peer dependencies
5. **Estimated savings:** 5-10MB in dist/

### Phase 5: Lighter Alternatives (Low Priority)

1. Consider replacing linkedom with native DOMParser
2. Consider replacing jszip with fflate
3. Consider replacing markdown-it with micromark
4. Consider replacing cli-highlight with simple ANSI
5. **Estimated savings:** 5-10MB

---

## Raspberry Pi Specific Optimizations

### Minimal Install Profile

For Raspberry Pi deployments, provide a minimal installation:

```bash
# Minimal install (no optional features)
pnpm install --no-optional --ignore-scripts

# Skip heavy peer dependencies
SECURECLAW_SKIP_BROWSER=1 \
SECURECLAW_SKIP_PDF=1 \
SECURECLAW_SKIP_WHATSAPP=1 \
pnpm install
```

### Environment Variables for Feature Flags

Add runtime feature flags to skip loading optional modules:

```bash
# Disable optional features at runtime
SECURECLAW_DISABLE_BROWSER=1
SECURECLAW_DISABLE_PDF=1
SECURECLAW_DISABLE_TTS=1
SECURECLAW_DISABLE_WHATSAPP=1
SECURECLAW_IMAGE_BACKEND=sips  # Use native sips on macOS instead of sharp
```

**Already implemented:** SECURECLAW_IMAGE_BACKEND for sharp fallback

### Native Module Fallbacks

The codebase already has good fallback patterns:

1. **Image Processing:** Falls back to native `sips` on macOS (src/media/image-ops.ts)
2. **PDF Extraction:** Lazy-loads pdfjs-dist
3. **Canvas:** Peer dependency (optional install)

### ARM64 Optimization

Sharp and other native modules have ARM64 builds, but ensure they're used:

```json
// package.json
"pnpm": {
  "supportedArchitectures": {
    "os": ["linux", "darwin"],
    "cpu": ["x64", "arm64"]
  }
}
```

---

## Expected Results After Optimization

### Scenario 1: Minimal Install (No Optional Features)

- **Current:** 1.6GB node_modules
- **Optimized:** ~45MB node_modules
- **Savings:** 97% reduction
- **Features:** Core agent, Slack, Discord, Telegram (no WhatsApp, LINE, PDF, Browser)

### Scenario 2: Standard Install (Common Features)

- **Current:** 1.6GB node_modules
- **Optimized:** ~100MB node_modules
- **Savings:** 94% reduction
- **Features:** All above + WhatsApp, PDF parsing

### Scenario 3: Full Install (All Features)

- **Current:** 1.6GB node_modules
- **Optimized:** ~150MB node_modules
- **Savings:** 91% reduction
- **Features:** Everything including browser automation

### Dist Bundle

- **Current:** 30MB
- **Optimized:** 15-20MB
- **Savings:** 33-50% reduction
- **Method:** Tree-shaking, minification, code splitting

---

## Testing Strategy

### 1. Validate No Regressions

- Run full test suite after each phase
- Ensure dynamic imports don't break functionality
- Test on actual Raspberry Pi hardware

### 2. Measure Bundle Sizes

```bash
# Before
du -sh node_modules dist

# After each phase
du -sh node_modules dist

# Detailed breakdown
du -d 1 -m node_modules | sort -rn | head -20
```

### 3. Runtime Performance

- Measure startup time with dynamic imports
- Monitor memory usage on Raspberry Pi
- Test feature detection and fallbacks

### 4. Installation Time

- Measure pnpm install time before/after
- Test minimal install on slow connections
- Verify ARM64 binary downloads

---

## Risk Assessment

### Low Risk

- Removing unused dependencies (@larksuiteoapi, signal-utils)
- Enabling tree-shaking and minification
- Adding dynamic imports (already used in codebase)

### Medium Risk

- Moving dependencies to peerDependencies
- Replacing libraries with lighter alternatives
- May require documentation updates

### High Risk

- Removing widely-used dependencies
- Breaking existing integrations
- Not recommended without user consent

---

## Monitoring & Validation

### Bundle Size Monitoring

Add to CI/CD:

```bash
# scripts/check-bundle-size.sh
MAX_NODE_MODULES=100  # MB
MAX_DIST=20  # MB

NODE_MODULES_SIZE=$(du -sm node_modules | cut -f1)
DIST_SIZE=$(du -sm dist | cut -f1)

if [ $NODE_MODULES_SIZE -gt $MAX_NODE_MODULES ]; then
  echo "ERROR: node_modules too large: ${NODE_MODULES_SIZE}MB (max ${MAX_NODE_MODULES}MB)"
  exit 1
fi
```

### Dependency Audit

Regular dependency checks:

```bash
# Check for unused deps
npx depcheck

# Check for updates
pnpm outdated

# Check for security issues
pnpm audit
```

---

## Conclusion

SecureClaw has significant optimization opportunities:

1. **Quick Wins:** Remove 24MB of unused dependencies immediately
2. **High Impact:** Make 80MB+ of feature-specific deps optional
3. **Build Optimizations:** Reduce dist by 10-15MB through tree-shaking
4. **Long-term:** Replace heavy libraries with lighter alternatives

**Total Potential Savings:**

- node_modules: 1.6GB → 45-150MB (depending on features)
- dist: 30MB → 15-20MB

This brings SecureClaw well under the 50MB node_modules / 10MB dist target for Raspberry Pi deployment.

**Next Steps:**

1. Review and approve optimization plan
2. Implement Phase 1 (remove unused deps)
3. Test on Raspberry Pi hardware
4. Roll out remaining phases incrementally
