import { describe, expect, it, vi } from "vitest";

// Mock the runtime guard so that importing ./index.js does not call process.exit
// when tests run on a Node version below the minimum (e.g. Node 20 in CI).
vi.mock("./infra/runtime-guard.js", () => ({
  assertSupportedRuntime: vi.fn(),
}));

const { assertWebChannel, normalizeE164, toWhatsappJid } = await import("./index.js");

describe("normalizeE164", () => {
  it("strips whatsapp prefix and whitespace", () => {
    expect(normalizeE164("whatsapp:+1 555 555 0123")).toBe("+15555550123");
  });

  it("adds plus when missing", () => {
    expect(normalizeE164("1555123")).toBe("+1555123");
  });
});

describe("toWhatsappJid", () => {
  it("converts E164 to jid", () => {
    expect(toWhatsappJid("+1 555 555 0123")).toBe("15555550123@s.whatsapp.net");
  });

  it("keeps group JIDs intact", () => {
    expect(toWhatsappJid("123456789-987654321@g.us")).toBe("123456789-987654321@g.us");
  });
});

describe("assertWebChannel", () => {
  it("accepts valid channels", () => {
    expect(() => assertWebChannel("web")).not.toThrow();
  });

  it("throws on invalid channel", () => {
    expect(() => assertWebChannel("invalid" as string)).toThrow();
  });
});
