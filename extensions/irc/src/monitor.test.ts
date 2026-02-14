import { describe, expect, it } from "vitest";
import { resolveIrcInboundTarget } from "./monitor.js";

describe("irc monitor inbound target", () => {
  it("keeps channel target for group messages", () => {
    expect(
      resolveIrcInboundTarget({
        target: "#secureclaw",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: true,
      target: "#secureclaw",
      rawTarget: "#secureclaw",
    });
  });

  it("maps DM target to sender nick and preserves raw target", () => {
    expect(
      resolveIrcInboundTarget({
        target: "secureclaw-bot",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: false,
      target: "alice",
      rawTarget: "secureclaw-bot",
    });
  });

  it("falls back to raw target when sender nick is empty", () => {
    expect(
      resolveIrcInboundTarget({
        target: "secureclaw-bot",
        senderNick: " ",
      }),
    ).toEqual({
      isGroup: false,
      target: "secureclaw-bot",
      rawTarget: "secureclaw-bot",
    });
  });
});
