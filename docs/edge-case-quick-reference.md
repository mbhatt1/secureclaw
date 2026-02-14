# Edge Case Handling - Quick Reference Guide

This guide provides quick patterns for handling common edge cases in SecureClaw development.

## Number Parsing

### Integer Parsing

```typescript
import { parseIntSafe, parsePortSafe, tryParseInt } from "../utils/safe-parse.js";

// ❌ UNSAFE - No overflow check
const port = parseInt(value, 10);

// ✅ SAFE - With overflow protection
const port = parseIntSafe(value, 10, 1, 65535);

// ✅ SAFE - Specialized helper
const port = parsePortSafe(value);

// ✅ SAFE - Try variant (returns undefined on error)
const port = tryParseInt(value, 10);
```

### Float Parsing

```typescript
import { parseFloatSafe, parseLatitudeSafe } from "../utils/safe-parse.js";

// ❌ UNSAFE - No range validation
const latitude = parseFloat(value);

// ✅ SAFE - With range validation
const latitude = parseFloatSafe(value, -90, 90);

// ✅ SAFE - Specialized helper
const latitude = parseLatitudeSafe(value);
```

## JSON Parsing

```typescript
import { parseJSONSafe, parseJSONSafeWithLimit } from "../utils/safe-json.js";

// ❌ UNSAFE - No error handling
const data = JSON.parse(raw);

// ✅ SAFE - With error handling
const data = parseJSONSafe(raw);

// ✅ SAFE - With type validation
interface Config {
  port: number;
  host: string;
}

const isConfig = (x: unknown): x is Config =>
  typeof x === "object" &&
  x !== null &&
  "port" in x &&
  typeof x.port === "number" &&
  "host" in x &&
  typeof x.host === "string";

const config = parseJSONSafe<Config>(raw, isConfig);

// ✅ SAFE - With size limit (100KB)
const data = parseJSONSafeWithLimit(raw, 100 * 1024);
```

## File Operations

### TOCTOU Prevention

```typescript
import fs from "node:fs/promises";

// ❌ UNSAFE - Race condition (TOCTOU)
if (fs.existsSync(path)) {
  const content = fs.readFileSync(path, "utf8");
  // File may be deleted between check and read
}

// ✅ SAFE - Atomic operation
try {
  const content = await fs.readFile(path, "utf8");
  // Process content
} catch (err) {
  if ((err as NodeJS.ErrnoException).code === "ENOENT") {
    // Handle missing file
    return;
  }
  throw err;
}
```

### Path Validation

```typescript
import { validateAndNormalizePath, sanitizeFilename } from "../security/path-validation.js";

// ✅ SAFE - Validate path is within allowed directory
const safePath = validateAndNormalizePath(userPath, allowedDir);
const content = await fs.readFile(safePath, "utf8");

// ✅ SAFE - Sanitize user-provided filename
const safeFilename = sanitizeFilename(userFilename);
const outputPath = path.join(allowedDir, safeFilename);
```

## Array Operations

```typescript
// ❌ UNSAFE - May fail on empty array
const first = items[0].property;

// ✅ SAFE - Check for empty array
if (items.length === 0) {
  return defaultValue;
}
const first = items[0].property;

// ✅ SAFE - Optional chaining
const first = items[0]?.property;

// ✅ SAFE - With default
const first = items[0]?.property ?? defaultValue;

// ✅ SAFE - Before reduce
if (items.length === 0) {
  return initialValue;
}
const sum = items.reduce((acc, item) => acc + item.value, 0);
```

## Null/Undefined Checks

```typescript
// ❌ UNSAFE - No null check
function process(value: string | null) {
  return value.toUpperCase(); // Crashes if null
}

// ✅ SAFE - Guard clause
function process(value: string | null): string {
  if (!value) {
    return "";
  }
  return value.toUpperCase();
}

// ✅ SAFE - Optional chaining
const upper = value?.toUpperCase() ?? "";

// ✅ SAFE - Type guard
function isNonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
```

## Network Requests

### Timeout Handling

```typescript
import { fetchWithTimeout } from "../utils/fetch-timeout.js";

// ❌ UNSAFE - No timeout
const response = await fetch(url);

// ✅ SAFE - With timeout
const response = await fetchWithTimeout(url, {}, 5000);

// ✅ SAFE - With AbortController
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 5000);
try {
  const response = await fetch(url, { signal: controller.signal });
  // Process response
} finally {
  clearTimeout(timer);
}
```

### Retry Logic

```typescript
import { retryAsync } from "../infra/retry.js";

// ✅ SAFE - With exponential backoff
const result = await retryAsync(
  async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  },
  {
    attempts: 3,
    minDelayMs: 300,
    maxDelayMs: 30_000,
    jitter: 0.1,
    shouldRetry: (err, attempt) => {
      // Retry on network errors, not on 4xx
      return err instanceof TypeError; // Network error
    },
  },
);
```

### SSRF Protection

```typescript
import { fetchWithSsrFGuard } from "../infra/net/fetch-guard.js";

// ❌ UNSAFE - No SSRF protection
const response = await fetch(userProvidedUrl);

// ✅ SAFE - With SSRF protection
const { response, finalUrl, release } = await fetchWithSsrFGuard({
  url: userProvidedUrl,
  policy: {
    allowPrivateNetwork: false,
    hostnameAllowlist: ["*.example.com"],
  },
  maxRedirects: 3,
});
try {
  // Process response
} finally {
  await release();
}
```

## Size Limits

```typescript
import { MEDIA_DEFAULTS } from "../config/defaults.unified.js";

// ✅ SAFE - Enforce size limits
const contentLength = response.headers.get("content-length");
if (contentLength) {
  const length = Number(contentLength);
  if (Number.isFinite(length) && length > MEDIA_DEFAULTS.MAX_IMAGE_BYTES) {
    throw new Error(`File too large: ${length} bytes`);
  }
}

// ✅ SAFE - Stream with limit
async function readResponseWithLimit(response: Response, maxBytes: number): Promise<Buffer> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const chunks: Uint8Array[] = [];
  let bytesRead = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      bytesRead += value.length;
      if (bytesRead > maxBytes) {
        throw new Error(`Response exceeds ${maxBytes} bytes`);
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks);
}
```

## Concurrent Access

```typescript
// ⚠️ POTENTIALLY UNSAFE - Concurrent Map access
const cache = new Map<string, Data>();

function getData(key: string): Data | undefined {
  return cache.get(key);
}

function setData(key: string, value: Data): void {
  cache.set(key, value); // Race condition if concurrent
}

// ✅ SAFER - Document threading expectations
/**
 * Cache implementation.
 *
 * Thread-safety: This cache is NOT thread-safe. Callers must ensure
 * synchronization when accessing from multiple async contexts.
 */
class Cache {
  private data = new Map<string, Data>();

  get(key: string): Data | undefined {
    return this.data.get(key);
  }

  set(key: string, value: Data): void {
    this.data.set(key, value);
  }
}

// ✅ SAFER - Use queue for sequential access
import { AsyncQueue } from "../utils/async-queue.js";

class SafeCache {
  private data = new Map<string, Data>();
  private queue = new AsyncQueue();

  async get(key: string): Promise<Data | undefined> {
    return this.queue.run(() => this.data.get(key));
  }

  async set(key: string, value: Data): Promise<void> {
    return this.queue.run(() => {
      this.data.set(key, value);
    });
  }
}
```

## String Operations

```typescript
// ❌ UNSAFE - No bounds check
const snippet = text.slice(0, 100);

// ✅ SAFE - Check length first
const snippet = text.length <= 100 ? text : text.slice(0, 100) + "...";

// ✅ SAFE - Handle negative indices
function safeSlice(text: string, start: number, end?: number): string {
  if (start < 0) start = Math.max(0, text.length + start);
  if (end !== undefined && end < 0) end = Math.max(0, text.length + end);

  start = Math.max(0, Math.min(start, text.length));
  if (end !== undefined) {
    end = Math.max(start, Math.min(end, text.length));
  }

  return text.slice(start, end);
}
```

## Type Validation

```typescript
import { TypeGuards } from "../utils/safe-json.js";

// ✅ SAFE - Type guards
if (!TypeGuards.isObject(value)) {
  throw new Error("Expected object");
}

if (!TypeGuards.hasKeys(value, ["name", "age"])) {
  throw new Error("Missing required keys");
}

if (!TypeGuards.isStringArray(value.tags)) {
  throw new Error("Expected string array");
}

// ✅ SAFE - Number validation
if (!TypeGuards.isNumber(value.score)) {
  throw new Error("Expected finite number");
}
```

## Common Patterns Checklist

When writing new code, verify:

- [ ] `parseInt()` has radix and overflow check → Use `parseIntSafe()`
- [ ] `parseFloat()` has range validation → Use `parseFloatSafe()`
- [ ] `JSON.parse()` wrapped in try-catch → Use `parseJSONSafe()`
- [ ] `fs.existsSync()` not followed by fs operation → Use try-catch on operation
- [ ] Array operations check for empty → Add `if (arr.length === 0)`
- [ ] String slice operations validate bounds → Check length first
- [ ] Network requests have timeout → Use `fetchWithTimeout()` or AbortController
- [ ] User-provided URLs validated → Use SSRF protection
- [ ] File paths validated → Use path validation utilities
- [ ] Size limits enforced → Check Content-Length and stream with limit

## References

- Main Report: `/Users/mbhatt/openclaw/EDGE-CASE-VALIDATION-REPORT.md`
- Safe Parse: `/Users/mbhatt/openclaw/src/utils/safe-parse.ts`
- Safe JSON: `/Users/mbhatt/openclaw/src/utils/safe-json.ts`
- Path Validation: `/Users/mbhatt/openclaw/src/security/path-validation.ts`
- SSRF Protection: `/Users/mbhatt/openclaw/src/infra/net/ssrf.ts`
- Config Defaults: `/Users/mbhatt/openclaw/src/config/defaults.unified.ts`
