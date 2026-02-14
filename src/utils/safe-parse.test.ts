import { describe, it, expect } from "vitest";
import {
  parseIntSafe,
  parseFloatSafe,
  parsePortSafe,
  parseLatitudeSafe,
  parseLongitudeSafe,
  parsePositiveIntSafe,
  parseNonNegativeIntSafe,
  parsePercentageSafe,
  parseTimeoutMsSafe,
  tryParseInt,
  tryParseFloat,
} from "./safe-parse.js";

describe("parseIntSafe", () => {
  it("parses valid integers", () => {
    expect(parseIntSafe("42")).toBe(42);
    expect(parseIntSafe("-42")).toBe(-42);
    expect(parseIntSafe("0")).toBe(0);
  });

  it("parses with custom radix", () => {
    expect(parseIntSafe("FF", 16)).toBe(255);
    expect(parseIntSafe("1010", 2)).toBe(10);
    expect(parseIntSafe("77", 8)).toBe(63);
  });

  it("rejects non-string input", () => {
    expect(() => parseIntSafe("" as any)).toThrow("non-empty string");
  });

  it("rejects empty strings", () => {
    expect(() => parseIntSafe("")).toThrow("non-empty string");
    expect(() => parseIntSafe("   ")).toThrow("non-empty string");
  });

  it("rejects invalid integers", () => {
    expect(() => parseIntSafe("abc")).toThrow("Invalid integer");
    expect(() => parseIntSafe("12.34")).toThrow("Invalid integer");
    expect(() => parseIntSafe("infinity")).toThrow("Invalid integer");
  });

  it("rejects overflow values", () => {
    const maxSafe = Number.MAX_SAFE_INTEGER.toString();
    const tooLarge = "9007199254740992"; // MAX_SAFE_INTEGER + 1

    expect(parseIntSafe(maxSafe)).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => parseIntSafe(tooLarge)).toThrow("overflow");
  });

  it("rejects underflow values", () => {
    const minSafe = Number.MIN_SAFE_INTEGER.toString();
    const tooSmall = "-9007199254740992"; // MIN_SAFE_INTEGER - 1

    expect(parseIntSafe(minSafe)).toBe(Number.MIN_SAFE_INTEGER);
    expect(() => parseIntSafe(tooSmall)).toThrow("overflow");
  });

  it("validates minimum value", () => {
    expect(parseIntSafe("5", 10, 0)).toBe(5);
    expect(() => parseIntSafe("-5", 10, 0)).toThrow("below minimum");
  });

  it("validates maximum value", () => {
    expect(parseIntSafe("5", 10, 0, 10)).toBe(5);
    expect(() => parseIntSafe("15", 10, 0, 10)).toThrow("above maximum");
  });

  it("rejects invalid radix", () => {
    expect(() => parseIntSafe("42", 1)).toThrow("Invalid radix");
    expect(() => parseIntSafe("42", 37)).toThrow("Invalid radix");
  });
});

describe("parseFloatSafe", () => {
  it("parses valid floats", () => {
    expect(parseFloatSafe("3.14")).toBe(3.14);
    expect(parseFloatSafe("-2.5")).toBe(-2.5);
    expect(parseFloatSafe("0.0")).toBe(0.0);
  });

  it("parses scientific notation", () => {
    expect(parseFloatSafe("1e10")).toBe(1e10);
    expect(parseFloatSafe("1.5e-3")).toBe(0.0015);
  });

  it("rejects non-string input", () => {
    expect(() => parseFloatSafe("" as any)).toThrow("non-empty string");
  });

  it("rejects empty strings", () => {
    expect(() => parseFloatSafe("")).toThrow("non-empty string");
  });

  it("rejects invalid floats", () => {
    expect(() => parseFloatSafe("abc")).toThrow("Invalid float");
    expect(() => parseFloatSafe("NaN")).toThrow("Invalid float");
    expect(() => parseFloatSafe("Infinity")).toThrow("Invalid float");
  });

  it("validates minimum value", () => {
    expect(parseFloatSafe("5.5", 0)).toBe(5.5);
    expect(() => parseFloatSafe("-1.0", 0)).toThrow("below minimum");
  });

  it("validates maximum value", () => {
    expect(parseFloatSafe("5.5", 0, 10)).toBe(5.5);
    expect(() => parseFloatSafe("15.5", 0, 10)).toThrow("above maximum");
  });
});

describe("parsePortSafe", () => {
  it("parses valid ports", () => {
    expect(parsePortSafe("80")).toBe(80);
    expect(parsePortSafe("443")).toBe(443);
    expect(parsePortSafe("8080")).toBe(8080);
    expect(parsePortSafe("65535")).toBe(65535);
  });

  it("rejects port 0", () => {
    expect(() => parsePortSafe("0")).toThrow("below minimum");
  });

  it("rejects ports above 65535", () => {
    expect(() => parsePortSafe("65536")).toThrow("above maximum");
    expect(() => parsePortSafe("100000")).toThrow("above maximum");
  });

  it("rejects negative ports", () => {
    expect(() => parsePortSafe("-1")).toThrow("below minimum");
  });
});

describe("parseLatitudeSafe", () => {
  it("parses valid latitudes", () => {
    expect(parseLatitudeSafe("0")).toBe(0);
    expect(parseLatitudeSafe("45.5")).toBe(45.5);
    expect(parseLatitudeSafe("-45.5")).toBe(-45.5);
    expect(parseLatitudeSafe("90")).toBe(90);
    expect(parseLatitudeSafe("-90")).toBe(-90);
  });

  it("rejects latitudes above 90", () => {
    expect(() => parseLatitudeSafe("90.1")).toThrow("above maximum");
    expect(() => parseLatitudeSafe("180")).toThrow("above maximum");
  });

  it("rejects latitudes below -90", () => {
    expect(() => parseLatitudeSafe("-90.1")).toThrow("below minimum");
    expect(() => parseLatitudeSafe("-180")).toThrow("below minimum");
  });
});

describe("parseLongitudeSafe", () => {
  it("parses valid longitudes", () => {
    expect(parseLongitudeSafe("0")).toBe(0);
    expect(parseLongitudeSafe("122.4")).toBe(122.4);
    expect(parseLongitudeSafe("-122.4")).toBe(-122.4);
    expect(parseLongitudeSafe("180")).toBe(180);
    expect(parseLongitudeSafe("-180")).toBe(-180);
  });

  it("rejects longitudes above 180", () => {
    expect(() => parseLongitudeSafe("180.1")).toThrow("above maximum");
    expect(() => parseLongitudeSafe("360")).toThrow("above maximum");
  });

  it("rejects longitudes below -180", () => {
    expect(() => parseLongitudeSafe("-180.1")).toThrow("below minimum");
    expect(() => parseLongitudeSafe("-360")).toThrow("below minimum");
  });
});

describe("parsePositiveIntSafe", () => {
  it("parses positive integers", () => {
    expect(parsePositiveIntSafe("1")).toBe(1);
    expect(parsePositiveIntSafe("100")).toBe(100);
  });

  it("rejects zero", () => {
    expect(() => parsePositiveIntSafe("0")).toThrow("below minimum");
  });

  it("rejects negative numbers", () => {
    expect(() => parsePositiveIntSafe("-1")).toThrow("below minimum");
  });

  it("respects maximum value", () => {
    expect(parsePositiveIntSafe("5", 10)).toBe(5);
    expect(() => parsePositiveIntSafe("15", 10)).toThrow("above maximum");
  });
});

describe("parseNonNegativeIntSafe", () => {
  it("parses non-negative integers", () => {
    expect(parseNonNegativeIntSafe("0")).toBe(0);
    expect(parseNonNegativeIntSafe("1")).toBe(1);
    expect(parseNonNegativeIntSafe("100")).toBe(100);
  });

  it("rejects negative numbers", () => {
    expect(() => parseNonNegativeIntSafe("-1")).toThrow("below minimum");
  });

  it("respects maximum value", () => {
    expect(parseNonNegativeIntSafe("5", 10)).toBe(5);
    expect(() => parseNonNegativeIntSafe("15", 10)).toThrow("above maximum");
  });
});

describe("parsePercentageSafe", () => {
  it("parses valid percentages", () => {
    expect(parsePercentageSafe("0")).toBe(0);
    expect(parsePercentageSafe("50")).toBe(50);
    expect(parsePercentageSafe("100")).toBe(100);
    expect(parsePercentageSafe("33.333")).toBe(33.333);
  });

  it("rejects negative percentages", () => {
    expect(() => parsePercentageSafe("-1")).toThrow("below minimum");
  });

  it("rejects percentages above 100", () => {
    expect(() => parsePercentageSafe("100.1")).toThrow("above maximum");
    expect(() => parsePercentageSafe("200")).toThrow("above maximum");
  });
});

describe("parseTimeoutMsSafe", () => {
  it("parses valid timeouts", () => {
    expect(parseTimeoutMsSafe("1000")).toBe(1000);
    expect(parseTimeoutMsSafe("5000")).toBe(5000);
  });

  it("rejects timeout below 1ms", () => {
    expect(() => parseTimeoutMsSafe("0")).toThrow("below minimum");
  });

  it("rejects timeout above default max (10 minutes)", () => {
    const tenMinutes = 10 * 60 * 1000;
    expect(parseTimeoutMsSafe(tenMinutes.toString())).toBe(tenMinutes);
    expect(() => parseTimeoutMsSafe((tenMinutes + 1).toString())).toThrow("above maximum");
  });

  it("accepts custom min/max", () => {
    expect(parseTimeoutMsSafe("5000", 1000, 10000)).toBe(5000);
    expect(() => parseTimeoutMsSafe("500", 1000, 10000)).toThrow("below minimum");
    expect(() => parseTimeoutMsSafe("15000", 1000, 10000)).toThrow("above maximum");
  });
});

describe("tryParseInt", () => {
  it("returns number on success", () => {
    expect(tryParseInt("42")).toBe(42);
    expect(tryParseInt("FF", 16)).toBe(255);
  });

  it("returns undefined on failure", () => {
    expect(tryParseInt("abc")).toBeUndefined();
    expect(tryParseInt("")).toBeUndefined();
    expect(tryParseInt("9007199254740992")).toBeUndefined();
  });
});

describe("tryParseFloat", () => {
  it("returns number on success", () => {
    expect(tryParseFloat("3.14")).toBe(3.14);
    expect(tryParseFloat("-2.5")).toBe(-2.5);
  });

  it("returns undefined on failure", () => {
    expect(tryParseFloat("abc")).toBeUndefined();
    expect(tryParseFloat("")).toBeUndefined();
    expect(tryParseFloat("NaN")).toBeUndefined();
  });
});
