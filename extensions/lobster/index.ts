import type {
  AnyAgentTool,
  SecureClawPluginApi,
  SecureClawPluginToolFactory,
} from "../../src/plugins/types.js";
import { createLobsterTool } from "./src/lobster-tool.js";

export default function register(api: SecureClawPluginApi) {
  api.registerTool(
    ((ctx) => {
      if (ctx.sandboxed) {
        return null;
      }
      return createLobsterTool(api) as AnyAgentTool;
    }) as SecureClawPluginToolFactory,
    { optional: true },
  );
}
