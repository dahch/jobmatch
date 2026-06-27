import type {
  ParsedCV,
  JobOffer,
  OptimizedCV,
  AIClientConfig,
} from "@/shared/types";
import { chatCompletion } from "@/shared/api/aiClient";
import { parseAIJsonResponse } from "@/shared/lib/aiJson";

export async function optimizeCV(
  config: AIClientConfig,
  parsedCV: ParsedCV,
  job: JobOffer,
  extraInstructions?: string,
): Promise<OptimizedCV> {
  const prompt = buildOptimizationPrompt(parsedCV, job, extraInstructions);

  const response = await chatCompletion(
    config,
    [{ role: "user", content: prompt }],
    {
      temperature: 0.2,
      max_tokens: 16000,
      response_format: { type: "json_object" },
    },
  );

  if (!response.content || response.content.trim().length === 0) {
    throw new Error("AI returned an empty response. Try again.");
  }

  const parsed = parseAIJsonResponse<Record<string, unknown>>(response.content);
  return normalizeOptimizedCV(parsed, job);
}

function buildOptimizationPrompt(
  cv: ParsedCV,
  job: JobOffer,
  extraInstructions?: string,
): string {
  const parts: string[] = [
    "You are an expert technical CV writer and ATS optimization specialist.",
    "",
    "TASK: Rewrite and optimize the candidate's CV to match the job description provided.",
    "",
    "ABSOLUTE RULES (non-negotiable):",
    "1. DO NOT invent work experience, technologies, projects, or achievements not in the original CV.",
    "2. DO NOT modify employment or education dates.",
    "3. DO NOT add technical skills the candidate hasn't mentioned.",
    "4. DO NOT change the candidate's name or identity.",
    "5. YOU MAY: reformulate experience bullets for greater impact, reorder sections by relevance, use exact keywords from the JD where truthfully applicable, expand or condense existing descriptions.",
    "6. The summary must be new, targeted to this specific position, but based only on what the candidate has.",
    "7. Maximize ATS keyword matching using exact terms where they truthfully apply.",
    "8. The output JSON must follow the OptimizedCV schema exactly.",
    "9. Include a 'changes_summary' array listing every change made vs the original CV.",
    "10. Include an 'ats_keywords_used' array listing which JD keywords were incorporated.",
    "",
    "OUTPUT SCHEMA:",
    JSON.stringify(
      {
        target_job: "string — job title from the JD",
        target_company: "string — company name from the JD",
        full_name: "string — same as original",
        contact: "{ email, phone, linkedin, github, portfolio, location }",
        summary: "string — new targeted summary (2-3 sentences)",
        work_experience:
          "[{ company, title, start_date, end_date, location, description, technologies, achievements }] — reordered by relevance, reformulated",
        skills: "[{ category, items }] — reordered by relevance to the JD",
        education:
          "[{ institution, degree, field, start_date, end_date }] — unchanged",
        languages: "[{ language, level }] — unchanged",
        certifications: "[{ name, issuer, date }] — unchanged if present",
        projects:
          "[{ name, description, technologies, url }] — selected by relevance if present",
        ats_keywords_used: "[string] — JD keywords incorporated",
        changes_summary: "[string] — list of changes made",
      },
      null,
      2,
    ),
    "",
    "ORIGINAL CV (structured):",
    JSON.stringify(
      {
        full_name: cv.full_name,
        contact: cv.contact,
        summary: cv.summary,
        work_experience: cv.work_experience,
        education: cv.education,
        skills: cv.skills,
        languages: cv.languages,
        certifications: cv.certifications,
        projects: cv.projects,
      },
      null,
      2,
    ),
    "",
    "JOB DESCRIPTION:",
    `Title: ${job.title}`,
    `Company: ${job.company}`,
    `Location: ${job.location}`,
    `Modality: ${job.modality}`,
    "",
    "Full JD:",
    job.raw_description,
    "",
    "Extracted Requirements:",
    JSON.stringify(job.extracted_requirements, null, 2),
    "",
    "ATS Keywords from JD:",
    job.ats_keywords.join(", "),
  ];

  if (extraInstructions) {
    parts.push("", "ADDITIONAL INSTRUCTIONS FROM USER:", extraInstructions);
  }

  parts.push("", "Return ONLY the JSON object. No markdown, no explanations.");

  return parts.join("\n");
}

function normalizeOptimizedCV(
  raw: Record<string, unknown>,
  job: JobOffer,
): OptimizedCV {
  return {
    target_job: String(raw.target_job || job.title),
    target_company: String(raw.target_company || job.company),
    full_name: String(raw.full_name || "Unknown"),
    contact: (raw.contact as OptimizedCV["contact"]) || {},
    summary: String(raw.summary || ""),
    work_experience: Array.isArray(raw.work_experience)
      ? (raw.work_experience as OptimizedCV["work_experience"])
      : [],
    skills: Array.isArray(raw.skills)
      ? (raw.skills as OptimizedCV["skills"])
      : [],
    education: Array.isArray(raw.education)
      ? (raw.education as OptimizedCV["education"])
      : [],
    languages: Array.isArray(raw.languages)
      ? (raw.languages as OptimizedCV["languages"])
      : [],
    certifications: Array.isArray(raw.certifications)
      ? (raw.certifications as OptimizedCV["certifications"])
      : undefined,
    projects: Array.isArray(raw.projects)
      ? (raw.projects as OptimizedCV["projects"])
      : undefined,
    ats_keywords_used: Array.isArray(raw.ats_keywords_used)
      ? raw.ats_keywords_used.map(String)
      : [],
    changes_summary: Array.isArray(raw.changes_summary)
      ? raw.changes_summary.map(String)
      : [],
  };
}
