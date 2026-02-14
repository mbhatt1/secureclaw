/**
 * CSRF (Cross-Site Request Forgery) protection utilities.
 *
 * Defense-in-depth security controls for HTTP endpoints.
 * Note: SecureClaw primarily uses WebSocket and Bearer token authentication,
 * which are not susceptible to traditional CSRF attacks. These utilities
 * provide additional protection for any HTTP endpoints.
 */

import type { IncomingMessage } from "node:http";

const TRUSTED_ORIGINS_ENV = "SECURECLAW_TRUSTED_ORIGINS";

/**
 * List of allowed origins for CORS and CSRF protection.
 * Can be configured via SECURECLAW_TRUSTED_ORIGINS environment variable
 * (comma-separated list).
 */
function getTrustedOrigins(): Set<string> {
  const env = process.env[TRUSTED_ORIGINS_ENV];
  const origins = new Set<string>();

  // Always trust localhost/loopback
  origins.add("http://localhost");
  origins.add("http://127.0.0.1");
  origins.add("https://localhost");
  origins.add("https://127.0.0.1");

  if (env) {
    for (const origin of env.split(",")) {
      const trimmed = origin.trim();
      if (trimmed) {
        origins.add(trimmed);
      }
    }
  }

  return origins;
}

/**
 * Validates the Origin header to prevent CSRF attacks.
 *
 * This is a defense-in-depth measure for HTTP POST/PUT/DELETE requests.
 * Checks that the Origin header matches one of the trusted origins.
 *
 * @param req - The HTTP request to validate
 * @param options - Validation options
 * @returns Object with validation result and details
 *
 * @example
 * ```typescript
 * const result = validateOriginHeader(req, { requireOrigin: true });
 * if (!result.valid) {
 *   res.statusCode = 403;
 *   res.end('Forbidden: Invalid origin');
 *   return;
 * }
 * ```
 */
export function validateOriginHeader(
  req: IncomingMessage,
  options: {
    /**
     * Whether to require Origin header (recommended for POST/PUT/DELETE)
     */
    requireOrigin?: boolean;
    /**
     * Additional trusted origins beyond defaults
     */
    trustedOrigins?: string[];
    /**
     * Allow requests from same origin (same scheme, host, port)
     */
    allowSameOrigin?: boolean;
  } = {},
): {
  valid: boolean;
  reason?: string;
  origin?: string;
} {
  const origin = req.headers.origin || req.headers.referer;

  if (!origin) {
    if (options.requireOrigin) {
      return {
        valid: false,
        reason: "Missing Origin or Referer header",
      };
    }
    // No origin header is acceptable for same-origin requests from some browsers
    return { valid: true };
  }

  const trustedOrigins = getTrustedOrigins();

  // Add custom trusted origins
  if (options.trustedOrigins) {
    for (const customOrigin of options.trustedOrigins) {
      trustedOrigins.add(customOrigin.trim());
    }
  }

  // Check if origin is in the trusted list
  try {
    const originUrl = new URL(origin);
    const originString = `${originUrl.protocol}//${originUrl.host}`;

    if (trustedOrigins.has(originString)) {
      return { valid: true, origin: originString };
    }

    // Check same-origin if enabled
    if (options.allowSameOrigin && req.headers.host) {
      const isEncrypted = "encrypted" in req.socket && req.socket.encrypted;
      const requestOrigin = `${isEncrypted ? "https" : "http"}://${req.headers.host}`;
      if (originString === requestOrigin) {
        return { valid: true, origin: originString };
      }
    }

    return {
      valid: false,
      reason: `Untrusted origin: ${originString}`,
      origin: originString,
    };
  } catch (err) {
    return {
      valid: false,
      reason: `Invalid origin URL: ${String(err)}`,
      origin,
    };
  }
}

/**
 * Validates that a request is safe from CSRF.
 *
 * Combines multiple CSRF protection techniques:
 * 1. Origin/Referer header validation
 * 2. Custom header presence check (custom headers can't be set by simple forms)
 * 3. Method validation (only check state-changing methods)
 *
 * @param req - The HTTP request to validate
 * @param options - Validation options
 * @returns Object with validation result
 *
 * @example
 * ```typescript
 * const result = validateCsrfProtection(req, {
 *   customHeaderName: 'X-SecureClaw-Token',
 *   requireCustomHeader: true
 * });
 *
 * if (!result.valid) {
 *   res.statusCode = 403;
 *   res.end('Forbidden: CSRF protection failed');
 *   return;
 * }
 * ```
 */
export function validateCsrfProtection(
  req: IncomingMessage,
  options: {
    /**
     * Name of a custom header that must be present (e.g., 'X-Requested-With')
     * Custom headers provide CSRF protection because they can't be set by simple HTML forms
     */
    customHeaderName?: string;
    /**
     * Whether to require the custom header
     */
    requireCustomHeader?: boolean;
    /**
     * Additional trusted origins
     */
    trustedOrigins?: string[];
    /**
     * Methods that require CSRF protection (default: POST, PUT, DELETE, PATCH)
     */
    protectedMethods?: string[];
  } = {},
): {
  valid: boolean;
  reason?: string;
  method: string;
} {
  const method = req.method?.toUpperCase() || "";

  const protectedMethods = options.protectedMethods || ["POST", "PUT", "DELETE", "PATCH"];

  // Safe methods (GET, HEAD, OPTIONS) don't need CSRF protection
  if (!protectedMethods.includes(method)) {
    return { valid: true, method };
  }

  // Check for custom header (defense-in-depth)
  if (options.requireCustomHeader && options.customHeaderName) {
    const headerValue = req.headers[options.customHeaderName.toLowerCase()];
    if (!headerValue) {
      return {
        valid: false,
        reason: `Missing required header: ${options.customHeaderName}`,
        method,
      };
    }
  }

  // Validate origin
  const originResult = validateOriginHeader(req, {
    requireOrigin: true,
    trustedOrigins: options.trustedOrigins,
    allowSameOrigin: true,
  });

  if (!originResult.valid) {
    return {
      valid: false,
      reason: originResult.reason,
      method,
    };
  }

  return { valid: true, method };
}

/**
 * Middleware-style CSRF protection for Express-like servers.
 *
 * @param options - CSRF validation options
 * @returns Middleware function that validates CSRF protection
 *
 * @example
 * ```typescript
 * import express from 'express';
 * const app = express();
 *
 * // Apply CSRF protection to all routes
 * app.use(csrfProtectionMiddleware({
 *   customHeaderName: 'X-SecureClaw-Token',
 *   requireCustomHeader: true
 * }));
 * ```
 */
export function csrfProtectionMiddleware(
  options: Parameters<typeof validateCsrfProtection>[1] = {},
) {
  return (
    req: IncomingMessage,
    res: { statusCode: number; end: (message: string) => void },
    next?: () => void,
  ) => {
    const result = validateCsrfProtection(req, options);

    if (!result.valid) {
      res.statusCode = 403;
      res.end(`Forbidden: ${result.reason || "CSRF protection failed"}`);
      return;
    }

    if (next) {
      next();
    }
  };
}

/**
 * Generates CORS headers for a response, including CSRF-protective headers.
 *
 * @param origin - The origin from the request
 * @param options - CORS options
 * @returns Object with CORS headers to set on the response
 */
export function generateCorsHeaders(
  origin: string | undefined,
  options: {
    allowCredentials?: boolean;
    maxAge?: number;
    allowedMethods?: string[];
    allowedHeaders?: string[];
  } = {},
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (origin) {
    const trustedOrigins = getTrustedOrigins();
    if (trustedOrigins.has(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;

      if (options.allowCredentials) {
        headers["Access-Control-Allow-Credentials"] = "true";
      }
    }
  }

  if (options.allowedMethods) {
    headers["Access-Control-Allow-Methods"] = options.allowedMethods.join(", ");
  }

  if (options.allowedHeaders) {
    headers["Access-Control-Allow-Headers"] = options.allowedHeaders.join(", ");
  }

  if (options.maxAge) {
    headers["Access-Control-Max-Age"] = String(options.maxAge);
  }

  // Security headers
  headers["X-Content-Type-Options"] = "nosniff";
  headers["X-Frame-Options"] = "DENY";
  headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

  return headers;
}
