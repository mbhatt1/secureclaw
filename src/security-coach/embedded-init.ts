/**
 * Security Coach Initialization for Embedded Mode
 *
 * Ensures Security Coach is initialized even when running without Gateway.
 * This prevents security bypasses in --local mode and fallback scenarios.
 */

import type { Logger } from "tslog";
import { SecurityCoachEngine } from "./engine.js";
import { setGlobalSecurityCoachHooks } from "./global.js";
import { autoConfigureLLMJudge } from "./llm-auto-setup.js";
import { SecurityCoachRuleStore } from "./rules.js";

let embeddedEngineInstance: SecurityCoachEngine | null = null;

/**
 * Initialize Security Coach for embedded agent execution.
 *
 * Creates a minimal but fully functional Security Coach instance with:
 * - Pattern-based threat detection (74 patterns)
 * - Optional LLM Judge (if configured)
 * - Global hooks registration
 * - Fail-closed behavior
 *
 * @param log - Optional logger for diagnostics
 * @returns The initialized Security Coach engine
 */
export async function initEmbeddedSecurityCoach(
  log?: Logger<unknown>,
): Promise<SecurityCoachEngine> {
  // Return existing instance if already initialized
  if (embeddedEngineInstance) {
    log?.debug?.("Security Coach already initialized for embedded mode");
    return embeddedEngineInstance;
  }

  log?.info?.("🛡️  Initializing Security Coach for embedded mode...");

  // Create rule store (loads threat patterns)
  const ruleStore = new SecurityCoachRuleStore();

  // Create Security Coach engine
  const engine = new SecurityCoachEngine(undefined, ruleStore);

  // Auto-configure LLM Judge if available
  await autoConfigureLLMJudge(engine, log);

  // Register global hooks (enables beforeToolCall protection)
  setGlobalSecurityCoachHooks({
    onInboundChannelMessage: async (input) => {
      const result = await engine.evaluate(input);
      // Map evaluate result to onInboundChannelMessage return type
      if (!result.allowed) {
        return {
          cancel: true,
          reason: result.alert?.title ?? "Security Coach: blocked by saved rule",
        };
      }
      return undefined;
    },
    beforeToolCall: async (input) => {
      const result = await engine.evaluate(input);
      // Map evaluate result to beforeToolCall return type
      if (!result.allowed) {
        return {
          block: true,
          blockReason: result.alert?.title ?? "Security Coach: blocked by saved rule",
        };
      }
      return undefined;
    },
    afterToolCall: async () => {
      // No-op for embedded mode
    },
    beforeMessageSending: async () => {
      // No-op for embedded mode
      return undefined;
    },
    onOutboundChannelMessage: async () => {
      // No-op for embedded mode
      return undefined;
    },
  });

  // Store instance for reuse
  embeddedEngineInstance = engine;

  log?.info?.("✅ Security Coach initialized successfully (embedded mode)");
  log?.info?.(`   - Patterns: ${ruleStore.getAllRules().length} threat patterns loaded`);

  const llmJudge = engine.getLLMJudge();
  if (llmJudge) {
    log?.info?.("   - LLM Judge: Enabled");
  } else {
    log?.info?.("   - LLM Judge: Disabled (pattern-only mode)");
  }

  return engine;
}

/**
 * Get the embedded Security Coach engine instance if initialized.
 * @returns The engine instance or null if not yet initialized
 */
export function getEmbeddedSecurityCoach(): SecurityCoachEngine | null {
  return embeddedEngineInstance;
}

/**
 * Check if Security Coach is initialized for embedded mode.
 * @returns True if initialized, false otherwise
 */
export function isEmbeddedSecurityCoachInitialized(): boolean {
  return embeddedEngineInstance !== null;
}

/**
 * Reset the embedded Security Coach instance (for testing).
 */
export function resetEmbeddedSecurityCoach(): void {
  embeddedEngineInstance = null;
}
