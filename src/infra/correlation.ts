import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

/**
 * Correlation ID tracking for request tracing across the application.
 *
 * Correlation IDs are automatically propagated through:
 * - HTTP requests/responses (X-Correlation-ID header)
 * - WebSocket messages (correlationId field)
 * - All log entries
 * - OpenTelemetry traces (when available)
 *
 * Usage:
 * ```typescript
 * // Set correlation ID at request entry point
 * withCorrelationId(generateCorrelationId(), () => {
 *   // All code in this scope will have access to the correlation ID
 *   const id = getCorrelationId(); // retrieves the ID
 * });
 * ```
 */

const correlationIdStorage = new AsyncLocalStorage<string>();

// Dynamically import OpenTelemetry if available (optional dependency)
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
let otelTrace: typeof import("@opentelemetry/api").trace | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const otel = require("@opentelemetry/api") as typeof import("@opentelemetry/api");
  otelTrace = otel.trace;
} catch {
  // OpenTelemetry not available, continue without it
}

/**
 * Get the current correlation ID from async context.
 * Returns undefined if no correlation ID is set.
 */
export function getCorrelationId(): string | undefined {
  const stored = correlationIdStorage.getStore();
  if (stored) {
    return stored;
  }

  // Try to extract from OpenTelemetry trace context if available
  if (otelTrace) {
    try {
      const span = otelTrace.getActiveSpan();
      if (span) {
        const spanContext = span.spanContext();
        if (spanContext.traceId) {
          return spanContext.traceId;
        }
      }
    } catch {
      // Ignore OpenTelemetry errors
    }
  }

  return undefined;
}

/**
 * Set correlation ID in async context.
 * This is lower-level - prefer using withCorrelationId() for most cases.
 */
export function setCorrelationId(id: string): void {
  if (!id || typeof id !== "string") {
    throw new Error("Correlation ID must be a non-empty string");
  }
  correlationIdStorage.enterWith(id);
}

/**
 * Execute a function with a specific correlation ID in async context.
 * The correlation ID is available to all code executed within fn,
 * including async operations and callbacks.
 *
 * @param id - The correlation ID to use
 * @param fn - Function to execute with the correlation ID in scope
 * @returns The result of fn()
 */
export function withCorrelationId<T>(id: string, fn: () => T): T {
  if (!id || typeof id !== "string") {
    throw new Error("Correlation ID must be a non-empty string");
  }
  return correlationIdStorage.run(id, fn);
}

/**
 * Generate a new correlation ID using UUID v4.
 */
export function generateCorrelationId(): string {
  return randomUUID();
}

/**
 * Extract correlation ID from HTTP request headers.
 * Checks X-Correlation-ID, X-Request-ID, and X-Trace-ID headers.
 * Returns undefined if no correlation ID found.
 */
export function extractCorrelationIdFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): string | undefined {
  const headerNames = ["x-correlation-id", "x-request-id", "x-trace-id"];

  for (const name of headerNames) {
    const value = headers[name];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
      return value[0];
    }
  }

  return undefined;
}

/**
 * Get or generate a correlation ID.
 * Returns existing correlation ID from context if available,
 * otherwise generates a new one.
 */
export function getOrGenerateCorrelationId(): string {
  return getCorrelationId() ?? generateCorrelationId();
}
