/**
 * Safe parsing utilities with overflow and boundary validation.
 *
 * These utilities protect against:
 * - Integer overflow (values beyond Number.MAX_SAFE_INTEGER)
 * - NaN and Infinity
 * - Invalid radix
 * - Out-of-range values
 */

/**
 * Safely parse an integer with overflow protection.
 *
 * @param value - String to parse
 * @param radix - Radix (base) to use (default: 10)
 * @param min - Optional minimum value
 * @param max - Optional maximum value
 * @returns Parsed integer
 * @throws Error if parsing fails, overflows, or violates bounds
 *
 * @example
 * ```typescript
 * const port = parseIntSafe("8080", 10, 1, 65535);
 * const chatId = parseIntSafe("123456789");
 * ```
 */
export function parseIntSafe(value: string, radix = 10, min?: number, max?: number): number {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Invalid input: expected non-empty string");
  }

  if (radix < 2 || radix > 36) {
    throw new Error(`Invalid radix: ${radix} (must be 2-36)`);
  }

  const parsed = Number.parseInt(value, radix);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid integer: "${value}"`);
  }

  // Check for overflow beyond JavaScript safe integer range
  if (Math.abs(parsed) > Number.MAX_SAFE_INTEGER) {
    throw new Error(`Integer overflow: ${value} exceeds MAX_SAFE_INTEGER`);
  }

  // Validate bounds if specified
  if (min !== undefined && parsed < min) {
    throw new Error(`Value ${parsed} below minimum ${min}`);
  }

  if (max !== undefined && parsed > max) {
    throw new Error(`Value ${parsed} above maximum ${max}`);
  }

  return parsed;
}

/**
 * Safely parse a floating-point number with range validation.
 *
 * @param value - String to parse
 * @param min - Optional minimum value
 * @param max - Optional maximum value
 * @returns Parsed float
 * @throws Error if parsing fails or violates bounds
 *
 * @example
 * ```typescript
 * const latitude = parseFloatSafe("45.5", -90, 90);
 * const longitude = parseFloatSafe("-122.3", -180, 180);
 * const rate = parseFloatSafe("0.5", 0, 1);
 * ```
 */
export function parseFloatSafe(value: string, min?: number, max?: number): number {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Invalid input: expected non-empty string");
  }

  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid float: "${value}"`);
  }

  // Check for values beyond safe range (though float can handle larger values)
  if (Math.abs(parsed) > Number.MAX_VALUE) {
    throw new Error(`Float overflow: ${value} exceeds MAX_VALUE`);
  }

  // Validate bounds if specified
  if (min !== undefined && parsed < min) {
    throw new Error(`Value ${parsed} below minimum ${min}`);
  }

  if (max !== undefined && parsed > max) {
    throw new Error(`Value ${parsed} above maximum ${max}`);
  }

  return parsed;
}

/**
 * Parse a port number (1-65535).
 *
 * @param value - String to parse
 * @returns Valid port number
 * @throws Error if invalid or out of range
 */
export function parsePortSafe(value: string): number {
  return parseIntSafe(value, 10, 1, 65535);
}

/**
 * Parse a latitude (-90 to 90).
 *
 * @param value - String to parse
 * @returns Valid latitude
 * @throws Error if invalid or out of range
 */
export function parseLatitudeSafe(value: string): number {
  return parseFloatSafe(value, -90, 90);
}

/**
 * Parse a longitude (-180 to 180).
 *
 * @param value - String to parse
 * @returns Valid longitude
 * @throws Error if invalid or out of range
 */
export function parseLongitudeSafe(value: string): number {
  return parseFloatSafe(value, -180, 180);
}

/**
 * Parse a positive integer.
 *
 * @param value - String to parse
 * @param max - Optional maximum value
 * @returns Positive integer
 * @throws Error if invalid, negative, or out of range
 */
export function parsePositiveIntSafe(value: string, max?: number): number {
  return parseIntSafe(value, 10, 1, max);
}

/**
 * Parse a non-negative integer (includes 0).
 *
 * @param value - String to parse
 * @param max - Optional maximum value
 * @returns Non-negative integer
 * @throws Error if invalid, negative, or out of range
 */
export function parseNonNegativeIntSafe(value: string, max?: number): number {
  return parseIntSafe(value, 10, 0, max);
}

/**
 * Parse a percentage (0-100).
 *
 * @param value - String to parse
 * @returns Valid percentage
 * @throws Error if invalid or out of range
 */
export function parsePercentageSafe(value: string): number {
  return parseFloatSafe(value, 0, 100);
}

/**
 * Parse a timeout in milliseconds with reasonable bounds.
 *
 * @param value - String to parse
 * @param min - Minimum timeout (default: 1ms)
 * @param max - Maximum timeout (default: 10 minutes)
 * @returns Valid timeout in milliseconds
 * @throws Error if invalid or out of range
 */
export function parseTimeoutMsSafe(value: string, min = 1, max = 10 * 60 * 1000): number {
  return parseIntSafe(value, 10, min, max);
}

/**
 * Try to parse an integer, returning undefined on failure.
 *
 * @param value - String to parse
 * @param radix - Radix (base) to use (default: 10)
 * @returns Parsed integer or undefined
 */
export function tryParseInt(value: string, radix = 10): number | undefined {
  try {
    return parseIntSafe(value, radix);
  } catch {
    return undefined;
  }
}

/**
 * Try to parse a float, returning undefined on failure.
 *
 * @param value - String to parse
 * @returns Parsed float or undefined
 */
export function tryParseFloat(value: string): number | undefined {
  try {
    return parseFloatSafe(value);
  } catch {
    return undefined;
  }
}
