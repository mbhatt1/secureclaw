// ---------------------------------------------------------------------------
// LLM Judge — TypeScript Types & JSON Schemas
// ---------------------------------------------------------------------------

export type LLMJudgeSeverity = "critical" | "high" | "medium" | "low" | "info";

export type LLMJudgeCategory =
  | "data-exfiltration"
  | "privilege-escalation"
  | "destructive-operation"
  | "network-suspicious"
  | "credential-exposure"
  | "social-engineering"
  | "code-injection"
  | "persistence-mechanism"
  | "reconnaissance"
  | "cloud-misconfiguration"
  | "container-escape"
  | "supply-chain-attack";

export type LLMJudgeResult = {
  isThreat: boolean;
  confidence: number; // 0-100
  severity: LLMJudgeSeverity;
  category: LLMJudgeCategory;
  reasoning: string;
  recommendation: string;
  safeAlternative?: string;
  timestamp?: number; // For caching
};

export type LLMJudgeConfig = {
  enabled: boolean;
  /** Which model to use for evaluation */
  model: "claude-sonnet-4" | "claude-haiku-4" | "gpt-4o" | "gpt-4o-mini";
  /** Fall back to pattern-only if LLM fails */
  fallbackToPatterns: boolean;
  /** Enable response caching */
  cacheEnabled: boolean;
  /** Cache TTL in milliseconds (default: 1 hour) */
  cacheTTL: number;
  /** Maximum latency for LLM call in ms (default: 1000ms) */
  maxLatency: number;
  /** Minimum confidence to block (0-100) */
  confidenceThreshold: number;
  /** Use LLM for pattern confirmation (reduces false positives) */
  confirmPatternMatches: boolean;
  /** Only use LLM for these severity levels */
  useLLMForSeverity: LLMJudgeSeverity[];
  /** Maximum tokens for prompt + response */
  maxTokens: number;
};

export const DEFAULT_LLM_JUDGE_CONFIG: LLMJudgeConfig = {
  enabled: false, // Disabled by default (users must opt-in)
  model: "claude-haiku-4", // Fast & cheap
  fallbackToPatterns: true,
  cacheEnabled: true,
  cacheTTL: 3600_000, // 1 hour
  maxLatency: 1000, // 1 second
  confidenceThreshold: 75,
  confirmPatternMatches: true,
  useLLMForSeverity: ["medium", "low"], // Only for ambiguous cases
  maxTokens: 1000,
};

// JSON Schema for structured output (Anthropic/OpenAI format)
export const LLM_JUDGE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    isThreat: {
      type: "boolean",
      description: "Whether this command poses a security threat",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "Confidence level in the assessment (0-100)",
    },
    severity: {
      type: "string",
      enum: ["critical", "high", "medium", "low", "info"],
      description: "Severity level if threat detected",
    },
    category: {
      type: "string",
      enum: [
        "data-exfiltration",
        "privilege-escalation",
        "destructive-operation",
        "network-suspicious",
        "credential-exposure",
        "social-engineering",
        "code-injection",
        "persistence-mechanism",
        "reconnaissance",
        "cloud-misconfiguration",
        "container-escape",
        "supply-chain-attack",
      ],
      description: "Category of the threat",
    },
    reasoning: {
      type: "string",
      description: "Brief explanation of the assessment",
    },
    recommendation: {
      type: "string",
      description: "What the user should do instead",
    },
    safeAlternative: {
      type: "string",
      description: "A safer command to achieve the same goal",
    },
  },
  required: ["isThreat", "confidence", "severity", "category", "reasoning", "recommendation"],
} as const;
