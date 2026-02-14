import { tryParseInt } from "../utils/safe-parse.js";

export function parseTimeoutMs(raw: unknown): number | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  let value: number | undefined;
  if (typeof raw === "number") {
    value = Number.isFinite(raw) ? raw : undefined;
  } else if (typeof raw === "bigint") {
    const num = Number(raw);
    value = Number.isFinite(num) ? num : undefined;
  } else if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) {
      return undefined;
    }
    value = tryParseInt(trimmed, 10);
  }
  return value;
}
