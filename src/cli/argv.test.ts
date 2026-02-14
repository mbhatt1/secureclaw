import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it("detects help/version flags", () => {
    expect(hasHelpOrVersion(["node", "secureclaw", "--help"])).toBe(true);
    expect(hasHelpOrVersion(["node", "secureclaw", "-V"])).toBe(true);
    expect(hasHelpOrVersion(["node", "secureclaw", "status"])).toBe(false);
  });

  it("extracts command path ignoring flags and terminator", () => {
    expect(getCommandPath(["node", "secureclaw", "status", "--json"], 2)).toEqual(["status"]);
    expect(getCommandPath(["node", "secureclaw", "agents", "list"], 2)).toEqual(["agents", "list"]);
    expect(getCommandPath(["node", "secureclaw", "status", "--", "ignored"], 2)).toEqual([
      "status",
    ]);
  });

  it("returns primary command", () => {
    expect(getPrimaryCommand(["node", "secureclaw", "agents", "list"])).toBe("agents");
    expect(getPrimaryCommand(["node", "secureclaw"])).toBeNull();
  });

  it("parses boolean flags and ignores terminator", () => {
    expect(hasFlag(["node", "secureclaw", "status", "--json"], "--json")).toBe(true);
    expect(hasFlag(["node", "secureclaw", "--", "--json"], "--json")).toBe(false);
  });

  it("extracts flag values with equals and missing values", () => {
    expect(getFlagValue(["node", "secureclaw", "status", "--timeout", "5000"], "--timeout")).toBe(
      "5000",
    );
    expect(getFlagValue(["node", "secureclaw", "status", "--timeout=2500"], "--timeout")).toBe(
      "2500",
    );
    expect(getFlagValue(["node", "secureclaw", "status", "--timeout"], "--timeout")).toBeNull();
    expect(getFlagValue(["node", "secureclaw", "status", "--timeout", "--json"], "--timeout")).toBe(
      null,
    );
    expect(getFlagValue(["node", "secureclaw", "--", "--timeout=99"], "--timeout")).toBeUndefined();
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "secureclaw", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "secureclaw", "status", "--debug"])).toBe(false);
    expect(
      getVerboseFlag(["node", "secureclaw", "status", "--debug"], { includeDebug: true }),
    ).toBe(true);
  });

  it("parses positive integer flag values", () => {
    expect(getPositiveIntFlagValue(["node", "secureclaw", "status"], "--timeout")).toBeUndefined();
    expect(
      getPositiveIntFlagValue(["node", "secureclaw", "status", "--timeout"], "--timeout"),
    ).toBeNull();
    expect(
      getPositiveIntFlagValue(["node", "secureclaw", "status", "--timeout", "5000"], "--timeout"),
    ).toBe(5000);
    expect(
      getPositiveIntFlagValue(["node", "secureclaw", "status", "--timeout", "nope"], "--timeout"),
    ).toBeUndefined();
  });

  it("builds parse argv from raw args", () => {
    const nodeArgv = buildParseArgv({
      programName: "secureclaw",
      rawArgs: ["node", "secureclaw", "status"],
    });
    expect(nodeArgv).toEqual(["node", "secureclaw", "status"]);

    const versionedNodeArgv = buildParseArgv({
      programName: "secureclaw",
      rawArgs: ["node-22", "secureclaw", "status"],
    });
    expect(versionedNodeArgv).toEqual(["node-22", "secureclaw", "status"]);

    const versionedNodeWindowsArgv = buildParseArgv({
      programName: "secureclaw",
      rawArgs: ["node-22.2.0.exe", "secureclaw", "status"],
    });
    expect(versionedNodeWindowsArgv).toEqual(["node-22.2.0.exe", "secureclaw", "status"]);

    const versionedNodePatchlessArgv = buildParseArgv({
      programName: "secureclaw",
      rawArgs: ["node-22.2", "secureclaw", "status"],
    });
    expect(versionedNodePatchlessArgv).toEqual(["node-22.2", "secureclaw", "status"]);

    const versionedNodeWindowsPatchlessArgv = buildParseArgv({
      programName: "secureclaw",
      rawArgs: ["node-22.2.exe", "secureclaw", "status"],
    });
    expect(versionedNodeWindowsPatchlessArgv).toEqual(["node-22.2.exe", "secureclaw", "status"]);

    const versionedNodeWithPathArgv = buildParseArgv({
      programName: "secureclaw",
      rawArgs: ["/usr/bin/node-22.2.0", "secureclaw", "status"],
    });
    expect(versionedNodeWithPathArgv).toEqual(["/usr/bin/node-22.2.0", "secureclaw", "status"]);

    const nodejsArgv = buildParseArgv({
      programName: "secureclaw",
      rawArgs: ["nodejs", "secureclaw", "status"],
    });
    expect(nodejsArgv).toEqual(["nodejs", "secureclaw", "status"]);

    const nonVersionedNodeArgv = buildParseArgv({
      programName: "secureclaw",
      rawArgs: ["node-dev", "secureclaw", "status"],
    });
    expect(nonVersionedNodeArgv).toEqual([
      "node",
      "secureclaw",
      "node-dev",
      "secureclaw",
      "status",
    ]);

    const directArgv = buildParseArgv({
      programName: "secureclaw",
      rawArgs: ["secureclaw", "status"],
    });
    expect(directArgv).toEqual(["node", "secureclaw", "status"]);

    const bunArgv = buildParseArgv({
      programName: "secureclaw",
      rawArgs: ["bun", "src/entry.ts", "status"],
    });
    expect(bunArgv).toEqual(["bun", "src/entry.ts", "status"]);
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "secureclaw",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "secureclaw", "status"]);
  });

  it("decides when to migrate state", () => {
    expect(shouldMigrateState(["node", "secureclaw", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "secureclaw", "health"])).toBe(false);
    expect(shouldMigrateState(["node", "secureclaw", "sessions"])).toBe(false);
    expect(shouldMigrateState(["node", "secureclaw", "memory", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "secureclaw", "agent", "--message", "hi"])).toBe(false);
    expect(shouldMigrateState(["node", "secureclaw", "agents", "list"])).toBe(true);
    expect(shouldMigrateState(["node", "secureclaw", "message", "send"])).toBe(true);
  });

  it("reuses command path for migrate state decisions", () => {
    expect(shouldMigrateStateFromPath(["status"])).toBe(false);
    expect(shouldMigrateStateFromPath(["agents", "list"])).toBe(true);
  });
});
