import type { AIClientConfig, JobOffer } from "@/shared/types";
import { chatCompletion } from "@/shared/api/aiClient";
import { generateId } from "@/shared/lib/utils";
import {
  normalizeModality,
  toStringArray,
  parseAIJsonResponse,
} from "@/shared/lib/aiJson";

export async function parseJDText(
  config: AIClientConfig,
  rawText: string,
): Promise<JobOffer> {
  const prompt = `You are a recruitment specialist. Parse the following job description into a structured JSON object.

Return a single job object with this schema:
{
  "title": "string — job title",
  "company": "string — company name (infer from the JD if not explicit)",
  "location": "string — city, country or Remote",
  "modality": "Remote | Hybrid | On-site | Unknown",
  "url": "string — empty string if not available",
  "source_portal": "string — 'Manual Paste'",
  "posted_at": null,
  "raw_description": "string — the full original JD text",
  "extracted_requirements": {
    "must_have": ["string"],
    "nice_to_have": ["string"],
    "technologies": ["string"],
    "years_experience": number or null,
    "seniority_level": "string or null",
    "languages": ["string"]
  },
  "ats_keywords": ["string — critical ATS keywords"]
}

RULES:
- Extract requirements faithfully from the text.
- ats_keywords should include the most important terms an ATS would scan for.
- Return ONLY the JSON object, no markdown, no explanations.

JOB DESCRIPTION TEXT:
${rawText}`;

  const response = await chatCompletion(
    config,
    [{ role: "user", content: prompt }],
    {
      temperature: 0,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    },
  );

  if (!response.content || response.content.trim().length === 0) {
    throw new Error("AI returned an empty response.");
  }

  const parsed = parseAIJsonResponse(response.content);
  const req = (parsed.extracted_requirements as Record<string, unknown>) || {};

  return {
    id: generateId(),
    title: String(parsed.title || "Unknown Title"),
    company: String(parsed.company || "Unknown Company"),
    location: String(parsed.location || "Unknown"),
    modality: normalizeModality(parsed.modality),
    url: String(parsed.url || ""),
    source_portal: "Manual Paste",
    raw_description: String(parsed.raw_description || rawText),
    extracted_requirements: {
      must_have: toStringArray(req.must_have),
      nice_to_have: toStringArray(req.nice_to_have),
      technologies: toStringArray(req.technologies),
      years_experience:
        typeof req.years_experience === "number"
          ? req.years_experience
          : undefined,
      seniority_level: req.seniority_level
        ? String(req.seniority_level)
        : undefined,
      languages: toStringArray(req.languages),
    },
    ats_keywords: toStringArray(parsed.ats_keywords),
    status: "new",
  };
}
