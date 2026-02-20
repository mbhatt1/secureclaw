import { describe, expect, it } from "vitest";
import type { PIIType } from "./pii-scanner.js";
import { luhnCheck, PIIScanner } from "./pii-scanner.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const scanner = new PIIScanner();

function typesFound(text: string): PIIType[] {
  const result = scanner.scan(text);
  return [...new Set(result.matches.map((m) => m.type))];
}

// ---------------------------------------------------------------------------
// Luhn algorithm
// ---------------------------------------------------------------------------

describe("luhnCheck", () => {
  it("validates known-good card numbers", () => {
    // Visa test number
    expect(luhnCheck("4111111111111111")).toBe(true);
    // Mastercard test number
    expect(luhnCheck("5500000000000004")).toBe(true);
    // Amex test number
    expect(luhnCheck("378282246310005")).toBe(true);
    // Discover test number
    expect(luhnCheck("6011111111111117")).toBe(true);
  });

  it("rejects numbers that fail the checksum", () => {
    expect(luhnCheck("4111111111111112")).toBe(false);
    expect(luhnCheck("1234567890123456")).toBe(false);
  });

  it("handles strings with dashes/spaces", () => {
    expect(luhnCheck("4111-1111-1111-1111")).toBe(true);
    expect(luhnCheck("4111 1111 1111 1111")).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(luhnCheck("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Email detection
// ---------------------------------------------------------------------------

describe("email detection", () => {
  it("detects simple email addresses", () => {
    const result = scanner.scan("Contact us at user@example.com for help.");
    expect(result.found).toBe(true);
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].type).toBe("email");
    expect(result.matches[0].value).toBe("user@example.com");
    expect(result.matches[0].confidence).toBe("high");
  });

  it("detects emails with subdomains", () => {
    const result = scanner.scan("Send to admin@mail.corp.example.com");
    expect(result.found).toBe(true);
    expect(result.matches.some((m) => m.type === "email")).toBe(true);
  });

  it("detects emails with + addressing", () => {
    const _result = scanner.scan("user+tag@example.com");
    expect(typesFound("user+tag@example.com")).toContain("email");
  });

  it("detects emails with dots in local part", () => {
    expect(typesFound("first.last@example.com")).toContain("email");
  });

  it("detects multiple emails in same text", () => {
    const text = "From alice@example.com to bob@company.org";
    const result = scanner.scan(text);
    const emails = result.matches.filter((m) => m.type === "email");
    expect(emails).toHaveLength(2);
  });

  it("does not match strings without @ sign", () => {
    expect(typesFound("this is not an email")).not.toContain("email");
  });
});

// ---------------------------------------------------------------------------
// Phone number detection
// ---------------------------------------------------------------------------

describe("phone number detection", () => {
  it("detects US format with dashes: 555-123-4567", () => {
    expect(typesFound("Call 555-123-4567 today")).toContain("phone");
  });

  it("detects US format with dots: 555.123.4567", () => {
    expect(typesFound("Call 555.123.4567 today")).toContain("phone");
  });

  it("detects US format with parens: (555) 123-4567", () => {
    expect(typesFound("Call (555) 123-4567 today")).toContain("phone");
  });

  it("detects US format with country code: +1-555-123-4567", () => {
    expect(typesFound("Call +1-555-123-4567")).toContain("phone");
  });

  it("detects international format: +44 20 7946 0958", () => {
    expect(typesFound("UK: +44 20 7946 0958")).toContain("phone");
  });

  it("records correct indices", () => {
    const text = "Phone: 555-123-4567 end";
    const result = scanner.scan(text);
    const phone = result.matches.find((m) => m.type === "phone");
    expect(phone).toBeDefined();
    expect(phone!.value).toBe("555-123-4567");
    expect(text.slice(phone!.startIndex, phone!.endIndex)).toBe("555-123-4567");
  });
});

// ---------------------------------------------------------------------------
// SSN detection
// ---------------------------------------------------------------------------

describe("SSN detection", () => {
  it("detects SSN with dashes: 123-45-6789", () => {
    const result = scanner.scan("SSN: 123-45-6789");
    expect(result.found).toBe(true);
    const ssn = result.matches.find((m) => m.type === "ssn");
    expect(ssn).toBeDefined();
    expect(ssn!.value).toBe("123-45-6789");
    expect(ssn!.confidence).toBe("high");
  });

  it("rejects SSN starting with 000", () => {
    const result = scanner.scan("000-12-3456");
    const ssn = result.matches.find((m) => m.type === "ssn");
    expect(ssn).toBeUndefined();
  });

  it("rejects SSN starting with 666", () => {
    const result = scanner.scan("666-12-3456");
    const ssn = result.matches.find((m) => m.type === "ssn");
    expect(ssn).toBeUndefined();
  });

  it("rejects SSN starting with 900+", () => {
    const result = scanner.scan("900-12-3456");
    const ssn = result.matches.find((m) => m.type === "ssn");
    expect(ssn).toBeUndefined();
  });

  it("rejects SSN with group 00", () => {
    const result = scanner.scan("123-00-6789");
    const ssn = result.matches.find((m) => m.type === "ssn");
    expect(ssn).toBeUndefined();
  });

  it("detects SSN without dashes (low confidence)", () => {
    const result = scanner.scan("SSN 123456789");
    const ssn = result.matches.find((m) => m.type === "ssn");
    expect(ssn).toBeDefined();
    expect(ssn!.confidence).toBe("low");
  });
});

// ---------------------------------------------------------------------------
// Credit card detection
// ---------------------------------------------------------------------------

describe("credit card detection", () => {
  it("detects Visa test number: 4111111111111111", () => {
    const result = scanner.scan("Card: 4111111111111111");
    const cc = result.matches.find((m) => m.type === "credit_card");
    expect(cc).toBeDefined();
    expect(cc!.value).toBe("4111111111111111");
  });

  it("detects Visa with dashes: 4111-1111-1111-1111", () => {
    const result = scanner.scan("Card: 4111-1111-1111-1111");
    const cc = result.matches.find((m) => m.type === "credit_card");
    expect(cc).toBeDefined();
  });

  it("detects Mastercard test number: 5500000000000004", () => {
    const result = scanner.scan("MC: 5500000000000004");
    const cc = result.matches.find((m) => m.type === "credit_card");
    expect(cc).toBeDefined();
  });

  it("detects Amex test number: 378282246310005", () => {
    const result = scanner.scan("Amex: 378282246310005");
    const cc = result.matches.find((m) => m.type === "credit_card");
    expect(cc).toBeDefined();
  });

  it("detects Discover test number: 6011111111111117", () => {
    const result = scanner.scan("Discover: 6011111111111117");
    const cc = result.matches.find((m) => m.type === "credit_card");
    expect(cc).toBeDefined();
  });

  it("rejects numbers that fail Luhn check", () => {
    const result = scanner.scan("Card: 4111111111111112");
    const cc = result.matches.find((m) => m.type === "credit_card");
    expect(cc).toBeUndefined();
  });

  it("rejects random 16-digit numbers", () => {
    // 1234567890123456 fails Luhn
    const result = scanner.scan("Number: 1234567890123456");
    const cc = result.matches.find((m) => m.type === "credit_card");
    expect(cc).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// IP address detection
// ---------------------------------------------------------------------------

describe("IP address detection", () => {
  it("detects public IPv4 addresses", () => {
    expect(typesFound("Server at 8.8.8.8 responded")).toContain("ip_address");
  });

  it("excludes private 10.x.x.x ranges", () => {
    const result = scanner.scan("Internal: 10.0.0.1");
    const ip = result.matches.find((m) => m.type === "ip_address");
    expect(ip).toBeUndefined();
  });

  it("excludes localhost 127.x.x.x", () => {
    const result = scanner.scan("Localhost: 127.0.0.1");
    const ip = result.matches.find((m) => m.type === "ip_address");
    expect(ip).toBeUndefined();
  });

  it("excludes private 192.168.x.x ranges", () => {
    const result = scanner.scan("LAN: 192.168.1.1");
    const ip = result.matches.find((m) => m.type === "ip_address");
    expect(ip).toBeUndefined();
  });

  it("excludes private 172.16-31.x.x ranges", () => {
    const result = scanner.scan("LAN: 172.16.0.1");
    const ip = result.matches.find((m) => m.type === "ip_address");
    expect(ip).toBeUndefined();
  });

  it("allows 172.32.x.x (not private)", () => {
    expect(typesFound("IP: 172.32.0.1")).toContain("ip_address");
  });
});

// ---------------------------------------------------------------------------
// AWS key detection
// ---------------------------------------------------------------------------

describe("AWS key detection", () => {
  it("detects AKIA-prefixed keys", () => {
    const result = scanner.scan("Key: AKIAIOSFODNN7EXAMPLE");
    const aws = result.matches.find((m) => m.type === "aws_key");
    expect(aws).toBeDefined();
    expect(aws!.value).toBe("AKIAIOSFODNN7EXAMPLE");
    expect(aws!.confidence).toBe("high");
  });

  it("does not match partial AKIA prefixes", () => {
    // Too short
    const result = scanner.scan("AKIA1234");
    const aws = result.matches.find((m) => m.type === "aws_key");
    expect(aws).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// API key / token detection
// ---------------------------------------------------------------------------

describe("API key detection", () => {
  it("detects high-entropy strings of 40+ chars", () => {
    const token = "aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC";
    const result = scanner.scan(`Token: ${token}`);
    const api = result.matches.find((m) => m.type === "api_key");
    expect(api).toBeDefined();
  });

  it("rejects all-lowercase long words", () => {
    const word = "a".repeat(45);
    const result = scanner.scan(word);
    const api = result.matches.find((m) => m.type === "api_key");
    expect(api).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Password detection
// ---------------------------------------------------------------------------

describe("password detection", () => {
  it("detects password=value assignments", () => {
    expect(typesFound("password=SuperSecret123")).toContain("password");
  });

  it("detects passwd: value with quotes", () => {
    expect(typesFound('passwd: "mypassword"')).toContain("password");
  });

  it("detects pwd=value", () => {
    expect(typesFound("pwd=abc123")).toContain("password");
  });
});

// ---------------------------------------------------------------------------
// Address detection
// ---------------------------------------------------------------------------

describe("address detection", () => {
  it("detects US street addresses", () => {
    expect(typesFound("Lives at 123 Main Street")).toContain("address");
  });

  it("detects addresses with unit numbers", () => {
    expect(typesFound("456 Oak Avenue Apt 12")).toContain("address");
  });

  it("detects abbreviated street types", () => {
    expect(typesFound("789 Elm St")).toContain("address");
  });
});

// ---------------------------------------------------------------------------
// Date of birth detection
// ---------------------------------------------------------------------------

describe("date of birth detection", () => {
  it("detects DOB: MM/DD/YYYY", () => {
    expect(typesFound("DOB: 01/15/1990")).toContain("date_of_birth");
  });

  it("detects 'date of birth' label", () => {
    expect(typesFound("date of birth: 1990-01-15")).toContain("date_of_birth");
  });

  it("detects birthdate label", () => {
    expect(typesFound("birthdate: 03-22-1985")).toContain("date_of_birth");
  });
});

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

describe("redact", () => {
  it("replaces email with type label by default", () => {
    const out = scanner.redact("Email: user@example.com");
    expect(out).toBe("Email: [EMAIL REDACTED]");
  });

  it("replaces SSN with type label", () => {
    const out = scanner.redact("SSN: 123-45-6789");
    expect(out).toBe("SSN: [SSN REDACTED]");
  });

  it("replaces credit card with type label", () => {
    const out = scanner.redact("Card: 4111111111111111");
    expect(out).toBe("Card: [CREDIT_CARD REDACTED]");
  });

  it("redacts only specified types", () => {
    const text = "Email user@example.com SSN 123-45-6789";
    const out = scanner.redact(text, { types: ["ssn"] });
    expect(out).toContain("user@example.com");
    expect(out).toContain("[SSN REDACTED]");
    expect(out).not.toContain("123-45-6789");
  });

  it("supports mask replacement mode", () => {
    const out = scanner.redact("Email: user@example.com", { replacement: "mask" });
    expect(out).not.toContain("user@example.com");
    // Mask should start with 'u' and end with 'm'
    expect(out).toContain("u");
    expect(out).toMatch(/u\*+m/);
  });

  it("supports hash replacement mode", () => {
    const out = scanner.redact("Email: user@example.com", { replacement: "hash" });
    expect(out).toMatch(/\[EMAIL:[0-9a-f]{8}\]/);
  });

  it("handles text with no PII", () => {
    const text = "Hello, this is a normal message.";
    expect(scanner.redact(text)).toBe(text);
  });

  it("redacts multiple PII instances in one pass", () => {
    const text = "Email user@test.com and SSN 234-56-7890 and call 555-123-4567";
    const out = scanner.redact(text);
    expect(out).not.toContain("user@test.com");
    expect(out).not.toContain("234-56-7890");
    expect(out).toContain("[EMAIL REDACTED]");
    expect(out).toContain("[SSN REDACTED]");
  });
});

// ---------------------------------------------------------------------------
// containsPII
// ---------------------------------------------------------------------------

describe("containsPII", () => {
  it("returns true when PII is present", () => {
    expect(scanner.containsPII("Email: user@example.com")).toBe(true);
  });

  it("returns false for clean text", () => {
    expect(scanner.containsPII("Hello world, nothing personal here.")).toBe(false);
  });

  it("returns true for SSN", () => {
    expect(scanner.containsPII("SSN: 123-45-6789")).toBe(true);
  });

  it("returns true for credit card", () => {
    expect(scanner.containsPII("Card: 4111111111111111")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// False positive resistance
// ---------------------------------------------------------------------------

describe("false positive resistance", () => {
  it("does not flag version numbers as SSNs (e.g. 123-45-6 is too short)", () => {
    const result = scanner.scan("version 123-45-6");
    const ssn = result.matches.find((m) => m.type === "ssn");
    expect(ssn).toBeUndefined();
  });

  it("does not flag area code 000 as SSN", () => {
    const result = scanner.scan("000-12-3456");
    const ssn = result.matches.find((m) => m.type === "ssn");
    expect(ssn).toBeUndefined();
  });

  it("does not flag credit card numbers that fail Luhn", () => {
    // Changed last digit from valid
    const result = scanner.scan("4111111111111110");
    const cc = result.matches.find((m) => m.type === "credit_card");
    expect(cc).toBeUndefined();
  });

  it("does not flag private IPs as PII", () => {
    const privateIPs = ["10.0.0.1", "172.16.0.1", "192.168.1.1", "127.0.0.1"];
    for (const ip of privateIPs) {
      const result = scanner.scan(ip);
      const ipMatch = result.matches.find((m) => m.type === "ip_address");
      expect(ipMatch).toBeUndefined();
    }
  });

  it("does not flag short numeric sequences as phone numbers", () => {
    const result = scanner.scan("Error code: 12345");
    const phone = result.matches.find((m) => m.type === "phone");
    expect(phone).toBeUndefined();
  });

  it("does not flag ordinary words as passwords", () => {
    const result = scanner.scan("the password field is required");
    // "password field" does not match password=value pattern
    const pwd = result.matches.find((m) => m.type === "password");
    expect(pwd).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// PIIScanResult structure
// ---------------------------------------------------------------------------

describe("PIIScanResult structure", () => {
  it("returns correct summary counts", () => {
    const text = "Email user@test.com and SSN 234-56-7890";
    const result = scanner.scan(text);
    expect(result.summary.email).toBe(1);
    expect(result.summary.ssn).toBe(1);
    expect(result.summary.phone).toBe(0);
    expect(result.summary.credit_card).toBe(0);
  });

  it("returns sorted matches by position", () => {
    const text = "SSN 234-56-7890 and email user@test.com";
    const result = scanner.scan(text);
    for (let i = 1; i < result.matches.length; i++) {
      expect(result.matches[i].startIndex).toBeGreaterThanOrEqual(result.matches[i - 1].startIndex);
    }
  });

  it("includes startIndex and endIndex that correctly slice the value", () => {
    const text = "Email: user@example.com is here";
    const result = scanner.scan(text);
    const email = result.matches.find((m) => m.type === "email");
    expect(email).toBeDefined();
    expect(text.slice(email!.startIndex, email!.endIndex)).toBe(email!.value);
  });
});

// ---------------------------------------------------------------------------
// Performance
// ---------------------------------------------------------------------------

describe("performance", () => {
  it("scans 10KB of text in under 10ms", () => {
    // Generate a 10KB block of mixed content
    const lines: string[] = [];
    const sampleLines = [
      "The quick brown fox jumps over the lazy dog.",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "Error code: 42, status: OK, retries: 3",
      "Server response time was 250ms on port 8080",
      "Configuration loaded from /etc/app/config.yaml",
    ];
    while (lines.join("\n").length < 10_000) {
      lines.push(sampleLines[lines.length % sampleLines.length]);
    }
    const text = lines.join("\n");
    expect(text.length).toBeGreaterThanOrEqual(10_000);

    const start = performance.now();
    scanner.scan(text);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(10);
  });

  it("scans 10KB text containing PII in under 10ms", () => {
    const lines: string[] = [];
    const sampleLines = [
      "Contact user@example.com for help.",
      "Call 555-123-4567 for support.",
      "Card: 4111111111111111",
      "SSN: 123-45-6789",
      "Normal text without any PII data here.",
      "Another line of plain content for padding.",
    ];
    while (lines.join("\n").length < 10_000) {
      lines.push(sampleLines[lines.length % sampleLines.length]);
    }
    const text = lines.join("\n");
    expect(text.length).toBeGreaterThanOrEqual(10_000);

    const start = performance.now();
    const result = scanner.scan(text);
    const elapsed = performance.now() - start;

    expect(result.found).toBe(true);
    expect(elapsed).toBeLessThan(10);
  });
});
