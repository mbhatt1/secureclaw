import { describe, expect, it } from "vitest";
import {
  containsDangerousPathPatterns,
  sanitizeFilename,
  validateAndNormalizePath,
  validatePathIsWithinDirectory,
} from "./path-validation.js";

describe("validatePathIsWithinDirectory", () => {
  it("should allow valid paths within directory", () => {
    expect(validatePathIsWithinDirectory("/app/data/file.txt", "/app/data")).toBe(true);
    expect(validatePathIsWithinDirectory("/app/data/subdir/file.txt", "/app/data")).toBe(true);
    expect(validatePathIsWithinDirectory("/app/data", "/app/data")).toBe(true);
  });

  it("should reject path traversal attempts", () => {
    expect(validatePathIsWithinDirectory("/app/data/../etc/passwd", "/app/data")).toBe(false);
    expect(validatePathIsWithinDirectory("/app/data/../../etc/passwd", "/app/data")).toBe(false);
    expect(validatePathIsWithinDirectory("/etc/passwd", "/app/data")).toBe(false);
  });

  it("should reject partial directory name matches", () => {
    // "/app/data-evil" should not match "/app/data"
    expect(validatePathIsWithinDirectory("/app/data-evil/file.txt", "/app/data")).toBe(false);
  });

  it("should handle empty or invalid inputs", () => {
    expect(validatePathIsWithinDirectory("", "/app/data")).toBe(false);
    expect(validatePathIsWithinDirectory("/app/data/file.txt", "")).toBe(false);
  });
});

describe("validateAndNormalizePath", () => {
  it("should normalize and validate safe paths", () => {
    const result = validateAndNormalizePath("/app/data/file.txt", "/app/data");
    expect(result).toContain("/app/data/file.txt");
  });

  it("should throw on path traversal attempts", () => {
    expect(() => validateAndNormalizePath("/app/data/../etc/passwd", "/app/data")).toThrow(
      /path traversal/i,
    );
    expect(() => validateAndNormalizePath("/etc/passwd", "/app/data")).toThrow(/path traversal/i);
  });

  it("should throw on invalid inputs", () => {
    expect(() => validateAndNormalizePath("", "/app/data")).toThrow(/invalid file path/i);
    expect(() => validateAndNormalizePath("/app/data/file.txt", "")).toThrow(
      /invalid allowed directory/i,
    );
  });
});

describe("containsDangerousPathPatterns", () => {
  it("should detect parent directory references", () => {
    expect(containsDangerousPathPatterns("../etc/passwd")).toBe(true);
    expect(containsDangerousPathPatterns("file/../etc/passwd")).toBe(true);
  });

  it("should detect null bytes", () => {
    expect(containsDangerousPathPatterns("file\0.txt")).toBe(true);
  });

  it("should detect Unicode path separators", () => {
    expect(containsDangerousPathPatterns("file\u2044etc\u2215passwd")).toBe(true);
  });

  it("should allow safe paths", () => {
    expect(containsDangerousPathPatterns("file.txt")).toBe(false);
    expect(containsDangerousPathPatterns("subdir/file.txt")).toBe(false);
  });

  it("should handle invalid inputs", () => {
    expect(containsDangerousPathPatterns("")).toBe(true);
  });
});

describe("sanitizeFilename", () => {
  it("should remove path separators", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("..-..-etc-passwd");
    expect(sanitizeFilename("dir/file.txt")).toBe("dir-file.txt");
    expect(sanitizeFilename("dir\\file.txt")).toBe("dir-file.txt");
  });

  it("should remove null bytes", () => {
    expect(sanitizeFilename("file\0.txt")).toBe("file.txt");
  });

  it("should remove control characters", () => {
    expect(sanitizeFilename("file\x00\x1F\x7F.txt")).toBe("file.txt");
  });

  it("should trim whitespace and leading dots", () => {
    expect(sanitizeFilename("  file.txt  ")).toBe("file.txt");
    expect(sanitizeFilename("...file.txt")).toBe("file.txt");
    expect(sanitizeFilename("file.txt...")).toBe("file.txt");
  });

  it("should return default for empty results", () => {
    expect(sanitizeFilename("")).toBe("unnamed");
    expect(sanitizeFilename("///")).toBe("unnamed");
    expect(sanitizeFilename("...")).toBe("unnamed");
  });

  it("should limit filename length", () => {
    const longName = "a".repeat(300) + ".txt";
    const result = sanitizeFilename(longName);
    expect(result.length).toBeLessThanOrEqual(255);
    expect(result.endsWith(".txt")).toBe(true);
  });
});
