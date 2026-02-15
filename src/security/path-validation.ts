/**
 * Path validation utilities for preventing path traversal attacks.
 *
 * Defense-in-depth security controls for file system operations.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * Validates that a file path is within an allowed directory.
 * Prevents path traversal attacks like "../../../etc/passwd".
 *
 * @param filePath - The file path to validate
 * @param allowedDir - The directory that filePath must be within
 * @returns true if the path is safe, false otherwise
 *
 * @example
 * ```typescript
 * const safe = validatePathIsWithinDirectory(
 *   "/app/data/../../../etc/passwd",
 *   "/app/data"
 * ); // returns false
 *
 * const safe = validatePathIsWithinDirectory(
 *   "/app/data/user/file.txt",
 *   "/app/data"
 * ); // returns true
 * ```
 */
export function validatePathIsWithinDirectory(filePath: string, allowedDir: string): boolean {
  if (!filePath || !allowedDir) {
    return false;
  }

  try {
    // Resolve to absolute paths to handle .. and . correctly
    const resolved = path.resolve(filePath);
    const allowed = path.resolve(allowedDir);

    // Ensure the resolved path starts with the allowed directory
    // Add path separator to prevent partial matches like:
    // "/app/data-evil" matching "/app/data"
    return resolved.startsWith(allowed + path.sep) || resolved === allowed;
  } catch {
    return false;
  }
}

/**
 * Validates and normalizes a file path, ensuring it's within an allowed directory.
 * Throws an error if the path is invalid or outside the allowed directory.
 *
 * @param filePath - The file path to validate and normalize
 * @param allowedDir - The directory that filePath must be within
 * @returns The normalized absolute path
 * @throws Error if the path is invalid or outside the allowed directory
 *
 * @example
 * ```typescript
 * const safe = validateAndNormalizePath(
 *   "user/../admin/config.json",
 *   "/app/data"
 * ); // throws Error: Path traversal detected
 * ```
 */
export function validateAndNormalizePath(filePath: string, allowedDir: string): string {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("Invalid file path: path must be a non-empty string");
  }

  if (!allowedDir || typeof allowedDir !== "string") {
    throw new Error("Invalid allowed directory: must be a non-empty string");
  }

  const normalized = path.resolve(filePath);

  if (!validatePathIsWithinDirectory(normalized, allowedDir)) {
    throw new Error(
      `Path traversal detected: "${filePath}" is outside allowed directory "${allowedDir}"`,
    );
  }

  return normalized;
}

/**
 * Checks if a path contains potentially dangerous sequences.
 * This is a heuristic check, not a replacement for proper validation.
 *
 * @param filePath - The file path to check
 * @returns true if dangerous patterns are detected, false otherwise
 *
 * Dangerous patterns include:
 * - Parent directory references: "../"
 * - Null bytes: "\0"
 * - Absolute paths when relative expected
 * - Unicode/encoded path separators
 */
export function containsDangerousPathPatterns(filePath: string): boolean {
  if (!filePath || typeof filePath !== "string") {
    return true;
  }

  // Check for null bytes (path truncation attack)
  if (filePath.includes("\0")) {
    return true;
  }

  // Check for parent directory traversal
  if (filePath.includes("..")) {
    return true;
  }

  // Check for Unicode path separators (bypass attempts)
  if (/[\u2044\u2215\uFF0F]/.test(filePath)) {
    return true;
  }

  return false;
}

/**
 * Validates that a path points to a regular file (not a symlink, device, etc.)
 * This prevents symlink attacks and device file access.
 *
 * @param filePath - The file path to validate
 * @returns true if the path is a regular file, false otherwise
 *
 * @example
 * ```typescript
 * const safe = await isRegularFile("/app/data/file.txt"); // true
 * const safe = await isRegularFile("/dev/null"); // false
 * const safe = await isRegularFile("/app/link-to-etc-passwd"); // false
 * ```
 */
export async function isRegularFile(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.promises.lstat(filePath); // lstat doesn't follow symlinks
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Validates that a path points to a regular directory (not a symlink).
 *
 * @param dirPath - The directory path to validate
 * @returns true if the path is a regular directory, false otherwise
 */
export async function isRegularDirectory(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.promises.lstat(dirPath); // lstat doesn't follow symlinks
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Safely lists files in a directory, ensuring no symlinks are followed.
 *
 * @param dirPath - The directory to list
 * @param allowedDir - The directory that all paths must be within
 * @returns Array of safe file paths within the directory
 * @throws Error if dirPath is outside allowedDir
 */
export async function safeReaddir(
  dirPath: string,
  allowedDir: string,
): Promise<{ name: string; path: string; isFile: boolean; isDirectory: boolean }[]> {
  const normalizedDir = validateAndNormalizePath(dirPath, allowedDir);

  const entries = await fs.promises.readdir(normalizedDir, { withFileTypes: true });

  const results: { name: string; path: string; isFile: boolean; isDirectory: boolean }[] = [];

  for (const entry of entries) {
    const fullPath = path.join(normalizedDir, entry.name);

    // Skip symlinks (defense-in-depth)
    if (entry.isSymbolicLink()) {
      continue;
    }

    // Validate the full path is still within the allowed directory
    if (!validatePathIsWithinDirectory(fullPath, allowedDir)) {
      continue;
    }

    results.push({
      name: entry.name,
      path: fullPath,
      isFile: entry.isFile(),
      isDirectory: entry.isDirectory(),
    });
  }

  return results;
}

/**
 * Sanitizes a filename by removing dangerous characters.
 * Use this for user-provided filenames before storing them.
 *
 * @param filename - The filename to sanitize
 * @returns Sanitized filename safe for storage
 *
 * Removes:
 * - Path separators (/ and \)
 * - Null bytes
 * - Control characters
 * - Leading/trailing whitespace and dots
 *
 * @example
 * ```typescript
 * const safe = sanitizeFilename("../../etc/passwd"); // "etc-passwd"
 * const safe = sanitizeFilename("file\0.txt"); // "file.txt"
 * ```
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return "unnamed";
  }

  // Remove null bytes and control characters
  // eslint-disable-next-line no-control-regex -- intentionally removing control characters
  let sanitized = filename.replace(/[\0-\x1F\x7F]/g, "");

  // Remove path separators
  sanitized = sanitized.replace(/[/\\]/g, "-");

  // Remove leading/trailing whitespace
  sanitized = sanitized.trim();

  // Remove leading dots and dashes (from ../ or // patterns)
  sanitized = sanitized.replace(/^[.-]+/, "");

  // Remove trailing dots (but not trailing extension dots)
  sanitized = sanitized.replace(/\.+$/, "");

  // If empty after sanitization, return a default name
  if (!sanitized) {
    return "unnamed";
  }

  // Limit length to prevent DoS
  const maxLength = 255;
  if (sanitized.length > maxLength) {
    const ext = path.extname(sanitized);
    const base = path.basename(sanitized, ext);
    sanitized = base.slice(0, maxLength - ext.length) + ext;
  }

  return sanitized;
}
