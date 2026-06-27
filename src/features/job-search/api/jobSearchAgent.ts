import type { AIClientConfig, SearchProfile, JobOffer } from "@/shared/types";
import { chatCompletion } from "@/shared/api/aiClient";
import { generateId } from "@/shared/lib/utils";
import {
  normalizeModality,
  toStringArray,
  parseAIJsonResponse,
} from "@/shared/lib/aiJson";

interface SearchProgress {
  phase: string;
  detail?: string;
}

export async function searchJobs(
  config: AIClientConfig,
  profile: SearchProfile,
  onProgress?: (progress: SearchProgress) => void,
): Promise<JobOffer[]> {
  const notify = (p: SearchProgress) => onProgress?.(p);

  notify({ phase: "Building search query..." });

  const prompt = buildSearchPrompt(profile);

  notify({
    phase: "Asking AI to find job listings...",
    detail: `Using ${config.model}`,
  });

  const response = await chatCompletion(
    config,
    [{ role: "user", content: prompt }],
    {
      temperature: 0.3,
      max_tokens: 8000,
    },
  );

  if (!response.content || response.content.trim().length === 0) {
    throw new Error(
      "AI returned an empty response. Try again or use a different model.",
    );
  }

  notify({ phase: "Parsing results..." });

  const data = parseAIJsonResponse<{ jobs: unknown[] }>(response.content);
  const rawJobs = Array.isArray(data.jobs)
    ? data.jobs
    : Array.isArray(data)
      ? data
      : [];

  const jobs: JobOffer[] = rawJobs
    .filter(
      (j): j is Record<string, unknown> => typeof j === "object" && j !== null,
    )
    .map((j) => normalizeJobOffer(j));

  notify({ phase: `Found ${jobs.length} jobs` });

  return jobs;
}

function buildSearchPrompt(profile: SearchProfile): string {
  const parts: string[] = [
    "You are a job search assistant. Generate realistic job listings matching these criteria.",
    'Return ONLY valid JSON with a "jobs" array. No markdown, no explanations.',
    "",
    "Schema for each job:",
    `{ "title": "string", "company": "string", "location": "string", "modality": "Remote|Hybrid|On-site|Unknown", "url": "string — company career page URL or empty", "source_portal": "string", "posted_at": "ISO date string or null", "raw_description": "string — concise 50-100 word summary", "extracted_requirements": { "must_have": ["string"], "nice_to_have": ["string"], "technologies": ["string"], "years_experience": number|null, "seniority_level": "string|null", "languages": ["string"] }, "ats_keywords": ["string"] }`,
    "",
    "RULES:",
    "- Return exactly 5 job listings.",
    `- Jobs must be posted within the last 2 weeks (today: ${new Date().toISOString().slice(0, 10)}).`,
    "- Use real company names and realistic roles.",
    "- Keep raw_description to 50-100 words. Do NOT write 150+ word descriptions.",
    "- extracted_requirements: 3-5 must_have, 2-4 nice_to_have, 5-8 technologies.",
    "- ats_keywords: include 8-12 key terms.",
    "- Do NOT fabricate specific LinkedIn/InfoJobs URLs. Use company career pages or leave empty.",
    "- Return valid JSON only.",
    "",
    "SEARCH CRITERIA:",
  ];

  if (profile.job_titles.length > 0) {
    parts.push(`- Job titles: ${profile.job_titles.join(", ")}`);
  }
  if (profile.technologies.length > 0) {
    parts.push(`- Technologies: ${profile.technologies.join(", ")}`);
  }
  if (profile.location) {
    parts.push(`- Location: ${profile.location}`);
  }
  if (profile.modality !== "Any") {
    parts.push(`- Modality: ${profile.modality}`);
  }
  if (profile.seniority !== "Any") {
    parts.push(`- Seniority: ${profile.seniority}`);
  }
  if (profile.exclude_keywords.length > 0) {
    parts.push(`- Exclude: ${profile.exclude_keywords.join(", ")}`);
  }
  if (profile.extra_context) {
    parts.push(`- Additional: ${profile.extra_context}`);
  }

  return parts.join("\n");
}

function normalizeJobOffer(raw: Record<string, unknown>): JobOffer {
  const req = (raw.extracted_requirements as Record<string, unknown>) || {};

  return {
    id: generateId(),
    title: String(raw.title || "Unknown Title"),
    company: String(raw.company || "Unknown Company"),
    location: String(raw.location || "Unknown"),
    modality: normalizeModality(raw.modality),
    url: String(raw.url || ""),
    source_portal: String(raw.source_portal || "AI Generated"),
    posted_at: raw.posted_at ? String(raw.posted_at) : undefined,
    raw_description: String(raw.raw_description || ""),
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
    ats_keywords: toStringArray(raw.ats_keywords),
    status: "new",
  };
}
