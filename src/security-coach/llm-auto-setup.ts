// ---------------------------------------------------------------------------
// LLM Judge Auto-Setup
// ---------------------------------------------------------------------------
// Automatically configures LLM client from saved API keys
// ---------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import type { SecurityCoachEngine } from "./engine.js";
import type { LLMClient } from "./llm-judge.js";
import { resolveStateDir } from "../config/paths.js";
import { AnthropicLLMClient } from "./llm-client-anthropic.js";

type Logger = {
  info?: (msg: string) => void;
  warn?: (msg: string) => void;
  error?: (msg: string) => void;
};

/**
 * Auto-configure LLM client from saved API keys or environment variables.
 *
 * This is called automatically during gateway startup to set up the LLM judge
 * without requiring manual configuration.
 */
export async function autoConfigureLLMJudge(
  engine: SecurityCoachEngine,
  log?: Logger,
): Promise<boolean> {
  const llmJudge = engine.getLLMJudge();

  if (!llmJudge) {
    // LLM judge not enabled in config
    return false;
  }

  try {
    // Try to load API key
    const client = await loadLLMClient(log);

    if (!client) {
      log?.warn?.(
        "LLM Judge is enabled but no API key found. Run: pnpm secureclaw setup-llm-judge",
      );
      return false;
    }

    // Set client
    llmJudge.setClient(client);

    log?.info?.("LLM Judge configured successfully with AI client");
    return true;
  } catch (err) {
    log?.error?.(`Failed to configure LLM Judge: ${String(err)}`);
    return false;
  }
}

/**
 * Load LLM client from saved API keys or environment variables.
 */
async function loadLLMClient(log?: Logger): Promise<LLMClient | null> {
  // Priority 1: Check environment variables
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (anthropicKey) {
    log?.info?.("Using Anthropic API key from ANTHROPIC_API_KEY environment variable");
    return new AnthropicLLMClient(anthropicKey);
  }

  if (openaiKey) {
    log?.info?.("Using OpenAI API key from OPENAI_API_KEY environment variable");
    return createOpenAIClient(openaiKey);
  }

  // Priority 2: Check saved API keys file
  const stateDir = resolveStateDir();
  const apiKeysPath = path.join(stateDir, "llm-api-keys.json");

  try {
    const data = fs.readFileSync(apiKeysPath, "utf-8");
    const apiKeys = JSON.parse(data);

    if (apiKeys.anthropic) {
      log?.info?.("Using Anthropic API key from saved configuration");
      return new AnthropicLLMClient(apiKeys.anthropic);
    }

    if (apiKeys.openai) {
      log?.info?.("Using OpenAI API key from saved configuration");
      return createOpenAIClient(apiKeys.openai);
    }
  } catch (err) {
    // File doesn't exist or is invalid
    const code =
      err && typeof err === "object" && "code" in err ? (err as { code: string }).code : undefined;
    if (code !== "ENOENT") {
      log?.warn?.(`Failed to load API keys from ${apiKeysPath}: ${String(err)}`);
    }
  }

  // No API key found
  return null;
}

/**
 * Create OpenAI client (simple implementation).
 */
function createOpenAIClient(apiKey: string): LLMClient {
  return {
    async chat(opts) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: opts.model,
          messages: opts.messages,
          max_tokens: opts.max_tokens ?? 1000,
          response_format: opts.response_format,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${error}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };

      return { content: data.choices[0]?.message.content ?? "" };
    },
  };
}
