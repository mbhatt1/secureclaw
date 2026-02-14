import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveGatewayStateDir } from "./paths.js";

describe("resolveGatewayStateDir", () => {
  it("uses the default state dir when no overrides are set", () => {
    const env = { HOME: "/Users/test" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".secureclaw"));
  });

  it("appends the profile suffix when set", () => {
    const env = { HOME: "/Users/test", SECURECLAW_PROFILE: "rescue" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".secureclaw-rescue"));
  });

  it("treats default profiles as the base state dir", () => {
    const env = { HOME: "/Users/test", SECURECLAW_PROFILE: "Default" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".secureclaw"));
  });

  it("uses SECURECLAW_STATE_DIR when provided", () => {
    const env = { HOME: "/Users/test", SECURECLAW_STATE_DIR: "/var/lib/secureclaw" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/var/lib/secureclaw"));
  });

  it("expands ~ in SECURECLAW_STATE_DIR", () => {
    const env = { HOME: "/Users/test", SECURECLAW_STATE_DIR: "~/secureclaw-state" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/Users/test/secureclaw-state"));
  });

  it("preserves Windows absolute paths without HOME", () => {
    const env = { SECURECLAW_STATE_DIR: "C:\\State\\secureclaw" };
    expect(resolveGatewayStateDir(env)).toBe("C:\\State\\secureclaw");
  });
});
