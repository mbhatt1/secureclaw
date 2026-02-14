/**
 * Safe JSON parsing utilities with error handling and validation.
 *
 * Protects against:
 * - Malformed JSON
 * - Unexpected data structures
 * - Missing type validation
 * - Large payload attacks
 */

/**
 * Type guard function type.
 * Returns true if the value matches the expected type T.
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * Safely parse JSON with optional validation.
 *
 * @param raw - JSON string to parse
 * @param validator - Optional type guard to validate structure
 * @returns Parsed and validated object
 * @throws Error with descriptive message if parsing or validation fails
 *
 * @example
 * ```typescript
 * interface Config {
 *   port: number;
 *   host: string;
 * }
 *
 * function isConfig(x: unknown): x is Config {
 *   return (
 *     typeof x === "object" &&
 *     x !== null &&
 *     "port" in x &&
 *     typeof x.port === "number" &&
 *     "host" in x &&
 *     typeof x.host === "string"
 *   );
 * }
 *
 * const config = parseJSONSafe<Config>(jsonString, isConfig);
 * ```
 */
export function parseJSONSafe<T>(raw: string, validator?: TypeGuard<T>): T {
  if (typeof raw !== "string") {
    throw new Error("Invalid input: expected string for JSON parsing");
  }

  if (!raw.trim()) {
    throw new Error("Invalid input: empty JSON string");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`JSON parse failed: ${message}`, { cause: err });
  }

  if (validator && !validator(parsed)) {
    throw new Error("JSON validation failed: parsed value does not match expected structure");
  }

  return parsed as T;
}

/**
 * Try to parse JSON, returning undefined on failure.
 *
 * @param raw - JSON string to parse
 * @param validator - Optional type guard to validate structure
 * @returns Parsed object or undefined if parsing/validation fails
 *
 * @example
 * ```typescript
 * const config = tryParseJSON<Config>(jsonString, isConfig);
 * if (config) {
 *   console.log(config.port);
 * } else {
 *   console.log("Invalid JSON");
 * }
 * ```
 */
export function tryParseJSON<T>(raw: string, validator?: TypeGuard<T>): T | undefined {
  try {
    return parseJSONSafe<T>(raw, validator);
  } catch {
    return undefined;
  }
}

/**
 * Safely parse JSON with size limit.
 *
 * @param raw - JSON string to parse
 * @param maxBytes - Maximum allowed size in bytes
 * @param validator - Optional type guard to validate structure
 * @returns Parsed and validated object
 * @throws Error if size exceeds limit or parsing fails
 *
 * @example
 * ```typescript
 * const MAX_CONFIG_SIZE = 1024 * 100; // 100KB
 * const config = parseJSONSafeWithLimit(jsonString, MAX_CONFIG_SIZE, isConfig);
 * ```
 */
export function parseJSONSafeWithLimit<T>(
  raw: string,
  maxBytes: number,
  validator?: TypeGuard<T>,
): T {
  if (typeof raw !== "string") {
    throw new Error("Invalid input: expected string for JSON parsing");
  }

  // Use byte length (UTF-8 encoding) rather than string length
  const byteLength = Buffer.byteLength(raw, "utf8");
  if (byteLength > maxBytes) {
    throw new Error(`JSON size limit exceeded: ${byteLength} bytes > ${maxBytes} bytes maximum`);
  }

  return parseJSONSafe<T>(raw, validator);
}

/**
 * Safely stringify object to JSON with error handling.
 *
 * @param value - Value to stringify
 * @param pretty - Whether to format with indentation (default: false)
 * @returns JSON string
 * @throws Error if stringification fails
 *
 * @example
 * ```typescript
 * const json = stringifyJSONSafe(config, true);
 * ```
 */
export function stringifyJSONSafe(value: unknown, pretty = false): string {
  try {
    return pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`JSON stringify failed: ${message}`, { cause: err });
  }
}

/**
 * Try to stringify object to JSON, returning undefined on failure.
 *
 * @param value - Value to stringify
 * @param pretty - Whether to format with indentation (default: false)
 * @returns JSON string or undefined if stringification fails
 */
export function tryStringifyJSON(value: unknown, pretty = false): string | undefined {
  try {
    return stringifyJSONSafe(value, pretty);
  } catch {
    return undefined;
  }
}

/**
 * Common type guards for validation.
 */
export const TypeGuards = {
  /**
   * Check if value is a non-null object.
   */
  isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  },

  /**
   * Check if value is an array.
   */
  isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
  },

  /**
   * Check if value is a string.
   */
  isString(value: unknown): value is string {
    return typeof value === "string";
  },

  /**
   * Check if value is a number.
   */
  isNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
  },

  /**
   * Check if value is a boolean.
   */
  isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
  },

  /**
   * Check if value is null.
   */
  isNull(value: unknown): value is null {
    return value === null;
  },

  /**
   * Check if value is an object with specific keys.
   */
  hasKeys<K extends string>(value: unknown, keys: K[]): value is Record<K, unknown> {
    if (!TypeGuards.isObject(value)) {
      return false;
    }
    return keys.every((key) => key in value);
  },

  /**
   * Check if value is a string array.
   */
  isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
  },

  /**
   * Check if value is a number array.
   */
  isNumberArray(value: unknown): value is number[] {
    return (
      Array.isArray(value) &&
      value.every((item) => typeof item === "number" && Number.isFinite(item))
    );
  },
};

/**
 * Safely parse JSON from a file.
 * This is a convenience wrapper that handles both file reading and JSON parsing.
 *
 * Note: File I/O is inherently subject to race conditions. For production use,
 * consider using atomic file operations and proper error handling.
 *
 * @param filePath - Path to JSON file
 * @param validator - Optional type guard to validate structure
 * @returns Parsed and validated object
 * @throws Error if reading or parsing fails
 */
export async function parseJSONFromFile<T>(filePath: string, validator?: TypeGuard<T>): Promise<T> {
  const fs = await import("node:fs/promises");

  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to read JSON file ${filePath}: ${message}`, { cause: err });
  }

  try {
    return parseJSONSafe<T>(raw, validator);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse JSON from ${filePath}: ${message}`, { cause: err });
  }
}

/**
 * Safely write object to JSON file.
 *
 * @param filePath - Path to write JSON file
 * @param value - Value to write
 * @param pretty - Whether to format with indentation (default: true)
 * @throws Error if stringification or writing fails
 */
export async function writeJSONToFile(
  filePath: string,
  value: unknown,
  pretty = true,
): Promise<void> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const json = stringifyJSONSafe(value, pretty);

  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Write atomically by writing to temp file then renaming
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    await fs.writeFile(tempPath, json, "utf8");
    await fs.rename(tempPath, filePath);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to write JSON to ${filePath}: ${message}`, { cause: err });
  }
}
