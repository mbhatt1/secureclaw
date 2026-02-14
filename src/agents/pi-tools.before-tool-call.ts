import type { AnyAgentTool } from "./tools/common.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { getGlobalHookRunner } from "../plugins/hook-runner-global.js";
import {
  getGlobalSecurityCoachHooks,
  isSecurityCoachInitialized,
} from "../security-coach/global.js";
import { isPlainObject } from "../utils.js";
import { normalizeToolName } from "./tool-policy.js";

type HookContext = {
  agentId?: string;
  sessionKey?: string;
};

type HookOutcome = { blocked: true; reason: string } | { blocked: false; params: unknown };

const log = createSubsystemLogger("agents/tools");

export async function runBeforeToolCallHook(args: {
  toolName: string;
  params: unknown;
  toolCallId?: string;
  ctx?: HookContext;
}): Promise<HookOutcome> {
  const toolName = normalizeToolName(args.toolName || "tool");
  const params = args.params;

  // --- Security Coach: evaluate tool call against threat patterns ----------
  // This runs before plugin hooks because it is a core security gate that
  // should not be overridden by third-party plugins.
  const coachHooks = getGlobalSecurityCoachHooks();

  // If security coach hasn't been initialized yet, fail closed
  if (!coachHooks && !isSecurityCoachInitialized()) {
    log.warn("security coach not yet initialized — blocking tool call as precaution");
    return { blocked: true, reason: "Security Coach: not yet initialized — tool blocked" };
  }

  if (coachHooks) {
    try {
      const normalizedParams = isPlainObject(params) ? params : {};
      const coachResult = await coachHooks.beforeToolCall({
        toolName,
        params: normalizedParams,
        agentId: args.ctx?.agentId,
        sessionKey: args.ctx?.sessionKey,
      });
      if (coachResult?.block) {
        return {
          blocked: true,
          reason: coachResult.blockReason || "Tool call blocked by Security Coach",
        };
      }
    } catch (err) {
      const toolCallId = args.toolCallId ? ` toolCallId=${args.toolCallId}` : "";
      log.warn(
        `security coach before_tool_call failed: tool=${toolName}${toolCallId} error=${String(err)}`,
      );
      return {
        blocked: true,
        reason: "Security Coach: internal error — tool blocked as precaution",
      };
    }
  }

  // --- Plugin hooks --------------------------------------------------------
  const hookRunner = getGlobalHookRunner();
  if (!hookRunner?.hasHooks("before_tool_call")) {
    return { blocked: false, params: args.params };
  }

  try {
    const normalizedParams = isPlainObject(params) ? params : {};
    const hookResult = await hookRunner.runBeforeToolCall(
      {
        toolName,
        params: normalizedParams,
      },
      {
        toolName,
        agentId: args.ctx?.agentId,
        sessionKey: args.ctx?.sessionKey,
      },
    );

    if (hookResult?.block) {
      return {
        blocked: true,
        reason: hookResult.blockReason || "Tool call blocked by plugin hook",
      };
    }

    if (hookResult?.params && isPlainObject(hookResult.params)) {
      const modifiedParams = isPlainObject(params)
        ? { ...params, ...hookResult.params }
        : hookResult.params;

      // Re-evaluate with security coach if params changed
      if (coachHooks && JSON.stringify(modifiedParams) !== JSON.stringify(params)) {
        try {
          const recheck = await coachHooks.beforeToolCall({
            toolName,
            params: modifiedParams,
            agentId: args.ctx?.agentId,
            sessionKey: args.ctx?.sessionKey,
          });
          if (recheck && recheck.block) {
            return {
              blocked: true,
              reason: recheck.blockReason ?? "Blocked by security coach (post-plugin recheck)",
            };
          }
        } catch {
          return {
            blocked: true,
            reason: "Security Coach: internal error on recheck — tool blocked",
          };
        }
      }

      return { blocked: false, params: modifiedParams };
    }
  } catch (err) {
    const toolCallId = args.toolCallId ? ` toolCallId=${args.toolCallId}` : "";
    log.warn(`before_tool_call hook failed: tool=${toolName}${toolCallId} error=${String(err)}`);
  }

  return { blocked: false, params };
}

export function wrapToolWithBeforeToolCallHook(
  tool: AnyAgentTool,
  ctx?: HookContext,
): AnyAgentTool {
  const execute = tool.execute;
  if (!execute) {
    return tool;
  }
  const toolName = tool.name || "tool";
  return {
    ...tool,
    execute: async (toolCallId, params, signal, onUpdate) => {
      const outcome = await runBeforeToolCallHook({
        toolName,
        params,
        toolCallId,
        ctx,
      });
      if (outcome.blocked) {
        throw new Error(outcome.reason);
      }
      return await execute(toolCallId, outcome.params, signal, onUpdate);
    },
  };
}

export const __testing = {
  runBeforeToolCallHook,
  isPlainObject,
};
