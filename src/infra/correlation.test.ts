import { describe, expect, test } from "vitest";
import {
  extractCorrelationIdFromHeaders,
  generateCorrelationId,
  getCorrelationId,
  getOrGenerateCorrelationId,
  setCorrelationId,
  withCorrelationId,
} from "./correlation.js";

describe("correlation", () => {
  describe("generateCorrelationId", () => {
    test("generates a valid UUID", () => {
      const id = generateCorrelationId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test("generates unique IDs", () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("getCorrelationId and setCorrelationId", () => {
    test("returns undefined when no ID is set", () => {
      expect(getCorrelationId()).toBeUndefined();
    });

    test("throws error when setting invalid ID", () => {
      expect(() => setCorrelationId("")).toThrow("Correlation ID must be a non-empty string");
      expect(() => setCorrelationId(null as unknown as string)).toThrow(
        "Correlation ID must be a non-empty string",
      );
    });
  });

  describe("withCorrelationId", () => {
    test("sets correlation ID in scope", () => {
      const id = "test-123";
      const result = withCorrelationId(id, () => {
        const retrieved = getCorrelationId();
        expect(retrieved).toBe(id);
        return "success";
      });
      expect(result).toBe("success");
    });

    test("propagates correlation ID through async operations", async () => {
      const id = "async-test-456";
      await withCorrelationId(id, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        const retrieved = getCorrelationId();
        expect(retrieved).toBe(id);
      });
    });

    test("isolates correlation IDs between contexts", () => {
      const id1 = "context-1";
      const id2 = "context-2";

      withCorrelationId(id1, () => {
        expect(getCorrelationId()).toBe(id1);

        withCorrelationId(id2, () => {
          expect(getCorrelationId()).toBe(id2);
        });

        expect(getCorrelationId()).toBe(id1);
      });
    });

    test("throws error for invalid ID", () => {
      expect(() => withCorrelationId("", () => {})).toThrow(
        "Correlation ID must be a non-empty string",
      );
    });
  });

  describe("extractCorrelationIdFromHeaders", () => {
    test("extracts from X-Correlation-ID header", () => {
      const headers = { "x-correlation-id": "test-123" };
      expect(extractCorrelationIdFromHeaders(headers)).toBe("test-123");
    });

    test("extracts from X-Request-ID header", () => {
      const headers = { "x-request-id": "test-456" };
      expect(extractCorrelationIdFromHeaders(headers)).toBe("test-456");
    });

    test("extracts from X-Trace-ID header", () => {
      const headers = { "x-trace-id": "test-789" };
      expect(extractCorrelationIdFromHeaders(headers)).toBe("test-789");
    });

    test("prioritizes X-Correlation-ID over others", () => {
      const headers = {
        "x-correlation-id": "correlation-id",
        "x-request-id": "request-id",
        "x-trace-id": "trace-id",
      };
      expect(extractCorrelationIdFromHeaders(headers)).toBe("correlation-id");
    });

    test("handles array header values", () => {
      const headers = { "x-correlation-id": ["test-123", "test-456"] };
      expect(extractCorrelationIdFromHeaders(headers)).toBe("test-123");
    });

    test("returns undefined for missing headers", () => {
      const headers = {};
      expect(extractCorrelationIdFromHeaders(headers)).toBeUndefined();
    });

    test("returns undefined for empty header values", () => {
      const headers = { "x-correlation-id": "" };
      expect(extractCorrelationIdFromHeaders(headers)).toBeUndefined();
    });
  });

  describe("getOrGenerateCorrelationId", () => {
    test("returns existing correlation ID", () => {
      const id = "existing-123";
      withCorrelationId(id, () => {
        expect(getOrGenerateCorrelationId()).toBe(id);
      });
    });

    test("generates new ID when none exists", () => {
      const id = getOrGenerateCorrelationId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });
});
