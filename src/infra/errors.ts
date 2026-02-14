/**
 * SecureClaw Error Handling
 *
 * This module provides a standardized error hierarchy for consistent error handling
 * across SecureClaw. All errors should extend AppError or one of its subclasses.
 *
 * Error Hierarchy:
 * - AppError (base)
 *   - ValidationError (invalid input/data)
 *   - ConfigError (configuration issues)
 *   - NetworkError (network/connectivity issues)
 *   - AuthError (authentication/authorization)
 *   - NotFoundError (resource not found)
 *   - TimeoutError (operation timeout)
 *   - OperationError (general operation failures)
 *   - StateError (invalid state/precondition)
 */

/**
 * Base application error class with support for error metadata and proper cause chaining.
 */
export class AppError extends Error {
  readonly code: string;
  readonly metadata?: Record<string, unknown>;
  readonly isRecoverable: boolean;

  constructor(
    message: string,
    options?: {
      code?: string;
      metadata?: Record<string, unknown>;
      cause?: unknown;
      isRecoverable?: boolean;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "AppError";
    this.code = options?.code ?? "APP_ERROR";
    this.metadata = options?.metadata;
    this.isRecoverable = options?.isRecoverable ?? false;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Validation error for invalid input or data.
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    options?: {
      field?: string;
      value?: unknown;
      metadata?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, {
      code: options?.field ? `VALIDATION_ERROR_${options.field.toUpperCase()}` : "VALIDATION_ERROR",
      metadata: {
        field: options?.field,
        value: options?.value,
        ...options?.metadata,
      },
      cause: options?.cause,
      isRecoverable: false,
    });
    this.name = "ValidationError";
  }
}

/**
 * Configuration error for invalid or missing configuration.
 */
export class ConfigError extends AppError {
  constructor(
    message: string,
    options?: {
      configKey?: string;
      metadata?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, {
      code: "CONFIG_ERROR",
      metadata: {
        configKey: options?.configKey,
        ...options?.metadata,
      },
      cause: options?.cause,
      isRecoverable: false,
    });
    this.name = "ConfigError";
  }
}

/**
 * Network error for connectivity and network-related issues.
 */
export class NetworkError extends AppError {
  constructor(
    message: string,
    options?: {
      host?: string;
      port?: number;
      protocol?: string;
      metadata?: Record<string, unknown>;
      cause?: unknown;
      isRecoverable?: boolean;
    },
  ) {
    super(message, {
      code: "NETWORK_ERROR",
      metadata: {
        host: options?.host,
        port: options?.port,
        protocol: options?.protocol,
        ...options?.metadata,
      },
      cause: options?.cause,
      isRecoverable: options?.isRecoverable ?? true,
    });
    this.name = "NetworkError";
  }
}

/**
 * Authentication/authorization error.
 */
export class AuthError extends AppError {
  constructor(
    message: string,
    options?: {
      userId?: string;
      resource?: string;
      metadata?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, {
      code: "AUTH_ERROR",
      metadata: {
        userId: options?.userId,
        resource: options?.resource,
        ...options?.metadata,
      },
      cause: options?.cause,
      isRecoverable: false,
    });
    this.name = "AuthError";
  }
}

/**
 * Resource not found error.
 */
export class NotFoundError extends AppError {
  constructor(
    message: string,
    options?: {
      resource?: string;
      id?: string;
      metadata?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, {
      code: "NOT_FOUND",
      metadata: {
        resource: options?.resource,
        id: options?.id,
        ...options?.metadata,
      },
      cause: options?.cause,
      isRecoverable: false,
    });
    this.name = "NotFoundError";
  }
}

/**
 * Timeout error for operations that exceed time limits.
 */
export class TimeoutError extends AppError {
  constructor(
    message: string,
    options?: {
      operation?: string;
      timeoutMs?: number;
      metadata?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, {
      code: "TIMEOUT",
      metadata: {
        operation: options?.operation,
        timeoutMs: options?.timeoutMs,
        ...options?.metadata,
      },
      cause: options?.cause,
      isRecoverable: true,
    });
    this.name = "TimeoutError";
  }
}

/**
 * General operation error for failed operations.
 */
export class OperationError extends AppError {
  constructor(
    message: string,
    options?: {
      operation?: string;
      metadata?: Record<string, unknown>;
      cause?: unknown;
      isRecoverable?: boolean;
    },
  ) {
    super(message, {
      code: "OPERATION_ERROR",
      metadata: {
        operation: options?.operation,
        ...options?.metadata,
      },
      cause: options?.cause,
      isRecoverable: options?.isRecoverable ?? false,
    });
    this.name = "OperationError";
  }
}

/**
 * State error for invalid state or precondition failures.
 */
export class StateError extends AppError {
  constructor(
    message: string,
    options?: {
      currentState?: string;
      expectedState?: string;
      metadata?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, {
      code: "STATE_ERROR",
      metadata: {
        currentState: options?.currentState,
        expectedState: options?.expectedState,
        ...options?.metadata,
      },
      cause: options?.cause,
      isRecoverable: false,
    });
    this.name = "StateError";
  }
}

/**
 * Type guards
 */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function isValidationError(err: unknown): err is ValidationError {
  return err instanceof ValidationError;
}

export function isConfigError(err: unknown): err is ConfigError {
  return err instanceof ConfigError;
}

export function isNetworkError(err: unknown): err is NetworkError {
  return err instanceof NetworkError;
}

export function isAuthError(err: unknown): err is AuthError {
  return err instanceof AuthError;
}

export function isNotFoundError(err: unknown): err is NotFoundError {
  return err instanceof NotFoundError;
}

export function isTimeoutError(err: unknown): err is TimeoutError {
  return err instanceof TimeoutError;
}

export function isOperationError(err: unknown): err is OperationError {
  return err instanceof OperationError;
}

export function isStateError(err: unknown): err is StateError {
  return err instanceof StateError;
}

/**
 * Utility functions
 */
export function extractErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") {
    return undefined;
  }
  if (isAppError(err)) {
    return err.code;
  }
  const code = (err as { code?: unknown }).code;
  if (typeof code === "string") {
    return code;
  }
  if (typeof code === "number") {
    return String(code);
  }
  return undefined;
}

/**
 * Type guard for NodeJS.ErrnoException (any error with a `code` property).
 */
export function isErrno(err: unknown): err is NodeJS.ErrnoException {
  return Boolean(err && typeof err === "object" && "code" in err);
}

/**
 * Check if an error has a specific errno code.
 */
export function hasErrnoCode(err: unknown, code: string): boolean {
  return isErrno(err) && err.code === code;
}

export function formatErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message || err.name || "Error";
  }
  if (typeof err === "string") {
    return err;
  }
  if (typeof err === "number" || typeof err === "boolean" || typeof err === "bigint") {
    return String(err);
  }
  try {
    return JSON.stringify(err);
  } catch {
    return Object.prototype.toString.call(err);
  }
}

export function formatUncaughtError(err: unknown): string {
  if (extractErrorCode(err) === "INVALID_CONFIG" || isConfigError(err)) {
    return formatErrorMessage(err);
  }
  if (err instanceof Error) {
    return err.stack ?? err.message ?? err.name;
  }
  return formatErrorMessage(err);
}

/**
 * Wrap an unknown error with an AppError for consistent handling.
 */
export function wrapError(
  err: unknown,
  message?: string,
  metadata?: Record<string, unknown>,
): AppError {
  if (isAppError(err)) {
    return err;
  }
  return new AppError(message ?? formatErrorMessage(err), {
    cause: err,
    metadata,
  });
}

/**
 * Extract metadata from an error if it's an AppError, otherwise return empty object.
 */
export function getErrorMetadata(err: unknown): Record<string, unknown> {
  if (isAppError(err)) {
    return err.metadata ?? {};
  }
  return {};
}

/**
 * Check if an error is recoverable.
 */
export function isRecoverableError(err: unknown): boolean {
  if (isAppError(err)) {
    return err.isRecoverable;
  }
  // Common recoverable system errors
  if (isErrno(err)) {
    const recoverableCodes = new Set([
      "ECONNRESET",
      "ECONNREFUSED",
      "ETIMEDOUT",
      "ENOTFOUND",
      "EAGAIN",
      "EBUSY",
    ]);
    return recoverableCodes.has(err.code ?? "");
  }
  return false;
}
