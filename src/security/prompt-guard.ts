/**
 * Prompt injection guard that sits at the LLM boundary.
 *
 * Unlike the detection-only patterns in `external-content.ts`, this module
 * actively BLOCKS or SANITIZES prompt injection attempts before they reach
 * the model. All detection is regex-based for sub-millisecond performance.
 *
 * @example
 * ```ts
 * const guard = new PromptGuard();
 *
 * // Block mode (default) - throws on critical threats
 * const clean = guard.enforce(userInput);
 *
 * // Sanitize mode - strips injections, returns rest
 * const sanitized = guard.enforce(userInput, { mode: "sanitize" });
 *
 * // Warn mode - logs but never blocks
 * const result = guard.scan(userInput);
 * if (!result.safe) console.warn("Threats detected:", result.threats);
 * ```
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThreatSeverity = "critical" | "high" | "medium" | "low";

export type ThreatCategory =
  | "goal_hijacking"
  | "instruction_injection"
  | "jailbreaking"
  | "data_exfiltration"
  | "encoding_evasion";

export interface Threat {
  pattern: string;
  category: ThreatCategory;
  severity: ThreatSeverity;
  matchedText: string;
}

export interface PromptGuardResult {
  safe: boolean;
  threats: Threat[];
  riskScore: number;
}

export interface EnforceOptions {
  /** How to handle detected threats. Default: `"block"`. */
  mode?: "block" | "sanitize" | "warn";
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class PromptInjectionError extends Error {
  public readonly threats: Threat[];
  public readonly riskScore: number;

  constructor(result: PromptGuardResult) {
    const categories = [...new Set(result.threats.map((t) => t.category))];
    super(
      `Prompt injection blocked: ${categories.join(", ")} ` +
        `(risk score ${result.riskScore}/100)`,
    );
    this.name = "PromptInjectionError";
    this.threats = result.threats;
    this.riskScore = result.riskScore;
  }
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

interface PatternDef {
  regex: RegExp;
  label: string;
  category: ThreatCategory;
  severity: ThreatSeverity;
}

/**
 * Severity weights used to compute the aggregate risk score (0-100).
 */
const SEVERITY_WEIGHT: Record<ThreatSeverity, number> = {
  critical: 40,
  high: 25,
  medium: 15,
  low: 5,
};

/**
 * Default severity-to-action mapping used by `enforce()` in `"block"` mode.
 * - critical / high  -> block (throw)
 * - medium           -> sanitize (strip matched text)
 * - low              -> warn only
 */
const BLOCK_THRESHOLD: ThreatSeverity = "high";

const PATTERNS: PatternDef[] = [
  // ── Goal hijacking ──────────────────────────────────────────────────
  {
    regex:
      /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|context)/i,
    label: "ignore previous instructions",
    category: "goal_hijacking",
    severity: "critical",
  },
  {
    regex:
      /disregard\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|context)/i,
    label: "disregard instructions",
    category: "goal_hijacking",
    severity: "critical",
  },
  {
    regex:
      /forget\s+(everything|all\s+your|all|your)\s+(instructions?|rules?|guidelines?|training|programming)/i,
    label: "forget instructions",
    category: "goal_hijacking",
    severity: "critical",
  },
  {
    regex: /you\s+are\s+now\s+(a|an)\s+/i,
    label: "role reassignment",
    category: "goal_hijacking",
    severity: "critical",
  },
  {
    regex: /new\s+system\s+prompt\s*[:=]/i,
    label: "new system prompt",
    category: "goal_hijacking",
    severity: "critical",
  },
  {
    regex: /override\s+your\s+(rules?|instructions?|guidelines?|programming)/i,
    label: "override rules",
    category: "goal_hijacking",
    severity: "critical",
  },
  {
    regex: /from\s+now\s+on[\s,]+(you\s+)?(will|must|should|are)\b/i,
    label: "from now on directive",
    category: "goal_hijacking",
    severity: "high",
  },

  // ── Instruction injection (role delimiters) ─────────────────────────
  {
    regex: /```system\b/i,
    label: "fenced system block",
    category: "instruction_injection",
    severity: "critical",
  },
  {
    regex: /\[INST\]/i,
    label: "Llama INST delimiter",
    category: "instruction_injection",
    severity: "critical",
  },
  {
    regex: /<\|im_start\|>\s*system/i,
    label: "ChatML system delimiter",
    category: "instruction_injection",
    severity: "critical",
  },
  {
    regex: /<\|im_end\|>/i,
    label: "ChatML end delimiter",
    category: "instruction_injection",
    severity: "high",
  },
  {
    regex: /<\/?system>/i,
    label: "XML system tags",
    category: "instruction_injection",
    severity: "critical",
  },
  {
    regex: /\]\s*\n?\s*\[?(system|assistant)\]?\s*:/i,
    label: "role delimiter injection",
    category: "instruction_injection",
    severity: "high",
  },
  {
    regex: /###\s*(system|instruction|assistant)\s*(message|prompt)?/i,
    label: "markdown role header",
    category: "instruction_injection",
    severity: "high",
  },

  // ── Jailbreaking ────────────────────────────────────────────────────
  {
    regex: /\bDAN\s+mode\b/i,
    label: "DAN mode jailbreak",
    category: "jailbreaking",
    severity: "medium",
  },
  {
    regex: /\bdeveloper\s+mode\b/i,
    label: "developer mode jailbreak",
    category: "jailbreaking",
    severity: "medium",
  },
  {
    regex: /pretend\s+(you\s+)?(can|are\s+able\s+to|have\s+no)\b/i,
    label: "pretend capability",
    category: "jailbreaking",
    severity: "medium",
  },
  {
    regex: /\bhypothetically\b.*\b(if\s+you\s+(could|were|had)|what\s+would)\b/i,
    label: "hypothetical bypass",
    category: "jailbreaking",
    severity: "low",
  },
  {
    regex: /\bjailbreak(ed|ing)?\b/i,
    label: "explicit jailbreak mention",
    category: "jailbreaking",
    severity: "medium",
  },
  {
    regex:
      /act\s+as\s+(if\s+)?(you\s+)?(have\s+)?no\s+(restrictions?|limitations?|filters?|safety)/i,
    label: "act without restrictions",
    category: "jailbreaking",
    severity: "medium",
  },

  // ── Data exfiltration ───────────────────────────────────────────────
  {
    regex: /repeat\s+(everything|all|the\s+text)\s+(above|before|prior)/i,
    label: "repeat system prompt",
    category: "data_exfiltration",
    severity: "high",
  },
  {
    regex: /show\s+me\s+your\s+(system\s+)?(prompt|instructions?|rules?|guidelines?)/i,
    label: "show system prompt",
    category: "data_exfiltration",
    severity: "high",
  },
  {
    regex: /what\s+are\s+your\s+(instructions?|rules?|guidelines?|system\s+prompt)/i,
    label: "ask for instructions",
    category: "data_exfiltration",
    severity: "medium",
  },
  {
    regex:
      /output\s+(your|the)\s+(initial|original|full|complete)\s+(prompt|instructions?|message)/i,
    label: "output initial prompt",
    category: "data_exfiltration",
    severity: "high",
  },
  {
    regex: /print\s+(your|the)\s+(system|initial|original)\s+(prompt|message|instructions?)/i,
    label: "print system prompt",
    category: "data_exfiltration",
    severity: "high",
  },
];

// ---------------------------------------------------------------------------
// Pre-processing helpers
// ---------------------------------------------------------------------------

/**
 * Zero-width characters commonly used to evade detection.
 * Includes: zero-width space, zero-width non-joiner, zero-width joiner,
 * left-to-right mark, right-to-left mark, word joiner, zero-width no-break space.
 */
const ZERO_WIDTH_RE = /\u200B|\u200C|\u200D|\u200E|\u200F|\u2060|\uFEFF/g;

/**
 * Unicode fullwidth ASCII range (A-Z, a-z) and common homoglyphs.
 * These can be used to spell injection keywords in a way that evades
 * naive ASCII-only pattern matching.
 */
const FULLWIDTH_ASCII_OFFSET = 0xfee0;

function normalizeHomoglyphs(input: string): string {
  return input.replace(/[\uFF01-\uFF5E]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - FULLWIDTH_ASCII_OFFSET),
  );
}

/**
 * Strip zero-width characters that could be inserted between letters
 * to evade pattern matching (e.g. "i\u200Bgnore previous").
 */
function stripZeroWidth(input: string): string {
  return input.replace(ZERO_WIDTH_RE, "");
}

/**
 * Check whether a string contains a base64-encoded injection payload.
 * We look for base64 tokens of at least 20 chars and try to decode them.
 * Returns decoded strings that match known injection patterns.
 */
function detectBase64Payloads(input: string): { decoded: string; encoded: string }[] {
  // Match base64 strings of reasonable length (20+ chars).
  const base64Re = /(?<![A-Za-z0-9+/])([A-Za-z0-9+/]{20,}={0,2})(?![A-Za-z0-9+/])/g;
  const hits: { decoded: string; encoded: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = base64Re.exec(input)) !== null) {
    try {
      const decoded = Buffer.from(match[1], "base64").toString("utf-8");
      // Only keep decodings that look like readable text (mostly printable ASCII)
      const printableRatio = decoded.replace(/[^\x20-\x7E]/g, "").length / decoded.length;
      if (printableRatio > 0.8) {
        hits.push({ decoded, encoded: match[1] });
      }
    } catch {
      // Not valid base64 — skip
    }
  }
  return hits;
}

/**
 * Prepare input for scanning: strip zero-width chars, normalize
 * fullwidth/homoglyphs, producing a canonical form to match against.
 */
function canonicalize(input: string): string {
  return normalizeHomoglyphs(stripZeroWidth(input));
}

// ---------------------------------------------------------------------------
// PromptGuard class
// ---------------------------------------------------------------------------

export class PromptGuard {
  /**
   * Scan `input` for prompt injection threats.
   *
   * This is a pure detection method — it never throws or modifies the input.
   * All processing is regex-based and typically completes in <1 ms.
   */
  scan(input: string): PromptGuardResult {
    const threats: Threat[] = [];
    const normalized = canonicalize(input);

    // ── 1. Direct pattern matching against normalized input ──────────
    for (const def of PATTERNS) {
      const m = def.regex.exec(normalized);
      if (m) {
        threats.push({
          pattern: def.label,
          category: def.category,
          severity: def.severity,
          matchedText: m[0],
        });
      }
    }

    // ── 2. Check for zero-width character evasion in the original ────
    if (ZERO_WIDTH_RE.test(input)) {
      // Only flag if stripping zero-width chars reveals a threat
      // that was NOT already caught on the original text
      const rawThreats = this._matchPatterns(input);
      const normalizedThreats = this._matchPatterns(normalized);
      if (normalizedThreats.length > rawThreats.length) {
        threats.push({
          pattern: "zero-width character evasion",
          category: "encoding_evasion",
          severity: "high",
          matchedText: "[zero-width chars detected in input]",
        });
      }
    }

    // ── 3. Base64-encoded payload detection ──────────────────────────
    const b64Hits = detectBase64Payloads(input);
    for (const hit of b64Hits) {
      // Scan decoded payload against our pattern set
      const decodedNormalized = canonicalize(hit.decoded);
      for (const def of PATTERNS) {
        if (def.regex.test(decodedNormalized)) {
          threats.push({
            pattern: `base64-encoded ${def.label}`,
            category: "encoding_evasion",
            severity: "high",
            matchedText: hit.encoded,
          });
          // One base64 token can trigger at most one encoding_evasion entry
          break;
        }
      }
    }

    // ── Compute risk score ───────────────────────────────────────────
    const rawScore = threats.reduce((sum, t) => sum + SEVERITY_WEIGHT[t.severity], 0);
    const riskScore = Math.min(100, rawScore);

    return {
      safe: threats.length === 0,
      threats,
      riskScore,
    };
  }

  /**
   * Enforce prompt injection policy on `input`.
   *
   * - `"block"` (default): Throws `PromptInjectionError` if any threat is
   *   `critical` or `high`. Medium threats are sanitized (stripped).
   * - `"sanitize"`: Strips all matched injection text and returns the rest.
   *   Never throws.
   * - `"warn"`: Returns the input unchanged. Caller should inspect the
   *   return value and use the scan result via a separate `scan()` call.
   */
  enforce(input: string, options?: EnforceOptions): string {
    const mode = options?.mode ?? "block";
    const result = this.scan(input);

    if (result.safe) {
      return input;
    }

    if (mode === "warn") {
      return input;
    }

    if (mode === "block") {
      const shouldBlock = result.threats.some(
        (t) => t.severity === "critical" || t.severity === BLOCK_THRESHOLD,
      );
      if (shouldBlock) {
        throw new PromptInjectionError(result);
      }
      // Non-blocking threats: sanitize them out
      return this._sanitize(input, result);
    }

    // mode === "sanitize"
    return this._sanitize(input, result);
  }

  // ── Private helpers ───────────────────────────────────────────────

  /** Run PATTERNS against a string and return the list of labels that matched. */
  private _matchPatterns(text: string): string[] {
    const matched: string[] = [];
    for (const def of PATTERNS) {
      if (def.regex.test(text)) {
        matched.push(def.label);
      }
    }
    return matched;
  }

  /**
   * Remove matched threat text from the input.
   *
   * We operate on the canonical (normalized) form to locate spans, then
   * map back to the original string positions. For simplicity and safety
   * we strip by replacing the regex matches in the normalized form, then
   * rebuild from canonical.
   */
  private _sanitize(input: string, result: PromptGuardResult): string {
    let sanitized = canonicalize(input);
    for (const threat of result.threats) {
      if (threat.category === "encoding_evasion") {
        // For base64 payloads, remove the encoded token
        if (threat.matchedText !== "[zero-width chars detected in input]") {
          sanitized = sanitized.replace(threat.matchedText, "");
        }
        continue;
      }
      // Strip pattern matches from the text
      for (const def of PATTERNS) {
        if (def.label === threat.pattern) {
          sanitized = sanitized.replace(def.regex, "");
          break;
        }
      }
    }
    // Collapse any resulting double-spaces or leading/trailing whitespace on lines
    return sanitized
      .replace(/ {2,}/g, " ")
      .replace(/^\s+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
}
