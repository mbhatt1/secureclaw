// ---------------------------------------------------------------------------
// PII Scanner — detects and redacts personally identifiable information
// in agent outputs before they reach chat channels.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PIIType =
  | "email"
  | "phone"
  | "ssn"
  | "credit_card"
  | "ip_address"
  | "aws_key"
  | "api_key"
  | "password"
  | "address"
  | "date_of_birth";

export type PIIMatch = {
  type: PIIType;
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: "high" | "medium" | "low";
};

export type PIIScanResult = {
  found: boolean;
  matches: PIIMatch[];
  summary: Record<PIIType, number>;
};

export type RedactOptions = {
  /** Which PII types to redact (default: all). */
  types?: PIIType[];
  /** How to redact (default: 'type_label' which produces `[SSN REDACTED]`). */
  replacement?: "mask" | "type_label" | "hash";
};

// ---------------------------------------------------------------------------
// Luhn algorithm for credit card validation
// ---------------------------------------------------------------------------

/**
 * Validates a number string using the Luhn algorithm.
 * Returns `true` if the check digit is correct.
 */
export function luhnCheck(digits: string): boolean {
  const cleaned = digits.replace(/\D/g, "");
  if (cleaned.length === 0) {
    return false;
  }

  let sum = 0;
  let alternate = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let n = Number.parseInt(cleaned[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) {
        n -= 9;
      }
    }
    sum += n;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

type PIIPattern = {
  type: PIIType;
  regex: RegExp;
  confidence: "high" | "medium" | "low";
  /** Optional validator run after regex match; return false to reject. */
  validate?: (match: string) => boolean;
};

const PII_PATTERNS: PIIPattern[] = [
  // Email addresses
  {
    type: "email",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    confidence: "high",
  },

  // Phone numbers: US/international formats
  // Matches: (555) 123-4567, 555-123-4567, 555.123.4567, +1-555-123-4567,
  //          +44 20 7946 0958, 15551234567
  {
    type: "phone",
    regex: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    confidence: "medium",
    validate: (match: string) => {
      const digits = match.replace(/\D/g, "");
      // Must have 10 or 11 digits for US numbers
      return digits.length >= 10 && digits.length <= 11;
    },
  },

  // International phone numbers (country code + longer sequences)
  {
    type: "phone",
    regex: /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{0,4}\b/g,
    confidence: "medium",
    validate: (match: string) => {
      const digits = match.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    },
  },

  // SSN: XXX-XX-XXXX (with dashes)
  {
    type: "ssn",
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    confidence: "high",
    validate: (match: string) => {
      const parts = match.split("-");
      const area = Number.parseInt(parts[0], 10);
      const group = Number.parseInt(parts[1], 10);
      // SSN area cannot be 000, 666, or 900-999; group cannot be 00
      if (area === 0 || area === 666 || area >= 900) {
        return false;
      }
      if (group === 0) {
        return false;
      }
      return true;
    },
  },

  // SSN: without dashes (9 consecutive digits matching SSN structure)
  {
    type: "ssn",
    regex: /\b(\d{3})(\d{2})(\d{4})\b/g,
    confidence: "low",
    validate: (match: string) => {
      const digits = match.replace(/\D/g, "");
      if (digits.length !== 9) {
        return false;
      }
      const area = Number.parseInt(digits.slice(0, 3), 10);
      const group = Number.parseInt(digits.slice(3, 5), 10);
      if (area === 0 || area === 666 || area >= 900) {
        return false;
      }
      if (group === 0) {
        return false;
      }
      return true;
    },
  },

  // Credit card: Visa (starts with 4, 13 or 16 digits)
  {
    type: "credit_card",
    regex: /\b4\d{3}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{1,4}\b/g,
    confidence: "high",
    validate: (match: string) => luhnCheck(match),
  },

  // Credit card: Mastercard (starts with 51-55 or 2221-2720, 16 digits)
  {
    type: "credit_card",
    regex: /\b5[1-5]\d{2}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    confidence: "high",
    validate: (match: string) => luhnCheck(match),
  },

  // Credit card: Amex (starts with 34 or 37, 15 digits)
  {
    type: "credit_card",
    regex: /\b3[47]\d{2}[-\s]?\d{6}[-\s]?\d{5}\b/g,
    confidence: "high",
    validate: (match: string) => luhnCheck(match),
  },

  // Credit card: Discover (starts with 6011, 6221-6272, 644-649, 65, 16 digits)
  {
    type: "credit_card",
    regex: /\b6(?:011|5\d{2}|4[4-9]\d)[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    confidence: "high",
    validate: (match: string) => luhnCheck(match),
  },

  // IP addresses: IPv4 (excluding private/localhost ranges)
  {
    type: "ip_address",
    regex: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    confidence: "medium",
    validate: (match: string) => {
      // Exclude private/localhost ranges
      if (match.startsWith("10.")) {
        return false;
      }
      if (match.startsWith("127.")) {
        return false;
      }
      if (match.startsWith("0.")) {
        return false;
      }
      if (match === "255.255.255.255") {
        return false;
      }

      // 172.16.0.0 - 172.31.255.255
      if (match.startsWith("172.")) {
        const second = Number.parseInt(match.split(".")[1], 10);
        if (second >= 16 && second <= 31) {
          return false;
        }
      }

      // 192.168.x.x
      if (match.startsWith("192.168.")) {
        return false;
      }

      // 169.254.x.x (link-local)
      if (match.startsWith("169.254.")) {
        return false;
      }

      return true;
    },
  },

  // AWS access keys (AKIA prefix, exactly 20 uppercase alphanumeric chars)
  {
    type: "aws_key",
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
    confidence: "high",
  },

  // API keys / tokens: high-entropy strings (40+ alphanumeric chars)
  {
    type: "api_key",
    regex: /\b[A-Za-z0-9+/=_-]{40,}\b/g,
    confidence: "medium",
    validate: (match: string) => {
      // Must contain a mix of character classes to look like a token
      const hasUpper = /[A-Z]/.test(match);
      const hasLower = /[a-z]/.test(match);
      const hasDigit = /\d/.test(match);
      // At least two different character classes for entropy
      const classCount = [hasUpper, hasLower, hasDigit].filter(Boolean).length;
      if (classCount < 2) {
        return false;
      }

      // Reject common English words / paths that happen to be long
      if (/^[a-z]+$/i.test(match)) {
        return false;
      }

      return true;
    },
  },

  // Passwords in plaintext: password= or passwd= assignments
  {
    type: "password",
    regex: /(?:password|passwd|pwd)\s*[=:]\s*["']?[^\s"']{3,}["']?/gi,
    confidence: "high",
  },

  // US mailing addresses (basic street address patterns)
  {
    type: "address",
    regex:
      /\b\d{1,5}\s+(?:[A-Z][a-z]+\s*){1,4}(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Lane|Ln|Road|Rd|Court|Ct|Place|Pl|Way|Circle|Cir|Trail|Trl)\b\.?(?:\s*(?:#|Apt|Suite|Ste|Unit)\s*\d+)?/gi,
    confidence: "low",
  },

  // Date of birth patterns
  {
    type: "date_of_birth",
    regex:
      /(?:DOB|date\s+of\s+birth|birth\s*date)\s*[:\s]+\s*(?:\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2})/gi,
    confidence: "high",
  },
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const ALL_PII_TYPES: PIIType[] = [
  "email",
  "phone",
  "ssn",
  "credit_card",
  "ip_address",
  "aws_key",
  "api_key",
  "password",
  "address",
  "date_of_birth",
];

function emptySummary(): Record<PIIType, number> {
  const summary: Record<string, number> = {};
  for (const t of ALL_PII_TYPES) {
    summary[t] = 0;
  }
  return summary as Record<PIIType, number>;
}

/** Simple FNV-1a-like hash producing a fixed-length hex string. */
function simpleHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Produce a type-label like `[SSN REDACTED]`. */
function typeLabel(piiType: PIIType): string {
  return `[${piiType.toUpperCase()} REDACTED]`;
}

/** Produce a masked version: first and last char visible, rest replaced. */
function maskValue(value: string): string {
  if (value.length <= 2) {
    return "*".repeat(value.length);
  }
  return `${value[0]}${"*".repeat(value.length - 2)}${value[value.length - 1]}`;
}

// ---------------------------------------------------------------------------
// PIIScanner class
// ---------------------------------------------------------------------------

export class PIIScanner {
  // -----------------------------------------------------------------------
  // scan
  // -----------------------------------------------------------------------

  /**
   * Scans `text` for all PII instances and returns a structured result
   * with match details and per-type counts.
   */
  scan(text: string): PIIScanResult {
    const matches: PIIMatch[] = [];
    const seen = new Set<string>();

    for (const pattern of PII_PATTERNS) {
      // Reset lastIndex for global regexes
      pattern.regex.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = pattern.regex.exec(text)) !== null) {
        const value = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + value.length;

        // De-duplicate overlapping matches at the same position
        const key = `${pattern.type}:${startIndex}:${endIndex}`;
        if (seen.has(key)) {
          continue;
        }

        // Run optional validator
        if (pattern.validate && !pattern.validate(value)) {
          continue;
        }

        seen.add(key);
        matches.push({
          type: pattern.type,
          value,
          startIndex,
          endIndex,
          confidence: pattern.confidence,
        });
      }
    }

    // Sort by position
    matches.sort((a, b) => a.startIndex - b.startIndex);

    // Build summary
    const summary = emptySummary();
    for (const m of matches) {
      summary[m.type]++;
    }

    return {
      found: matches.length > 0,
      matches,
      summary,
    };
  }

  // -----------------------------------------------------------------------
  // redact
  // -----------------------------------------------------------------------

  /**
   * Returns a copy of `text` with detected PII replaced by redaction
   * markers.
   */
  redact(text: string, options?: RedactOptions): string {
    const result = this.scan(text);

    if (!result.found) {
      return text;
    }

    const types = options?.types ? new Set(options.types) : null;
    const mode = options?.replacement ?? "type_label";

    // Filter to requested types
    const toRedact = types ? result.matches.filter((m) => types.has(m.type)) : result.matches;

    if (toRedact.length === 0) {
      return text;
    }

    // De-overlap: keep only the longest match when ranges overlap.
    // Sort by startIndex ascending, then by length descending.
    const deduped = [...toRedact].toSorted((a, b) =>
      a.startIndex !== b.startIndex
        ? a.startIndex - b.startIndex
        : b.endIndex - b.startIndex - (a.endIndex - a.startIndex),
    );
    const nonOverlapping: PIIMatch[] = [];
    let lastEnd = -1;
    for (const m of deduped) {
      if (m.startIndex < lastEnd) {
        continue; // overlaps with a previously accepted match
      }
      nonOverlapping.push(m);
      lastEnd = m.endIndex;
    }

    // Build the redacted string by replacing matches from end to start
    // to preserve indices.
    const sorted = [...nonOverlapping].toSorted((a, b) => b.startIndex - a.startIndex);

    let output = text;
    for (const m of sorted) {
      let replacement: string;
      switch (mode) {
        case "type_label":
          replacement = typeLabel(m.type);
          break;
        case "mask":
          replacement = maskValue(m.value);
          break;
        case "hash":
          replacement = `[${m.type.toUpperCase()}:${simpleHash(m.value)}]`;
          break;
      }
      output = output.slice(0, m.startIndex) + replacement + output.slice(m.endIndex);
    }

    return output;
  }

  // -----------------------------------------------------------------------
  // containsPII
  // -----------------------------------------------------------------------

  /**
   * Quick boolean check: does `text` contain any PII?
   *
   * Slightly more efficient than `scan()` because it returns as soon as
   * the first match is found.
   */
  containsPII(text: string): boolean {
    for (const pattern of PII_PATTERNS) {
      pattern.regex.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = pattern.regex.exec(text)) !== null) {
        if (pattern.validate && !pattern.validate(match[0])) {
          continue;
        }
        return true;
      }
    }
    return false;
  }
}
