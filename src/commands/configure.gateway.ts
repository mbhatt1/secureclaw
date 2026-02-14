import type { SecureClawConfig } from "../config/config.js";
import type { RuntimeEnv } from "../runtime.js";
import { resolveGatewayPort } from "../config/config.js";
import { findTailscaleBinary } from "../infra/tailscale.js";
import { note } from "../terminal/note.js";
import { parsePortSafe, parseIntSafe } from "../utils/safe-parse.js";
import { buildGatewayAuthConfig } from "./configure.gateway-auth.js";
import { confirm, select, text } from "./configure.shared.js";
import { guardCancel, normalizeGatewayTokenInput, randomToken } from "./onboard-helpers.js";

type GatewayAuthChoice = "token" | "password";

export async function promptGatewayConfig(
  cfg: SecureClawConfig,
  runtime: RuntimeEnv,
): Promise<{
  config: SecureClawConfig;
  port: number;
  token?: string;
}> {
  const portRaw = guardCancel(
    await text({
      message: "Gateway port",
      initialValue: String(resolveGatewayPort(cfg)),
      validate: (value) => {
        try {
          parsePortSafe(String(value));
          return undefined;
        } catch {
          return "Invalid port (must be 1-65535)";
        }
      },
    }),
    runtime,
  );
  const port = parsePortSafe(String(portRaw));

  let bind = guardCancel(
    await select({
      message: "Gateway bind mode",
      options: [
        {
          value: "loopback",
          label: "Loopback (Local only)",
          hint: "Bind to 127.0.0.1 - secure, local-only access",
        },
        {
          value: "tailnet",
          label: "Tailnet (Tailscale IP)",
          hint: "Bind to your Tailscale IP only (100.x.x.x)",
        },
        {
          value: "auto",
          label: "Auto (Loopback → LAN)",
          hint: "Prefer loopback; fall back to all interfaces if unavailable",
        },
        {
          value: "lan",
          label: "LAN (All interfaces)",
          hint: "Bind to 0.0.0.0 - accessible from anywhere on your network",
        },
        {
          value: "custom",
          label: "Custom IP",
          hint: "Specify a specific IP address, with 0.0.0.0 fallback if unavailable",
        },
      ],
    }),
    runtime,
  );

  let customBindHost: string | undefined;
  if (bind === "custom") {
    const input = guardCancel(
      await text({
        message: "Custom IP address",
        placeholder: "192.168.1.100",
        validate: (value) => {
          if (!value) {
            return "IP address is required for custom bind mode";
          }
          const trimmed = value.trim();
          const parts = trimmed.split(".");
          if (parts.length !== 4) {
            return "Invalid IPv4 address (e.g., 192.168.1.100)";
          }
          if (
            parts.every((part) => {
              try {
                const n = parseIntSafe(part, 10, 0, 255);
                return part === String(n);
              } catch {
                return false;
              }
            })
          ) {
            return undefined;
          }
          return "Invalid IPv4 address (each octet must be 0-255)";
        },
      }),
      runtime,
    );
    customBindHost = typeof input === "string" ? input : undefined;
  }

  let authMode = guardCancel(
    await select({
      message: "Gateway auth",
      options: [
        { value: "token", label: "Token", hint: "Recommended default" },
        { value: "password", label: "Password" },
      ],
      initialValue: "token",
    }),
    runtime,
  ) as GatewayAuthChoice;

  const tailscaleMode = guardCancel(
    await select({
      message: "Tailscale exposure",
      options: [
        { value: "off", label: "Off", hint: "No Tailscale exposure" },
        {
          value: "serve",
          label: "Serve",
          hint: "Private HTTPS for your tailnet (devices on Tailscale)",
        },
        {
          value: "funnel",
          label: "Funnel",
          hint: "Public HTTPS via Tailscale Funnel (internet)",
        },
      ],
    }),
    runtime,
  );

  // Detect Tailscale binary before proceeding with serve/funnel setup.
  if (tailscaleMode !== "off") {
    const tailscaleBin = await findTailscaleBinary();
    if (!tailscaleBin) {
      note(
        [
          "Tailscale binary not found in PATH or /Applications.",
          "Ensure Tailscale is installed from:",
          "  https://tailscale.com/download/mac",
          "",
          "You can continue setup, but serve/funnel will fail at runtime.",
        ].join("\n"),
        "Tailscale Warning",
      );
    }
  }

  let tailscaleResetOnExit = false;
  if (tailscaleMode !== "off") {
    note(
      [
        "Docs:",
        "https://docs.secureclaw.app/gateway/tailscale",
        "https://docs.secureclaw.app/web",
      ].join("\n"),
      "Tailscale",
    );
    tailscaleResetOnExit = Boolean(
      guardCancel(
        await confirm({
          message: "Reset Tailscale serve/funnel on exit?",
          initialValue: false,
        }),
        runtime,
      ),
    );
  }

  if (tailscaleMode !== "off" && bind !== "loopback") {
    note("Tailscale requires bind=loopback. Adjusting bind to loopback.", "Note");
    bind = "loopback";
  }

  if (tailscaleMode === "funnel" && authMode !== "password") {
    note("Tailscale funnel requires password auth.", "Note");
    authMode = "password";
  }

  let gatewayToken: string | undefined;
  let gatewayPassword: string | undefined;
  let next = cfg;

  if (authMode === "token") {
    const tokenInput = guardCancel(
      await text({
        message: "Gateway token (blank to generate)",
        initialValue: randomToken(),
      }),
      runtime,
    );
    gatewayToken = normalizeGatewayTokenInput(tokenInput) || randomToken();
  }

  if (authMode === "password") {
    const password = guardCancel(
      await text({
        message: "Gateway password",
        validate: (value) => (value?.trim() ? undefined : "Required"),
      }),
      runtime,
    );
    gatewayPassword = String(password ?? "").trim();
  }

  const authConfig = buildGatewayAuthConfig({
    existing: next.gateway?.auth,
    mode: authMode,
    token: gatewayToken,
    password: gatewayPassword,
  });

  next = {
    ...next,
    gateway: {
      ...next.gateway,
      mode: "local",
      port,
      bind,
      auth: authConfig,
      ...(customBindHost && { customBindHost }),
      tailscale: {
        ...next.gateway?.tailscale,
        mode: tailscaleMode,
        resetOnExit: tailscaleResetOnExit,
      },
    },
  };

  return { config: next, port, token: gatewayToken };
}
