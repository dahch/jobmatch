import type { ParsedCV } from "@/shared/types";
import { parseAIJsonResponse } from "@/shared/lib/aiJson";

/**
 * Parse a CV file (PDF, DOCX, or TXT) into raw text, then structure it via AI.
 */
export async function parseCVFile(file: File): Promise<ParsedCV> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  let rawText: string;

  if (ext === "txt") {
    rawText = await file.text();
  } else if (ext === "pdf") {
    rawText = await parsePDF(file);
  } else if (ext === "docx") {
    rawText = await parseDOCX(file);
  } else {
    throw new Error(`Unsupported file format: ${ext}`);
  }

  if (rawText.trim().length === 0) {
    throw new Error("No text could be extracted from the file.");
  }

  // Check for scanned PDF (very little text extracted)
  if (ext === "pdf" && rawText.trim().length < 50) {
    console.warn("PDF may be scanned image - very little text extracted");
  }

  return structureCVWithAI(rawText);
}

async function parsePDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf-worker/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n\n");
}

async function parseDOCX(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function structureCVWithAI(rawText: string): Promise<ParsedCV> {
  // Dynamically import to avoid circular deps
  const { useAIProviderStore } = await import("@/features/ai-provider/model/store");
  const { chatCompletion } = await import("@/features/ai-provider/api/aiClient");

  const config = useAIProviderStore.getState().config;
  if (!config) {
    throw new Error("AI provider not configured. Go to Settings first.");
  }

  const prompt = `You are an expert assistant specializing in human resources and technical CVs.
You are provided with text extracted from a CV. Your task is to structure it into an exact JSON object following the provided schema.

RULES:
- Only extract information that is explicitly present in the text. Do not infer or invent anything.
- If a field is not present in the CV, return null or an empty array as appropriate.
- Dates must be in "MMM YYYY" format (e.g. "Jan 2021") or "YYYY" if no month is available.
- Return ONLY the JSON, no markdown, no explanations.

SCHEMA:
{
  "full_name": "string",
  "contact": { "email": "string|null", "phone": "string|null", "linkedin": "string|null", "github": "string|null", "portfolio": "string|null", "location": "string|null" },
  "summary": "string|null",
  "work_experience": [{ "company": "string", "title": "string", "start_date": "string", "end_date": "string|null", "location": "string|null", "description": "string", "technologies": ["string"], "achievements": ["string"] }],
  "education": [{ "institution": "string", "degree": "string", "field": "string|null", "start_date": "string|null", "end_date": "string|null" }],
  "skills": [{ "category": "string", "items": ["string"] }],
  "languages": [{ "language": "string", "level": "string" }],
  "certifications": [{ "name": "string", "issuer": "string", "date": "string|null" }],
  "projects": [{ "name": "string", "description": "string", "technologies": ["string"], "url": "string|null" }]
}

CV TEXT:
${rawText.slice(0, 15000)}`;

  const response = await chatCompletion(config, [{ role: "user", content: prompt }], {
    temperature: 0,
    max_tokens: 16000,
    response_format: { type: "json_object" },
  });

  if (!response.content || response.content.trim().length === 0) {
    throw new Error("AI returned an empty response. Try a different model or reduce CV length.");
  }

  const parsed = parseAIJsonResponse(response.content);

  return {
    full_name: (parsed.full_name as string) || "Unknown",
    contact: (parsed.contact as ParsedCV["contact"]) || {},
    summary: parsed.summary as string | undefined,
    work_experience: (parsed.work_experience as ParsedCV["work_experience"]) || [],
    education: (parsed.education as ParsedCV["education"]) || [],
    skills: (parsed.skills as ParsedCV["skills"]) || [],
    languages: (parsed.languages as ParsedCV["languages"]) || [],
    certifications: parsed.certifications as ParsedCV["certifications"],
    projects: parsed.projects as ParsedCV["projects"],
    raw_text: rawText,
  };
}
