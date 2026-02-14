# SecureClaw Error Handling Guide

This guide explains the standardized error handling patterns used throughout SecureClaw.

## Overview

SecureClaw uses a typed error hierarchy based on a common `AppError` base class. This approach provides:

- **Consistent error structure** across the entire codebase
- **Rich error context** with metadata and proper cause chaining
- **Type-safe error handling** with TypeScript
- **Clear recoverability semantics** for automatic retry logic
- **Proper stack traces** for debugging

## Error Hierarchy

All application errors extend `AppError` or one of its subclasses:

```
AppError (base)
├── ValidationError      - Invalid input or data validation failures
├── ConfigError         - Configuration problems
├── NetworkError        - Network connectivity issues
├── AuthError           - Authentication/authorization failures
├── NotFoundError       - Resource not found
├── TimeoutError        - Operation timeouts
├── OperationError      - General operation failures
└── StateError          - Invalid state or precondition violations
```

## Usage

### Importing Error Classes

```typescript
import {
  AppError,
  ValidationError,
  ConfigError,
  NetworkError,
  AuthError,
  NotFoundError,
  TimeoutError,
  OperationError,
  StateError,
} from "../infra/errors.js";
```

### Throwing Errors

Always use typed errors instead of generic `Error`:

```typescript
// Bad
throw new Error("Invalid session ID");

// Good
throw new ValidationError("Invalid session ID", {
  field: "sessionId",
  value: sessionId,
});
```

### Error Construction

All error classes accept a message and optional configuration:

```typescript
throw new NetworkError("Failed to connect to remote server", {
  host: "api.example.com",
  port: 443,
  protocol: "https",
  metadata: {
    attemptNumber: 3,
    lastError: previousError,
  },
  cause: originalError,
  isRecoverable: true,
});
```

**Key options:**

- `metadata` - Additional context (included in error metadata)
- `cause` - The underlying error (for error chaining)
- `isRecoverable` - Whether the error can be retried (default varies by type)

### Catching and Handling Errors

#### Type Guards

Use type guards to check error types:

```typescript
import { isValidationError, isNetworkError, isRecoverableError } from "../infra/errors.js";

try {
  await someOperation();
} catch (err) {
  if (isValidationError(err)) {
    console.error("Validation failed:", err.metadata);
    return { success: false, field: err.metadata?.field };
  }

  if (isNetworkError(err) && err.isRecoverable) {
    // Retry logic
    return await retryOperation();
  }

  // Re-throw unhandled errors with context
  throw new OperationError("Operation failed", {
    operation: "someOperation",
    cause: err,
  });
}
```

#### Wrapping Unknown Errors

When catching unknown errors, wrap them with context:

```typescript
import { wrapError } from "../infra/errors.js";

try {
  const result = await externalLibrary();
} catch (err) {
  throw wrapError(err, "External library call failed", {
    library: "externalLibrary",
    version: "1.2.3",
  });
}
```

#### Silent Failures

When intentionally ignoring errors, always add a comment:

```typescript
try {
  await cleanup();
} catch (err) {
  // Ignore cleanup errors - resource will be garbage collected
}
```

## Error Types in Detail

### ValidationError

Use for invalid input, data validation failures, or constraint violations.

```typescript
throw new ValidationError("Email address is required", {
  field: "email",
});

throw new ValidationError("Age must be between 0 and 120", {
  field: "age",
  value: age,
  metadata: { min: 0, max: 120 },
});
```

### ConfigError

Use for configuration problems, missing required config, or invalid config values.

```typescript
throw new ConfigError("API key not configured", {
  configKey: "apiKey",
});

throw new ConfigError("Invalid port number in config", {
  configKey: "server.port",
  metadata: { value: configValue },
});
```

### NetworkError

Use for network connectivity issues, DNS failures, connection timeouts.

```typescript
throw new NetworkError("Failed to connect to database", {
  host: dbHost,
  port: dbPort,
  cause: err,
  isRecoverable: true,
});
```

### AuthError

Use for authentication failures, expired tokens, insufficient permissions.

```typescript
throw new AuthError("Invalid API token", {
  userId: userId,
});

throw new AuthError("Insufficient permissions", {
  userId: userId,
  resource: resourceId,
  metadata: { requiredRole: "admin", actualRole: "user" },
});
```

### NotFoundError

Use when a requested resource doesn't exist.

```typescript
throw new NotFoundError("Session not found", {
  resource: "session",
  id: sessionId,
});
```

### TimeoutError

Use when an operation exceeds its time limit.

```typescript
throw new TimeoutError("Agent response timeout", {
  operation: "agentCall",
  timeoutMs: 30000,
});
```

### OperationError

Use for general operation failures that don't fit other categories.

```typescript
throw new OperationError("Failed to generate unique code", {
  operation: "generateCode",
  metadata: { maxAttempts: 100 },
});
```

### StateError

Use for invalid state transitions or precondition violations.

```typescript
throw new StateError("Cannot perform action on closed connection", {
  currentState: "closed",
  expectedState: "open",
});
```

## Gateway Error Mapping

The gateway automatically maps AppError instances to the protocol ErrorShape:

```typescript
import { mapErrorToShape, mapErrorToHttpStatus } from "../gateway/error-mapper.js";

// In gateway handlers:
try {
  const result = await operation();
  return { success: true, result };
} catch (err) {
  const errorShape = mapErrorToShape(err);
  const httpStatus = mapErrorToHttpStatus(err);
  return { success: false, error: errorShape, httpStatus };
}
```

## Best Practices

### DO

- ✅ Use specific error types (ValidationError, NetworkError, etc.)
- ✅ Include relevant metadata and context
- ✅ Chain errors using `cause` option
- ✅ Set `isRecoverable` appropriately for retry logic
- ✅ Use type guards for error handling
- ✅ Add comments for intentionally ignored errors

### DON'T

- ❌ Don't throw generic `Error` instances
- ❌ Don't silently swallow errors without comments
- ❌ Don't lose error context when re-throwing
- ❌ Don't include sensitive data in error messages
- ❌ Don't use errors for control flow in normal cases

## Examples

### File Operations

```typescript
import { NotFoundError, OperationError } from "../infra/errors.js";

async function readUserConfig(userId: string): Promise<Config> {
  const configPath = resolveConfigPath(userId);

  try {
    const data = await fs.readFile(configPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (hasErrnoCode(err, "ENOENT")) {
      throw new NotFoundError("User config not found", {
        resource: "userConfig",
        id: userId,
        metadata: { path: configPath },
      });
    }

    throw new OperationError("Failed to read user config", {
      operation: "readUserConfig",
      metadata: { userId, path: configPath },
      cause: err,
    });
  }
}
```

### API Calls with Retry

```typescript
import { NetworkError, isRecoverableError } from "../infra/errors.js";

async function callExternalAPI(url: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetch(url);
    } catch (err) {
      if (attempt === maxRetries || !isRecoverableError(err)) {
        throw new NetworkError("API call failed", {
          metadata: { url, attempts: attempt },
          cause: err,
          isRecoverable: attempt < maxRetries,
        });
      }

      await delay(1000 * attempt); // Exponential backoff
    }
  }

  throw new NetworkError("API call failed after all retries", {
    metadata: { url, maxRetries },
  });
}
```

### Validation

```typescript
import { ValidationError } from "../infra/errors.js";

function validateEmail(email: string): void {
  if (!email || !email.includes("@")) {
    throw new ValidationError("Invalid email address", {
      field: "email",
      value: email,
    });
  }
}

function validatePort(port: number): void {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ValidationError("Port must be between 1 and 65535", {
      field: "port",
      value: port,
      metadata: { min: 1, max: 65535 },
    });
  }
}
```

## Migration from Generic Errors

When updating existing code:

1. **Identify the error type** - What kind of failure is this?
2. **Choose the appropriate error class** - ValidationError, NetworkError, etc.
3. **Add relevant context** - Include field names, IDs, metadata
4. **Preserve error chains** - Use `cause` option for underlying errors
5. **Update catch blocks** - Use type guards instead of string matching

Example migration:

```typescript
// Before
throw new Error(`Invalid session ID: ${sessionId}`);

// After
throw new ValidationError("Invalid session ID", {
  field: "sessionId",
  value: sessionId,
});
```

## Testing Error Handling

```typescript
import { expect, test } from "vitest";
import { ValidationError } from "../infra/errors.js";

test("throws ValidationError for invalid input", () => {
  expect(() => validateSessionId("")).toThrow(ValidationError);

  try {
    validateSessionId("");
  } catch (err) {
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).metadata?.field).toBe("sessionId");
  }
});

test("includes cause in wrapped errors", () => {
  const originalError = new Error("Original failure");

  try {
    throw new OperationError("Operation failed", {
      operation: "test",
      cause: originalError,
    });
  } catch (err) {
    expect(err).toBeInstanceOf(OperationError);
    expect((err as Error).cause).toBe(originalError);
  }
});
```

## Additional Resources

- Source code: `/src/infra/errors.ts`
- Gateway mapping: `/src/gateway/error-mapper.ts`
- Protocol schema: `/src/gateway/protocol/schema/error-codes.ts`
