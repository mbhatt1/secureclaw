import { describe, it, expect } from "vitest";
import {
  parseJSONSafe,
  tryParseJSON,
  parseJSONSafeWithLimit,
  stringifyJSONSafe,
  tryStringifyJSON,
  TypeGuards,
  type TypeGuard,
} from "./safe-json.js";

describe("parseJSONSafe", () => {
  it("parses valid JSON", () => {
    expect(parseJSONSafe('{"key":"value"}')).toEqual({ key: "value" });
    expect(parseJSONSafe("[1,2,3]")).toEqual([1, 2, 3]);
    expect(parseJSONSafe("42")).toBe(42);
    expect(parseJSONSafe('"string"')).toBe("string");
    expect(parseJSONSafe("true")).toBe(true);
    expect(parseJSONSafe("null")).toBe(null);
  });

  it("rejects non-string input", () => {
    expect(() => parseJSONSafe(123 as any)).toThrow("expected string");
  });

  it("rejects empty string", () => {
    expect(() => parseJSONSafe("")).toThrow("empty JSON string");
    expect(() => parseJSONSafe("   ")).toThrow("empty JSON string");
  });

  it("rejects malformed JSON", () => {
    expect(() => parseJSONSafe("{invalid}")).toThrow("JSON parse failed");
    expect(() => parseJSONSafe('{"key": value}')).toThrow("JSON parse failed");
    expect(() => parseJSONSafe("[1,2,")).toThrow("JSON parse failed");
  });

  it("validates with type guard", () => {
    interface User {
      name: string;
      age: number;
    }

    const isUser: TypeGuard<User> = (x): x is User =>
      typeof x === "object" &&
      x !== null &&
      "name" in x &&
      typeof x.name === "string" &&
      "age" in x &&
      typeof x.age === "number";

    const validUser = '{"name":"Alice","age":30}';
    const invalidUser = '{"name":"Alice"}'; // missing age

    expect(parseJSONSafe<User>(validUser, isUser)).toEqual({
      name: "Alice",
      age: 30,
    });

    expect(() => parseJSONSafe<User>(invalidUser, isUser)).toThrow("validation failed");
  });

  it("passes validation without type guard", () => {
    expect(parseJSONSafe('{"any":"structure"}')).toEqual({ any: "structure" });
  });
});

describe("tryParseJSON", () => {
  it("returns parsed value on success", () => {
    expect(tryParseJSON('{"key":"value"}')).toEqual({ key: "value" });
  });

  it("returns undefined on failure", () => {
    expect(tryParseJSON("invalid")).toBeUndefined();
    expect(tryParseJSON("")).toBeUndefined();
    expect(tryParseJSON("{")).toBeUndefined();
  });

  it("returns undefined on validation failure", () => {
    const isNumber: TypeGuard<number> = (x): x is number => typeof x === "number";

    expect(tryParseJSON("42", isNumber)).toBe(42);
    expect(tryParseJSON('"string"', isNumber)).toBeUndefined();
  });
});

describe("parseJSONSafeWithLimit", () => {
  it("parses JSON within size limit", () => {
    const json = '{"key":"value"}';
    const maxBytes = Buffer.byteLength(json, "utf8");

    expect(parseJSONSafeWithLimit(json, maxBytes)).toEqual({ key: "value" });
    expect(parseJSONSafeWithLimit(json, maxBytes + 100)).toEqual({ key: "value" });
  });

  it("rejects JSON exceeding size limit", () => {
    const json = '{"key":"value"}';
    const maxBytes = Buffer.byteLength(json, "utf8") - 1;

    expect(() => parseJSONSafeWithLimit(json, maxBytes)).toThrow("size limit exceeded");
  });

  it("measures byte length correctly for UTF-8", () => {
    const json = '{"emoji":"😀"}'; // Emoji is 4 bytes
    const byteLength = Buffer.byteLength(json, "utf8");

    expect(parseJSONSafeWithLimit(json, byteLength)).toEqual({ emoji: "😀" });
    expect(() => parseJSONSafeWithLimit(json, byteLength - 1)).toThrow("size limit exceeded");
  });

  it("validates with type guard", () => {
    const isObject: TypeGuard<Record<string, unknown>> = (x): x is Record<string, unknown> =>
      typeof x === "object" && x !== null && !Array.isArray(x);

    const json = '{"key":"value"}';
    const maxBytes = Buffer.byteLength(json, "utf8");

    expect(parseJSONSafeWithLimit(json, maxBytes, isObject)).toEqual({ key: "value" });
  });
});

describe("stringifyJSONSafe", () => {
  it("stringifies valid values", () => {
    expect(stringifyJSONSafe({ key: "value" })).toBe('{"key":"value"}');
    expect(stringifyJSONSafe([1, 2, 3])).toBe("[1,2,3]");
    expect(stringifyJSONSafe(42)).toBe("42");
    expect(stringifyJSONSafe("string")).toBe('"string"');
    expect(stringifyJSONSafe(true)).toBe("true");
    expect(stringifyJSONSafe(null)).toBe("null");
  });

  it("stringifies with pretty formatting", () => {
    const obj = { key: "value", nested: { a: 1 } };
    const pretty = stringifyJSONSafe(obj, true);

    expect(pretty).toContain("\n");
    expect(pretty).toContain("  ");
    expect(JSON.parse(pretty)).toEqual(obj);
  });

  it("handles circular references with error", () => {
    const circular: any = { a: 1 };
    circular.self = circular;

    expect(() => stringifyJSONSafe(circular)).toThrow("JSON stringify failed");
  });

  it("handles non-serializable values", () => {
    const value = { func: () => {} };
    const json = stringifyJSONSafe(value);
    expect(json).toBe("{}"); // Functions are omitted
  });
});

describe("tryStringifyJSON", () => {
  it("returns string on success", () => {
    expect(tryStringifyJSON({ key: "value" })).toBe('{"key":"value"}');
  });

  it("returns undefined on failure", () => {
    const circular: any = { a: 1 };
    circular.self = circular;

    expect(tryStringifyJSON(circular)).toBeUndefined();
  });
});

describe("TypeGuards", () => {
  describe("isObject", () => {
    it("identifies objects", () => {
      expect(TypeGuards.isObject({})).toBe(true);
      expect(TypeGuards.isObject({ key: "value" })).toBe(true);
    });

    it("rejects non-objects", () => {
      expect(TypeGuards.isObject(null)).toBe(false);
      expect(TypeGuards.isObject([])).toBe(false);
      expect(TypeGuards.isObject("string")).toBe(false);
      expect(TypeGuards.isObject(42)).toBe(false);
      expect(TypeGuards.isObject(undefined)).toBe(false);
    });
  });

  describe("isArray", () => {
    it("identifies arrays", () => {
      expect(TypeGuards.isArray([])).toBe(true);
      expect(TypeGuards.isArray([1, 2, 3])).toBe(true);
    });

    it("rejects non-arrays", () => {
      expect(TypeGuards.isArray({})).toBe(false);
      expect(TypeGuards.isArray("string")).toBe(false);
      expect(TypeGuards.isArray(null)).toBe(false);
    });
  });

  describe("isString", () => {
    it("identifies strings", () => {
      expect(TypeGuards.isString("")).toBe(true);
      expect(TypeGuards.isString("hello")).toBe(true);
    });

    it("rejects non-strings", () => {
      expect(TypeGuards.isString(42)).toBe(false);
      expect(TypeGuards.isString(null)).toBe(false);
      expect(TypeGuards.isString({})).toBe(false);
    });
  });

  describe("isNumber", () => {
    it("identifies finite numbers", () => {
      expect(TypeGuards.isNumber(0)).toBe(true);
      expect(TypeGuards.isNumber(42)).toBe(true);
      expect(TypeGuards.isNumber(-3.14)).toBe(true);
    });

    it("rejects non-numbers and non-finite values", () => {
      expect(TypeGuards.isNumber(NaN)).toBe(false);
      expect(TypeGuards.isNumber(Infinity)).toBe(false);
      expect(TypeGuards.isNumber(-Infinity)).toBe(false);
      expect(TypeGuards.isNumber("42")).toBe(false);
      expect(TypeGuards.isNumber(null)).toBe(false);
    });
  });

  describe("isBoolean", () => {
    it("identifies booleans", () => {
      expect(TypeGuards.isBoolean(true)).toBe(true);
      expect(TypeGuards.isBoolean(false)).toBe(true);
    });

    it("rejects non-booleans", () => {
      expect(TypeGuards.isBoolean(1)).toBe(false);
      expect(TypeGuards.isBoolean("true")).toBe(false);
      expect(TypeGuards.isBoolean(null)).toBe(false);
    });
  });

  describe("isNull", () => {
    it("identifies null", () => {
      expect(TypeGuards.isNull(null)).toBe(true);
    });

    it("rejects non-null", () => {
      expect(TypeGuards.isNull(undefined)).toBe(false);
      expect(TypeGuards.isNull(0)).toBe(false);
      expect(TypeGuards.isNull("")).toBe(false);
      expect(TypeGuards.isNull(false)).toBe(false);
    });
  });

  describe("hasKeys", () => {
    it("validates objects with specified keys", () => {
      expect(TypeGuards.hasKeys({ name: "Alice", age: 30 }, ["name", "age"])).toBe(true);
      expect(TypeGuards.hasKeys({ name: "Alice", age: 30, extra: true }, ["name"])).toBe(true);
    });

    it("rejects objects missing keys", () => {
      expect(TypeGuards.hasKeys({ name: "Alice" }, ["name", "age"])).toBe(false);
      expect(TypeGuards.hasKeys({}, ["key"])).toBe(false);
    });

    it("rejects non-objects", () => {
      expect(TypeGuards.hasKeys(null, ["key"])).toBe(false);
      expect(TypeGuards.hasKeys([], ["key"])).toBe(false);
    });
  });

  describe("isStringArray", () => {
    it("identifies string arrays", () => {
      expect(TypeGuards.isStringArray([])).toBe(true);
      expect(TypeGuards.isStringArray(["a", "b", "c"])).toBe(true);
    });

    it("rejects non-string arrays", () => {
      expect(TypeGuards.isStringArray([1, 2, 3])).toBe(false);
      expect(TypeGuards.isStringArray(["a", 1])).toBe(false);
      expect(TypeGuards.isStringArray("not array")).toBe(false);
    });
  });

  describe("isNumberArray", () => {
    it("identifies number arrays", () => {
      expect(TypeGuards.isNumberArray([])).toBe(true);
      expect(TypeGuards.isNumberArray([1, 2, 3])).toBe(true);
      expect(TypeGuards.isNumberArray([3.14, -2.5])).toBe(true);
    });

    it("rejects non-number arrays", () => {
      expect(TypeGuards.isNumberArray(["a", "b"])).toBe(false);
      expect(TypeGuards.isNumberArray([1, "2"])).toBe(false);
      expect(TypeGuards.isNumberArray([NaN])).toBe(false);
      expect(TypeGuards.isNumberArray([Infinity])).toBe(false);
    });
  });
});
