import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "secureclaw",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "secureclaw", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "secureclaw", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "secureclaw", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "secureclaw", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "secureclaw", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "secureclaw", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it("rejects combining --dev with --profile (dev first)", () => {
    const res = parseCliProfileArgs(["node", "secureclaw", "--dev", "--profile", "work", "status"]);
    expect(res.ok).toBe(false);
  });

  it("rejects combining --dev with --profile (profile first)", () => {
    const res = parseCliProfileArgs(["node", "secureclaw", "--profile", "work", "--dev", "status"]);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".secureclaw-dev");
    expect(env.SECURECLAW_PROFILE).toBe("dev");
    expect(env.SECURECLAW_STATE_DIR).toBe(expectedStateDir);
    expect(env.SECURECLAW_CONFIG_PATH).toBe(path.join(expectedStateDir, "secureclaw.json"));
    expect(env.SECURECLAW_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      SECURECLAW_STATE_DIR: "/custom",
      SECURECLAW_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.SECURECLAW_STATE_DIR).toBe("/custom");
    expect(env.SECURECLAW_GATEWAY_PORT).toBe("19099");
    expect(env.SECURECLAW_CONFIG_PATH).toBe(path.join("/custom", "secureclaw.json"));
  });

  it("uses SECURECLAW_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      SECURECLAW_HOME: "/srv/secureclaw-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/secureclaw-home");
    expect(env.SECURECLAW_STATE_DIR).toBe(path.join(resolvedHome, ".secureclaw-work"));
    expect(env.SECURECLAW_CONFIG_PATH).toBe(
      path.join(resolvedHome, ".secureclaw-work", "secureclaw.json"),
    );
  });
});

describe("formatCliCommand", () => {
  it("returns command unchanged when no profile is set", () => {
    expect(formatCliCommand("secureclaw doctor --fix", {})).toBe("secureclaw doctor --fix");
  });

  it("returns command unchanged when profile is default", () => {
    expect(formatCliCommand("secureclaw doctor --fix", { SECURECLAW_PROFILE: "default" })).toBe(
      "secureclaw doctor --fix",
    );
  });

  it("returns command unchanged when profile is Default (case-insensitive)", () => {
    expect(formatCliCommand("secureclaw doctor --fix", { SECURECLAW_PROFILE: "Default" })).toBe(
      "secureclaw doctor --fix",
    );
  });

  it("returns command unchanged when profile is invalid", () => {
    expect(formatCliCommand("secureclaw doctor --fix", { SECURECLAW_PROFILE: "bad profile" })).toBe(
      "secureclaw doctor --fix",
    );
  });

  it("returns command unchanged when --profile is already present", () => {
    expect(
      formatCliCommand("secureclaw --profile work doctor --fix", { SECURECLAW_PROFILE: "work" }),
    ).toBe("secureclaw --profile work doctor --fix");
  });

  it("returns command unchanged when --dev is already present", () => {
    expect(formatCliCommand("secureclaw --dev doctor", { SECURECLAW_PROFILE: "dev" })).toBe(
      "secureclaw --dev doctor",
    );
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("secureclaw doctor --fix", { SECURECLAW_PROFILE: "work" })).toBe(
      "secureclaw --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(
      formatCliCommand("secureclaw doctor --fix", { SECURECLAW_PROFILE: "  jbsecureclaw  " }),
    ).toBe("secureclaw --profile jbsecureclaw doctor --fix");
  });

  it("handles command with no args after secureclaw", () => {
    expect(formatCliCommand("secureclaw", { SECURECLAW_PROFILE: "test" })).toBe(
      "secureclaw --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm secureclaw doctor", { SECURECLAW_PROFILE: "work" })).toBe(
      "pnpm secureclaw --profile work doctor",
    );
  });
});
