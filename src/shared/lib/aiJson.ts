import type { JobOffer } from "@/shared/types";

export function normalizeModality(val: unknown): JobOffer["modality"] {
  const s = String(val || "").toLowerCase();
  if (s === "remote") return "Remote";
  if (s === "hybrid") return "Hybrid";
  if (s === "on-site" || s === "onsite") return "On-site";
  return "Unknown";
}

export function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  return [];
}

/**
 * Attempts to repair truncated or corrupted JSON from AI responses.
 * Handles: unclosed braces/brackets/strings, repeated token corruption,
 * trailing commas, and incomplete values.
 * Returns the repaired string (caller must JSON.parse).
 */
export function repairTruncatedJSON(str: string): string {
  // Remove repeated token corruption (e.g. ,"company","company","company"...)
  let cleaned = str.replace(/(,"[^"]{2,30}"){5,}/g, "");

  // Strip markdown fences if present
  cleaned = cleaned
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/s, "")
    .trim();

  // If it ends mid-string, close the string
  const openQuotes = (cleaned.match(/"/g) || []).length;
  if (openQuotes % 2 !== 0) {
    const lastQuote = cleaned.lastIndexOf('"');
    const afterLastQuote = cleaned.slice(lastQuote + 1).trim();
    if (!afterLastQuote || /^[,\s\]:}]*/.test(afterLastQuote)) {
      cleaned = cleaned.slice(0, lastQuote + 1);
    }
  }

  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
  // Remove trailing comma at end
  cleaned = cleaned.replace(/,\s*$/, "");
  // Fix incomplete values: "key": or "key": "val" (cut off)
  cleaned = cleaned.replace(/:\s*$/, ': ""');
  cleaned = cleaned.replace(/:\s*"$/, ': ""');

  // Count open braces and brackets
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escape = false;

  for (const ch of cleaned) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") braces++;
    if (ch === "}") braces--;
    if (ch === "[") brackets++;
    if (ch === "]") brackets--;
  }

  // Close remaining brackets/braces
  while (brackets > 0) {
    cleaned += "]";
    brackets--;
  }
  while (braces > 0) {
    cleaned += "}";
    braces--;
  }

  return cleaned;
}

/**
 * Parse AI JSON response with fallback repair.
 * Tries: direct parse → markdown extraction → repair → raw extraction → repair.
 */
export function parseAIJsonResponse<T = Record<string, unknown>>(
  content: string,
): T {
  // 1. Direct parse
  try {
    return JSON.parse(content) as T;
  } catch {
    /* continue */
  }

  // 2. Markdown code block extraction
  const mdMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (mdMatch) {
    try {
      return JSON.parse(mdMatch[1]) as T;
    } catch {
      /* continue */
    }
    try {
      return JSON.parse(repairTruncatedJSON(mdMatch[1])) as T;
    } catch {
      /* continue */
    }
  }

  // 3. Raw JSON extraction
  const jsonStart = content.indexOf("{");
  const jsonEnd = content.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    const slice = content.slice(jsonStart, jsonEnd + 1);
    try {
      return JSON.parse(slice) as T;
    } catch {
      /* continue */
    }
    try {
      return JSON.parse(repairTruncatedJSON(slice)) as T;
    } catch {
      /* continue */
    }
  }

  throw new Error(
    "Failed to parse AI response. The model may have hit a token limit.",
  );
}
