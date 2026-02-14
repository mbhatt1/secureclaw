// ---------------------------------------------------------------------------
// LLM Client — Anthropic Implementation
// ---------------------------------------------------------------------------

import type { LLMClient } from "./llm-judge.js";

/**
 * Anthropic API client for LLM judge.
 * Uses the Messages API with structured output support.
 */
export class AnthropicLLMClient implements LLMClient {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL = "https://api.anthropic.com/v1") {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async chat(opts: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    max_tokens?: number;
    response_format?: unknown;
  }): Promise<{ content: string }> {
    const response = await fetch(`${this.baseURL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.mapModel(opts.model),
        messages: opts.messages,
        max_tokens: opts.max_tokens ?? 1000,
        // TODO: Add structured output support when Anthropic adds it
        // For now, we rely on prompting to get JSON
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
    };

    const textContent = data.content.find((c) => c.type === "text");
    if (!textContent) {
      throw new Error("No text content in Anthropic response");
    }

    return { content: textContent.text };
  }

  private mapModel(model: string): string {
    // Map generic names to Anthropic model IDs
    const modelMap: Record<string, string> = {
      "claude-sonnet-4": "claude-sonnet-4-5-20250929",
      "claude-haiku-4": "claude-haiku-4-5-20251001",
    };

    return modelMap[model] ?? model;
  }
}
