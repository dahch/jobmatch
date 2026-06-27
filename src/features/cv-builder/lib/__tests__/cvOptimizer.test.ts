import { describe, it, expect, vi, beforeEach } from "vitest";
import { optimizeCV } from "@/features/cv-builder/lib/cvOptimizer";
import type { ParsedCV, JobOffer, AIClientConfig } from "@/shared/types";

// Mock the AI client to avoid real API calls
vi.mock("@/shared/api/aiClient", () => ({
  chatCompletion: vi.fn(),
}));

import { chatCompletion } from "@/shared/api/aiClient";

const mockConfig: AIClientConfig = {
  provider: "openai",
  apiKey: "test-key",
  model: "gpt-4o",
};

const mockParsedCV: ParsedCV = {
  full_name: "Jane Doe",
  contact: { email: "jane@test.com" },
  summary: "Full-stack developer with 5 years of experience",
  work_experience: [
    {
      company: "TechInc",
      title: "Software Engineer",
      start_date: "2020-01-01",
      end_date: "2024-01-01",
      description: "Built web applications using React and Node.js",
      technologies: ["React", "Node.js", "TypeScript"],
      achievements: ["Reduced load time by 40%"],
    },
  ],
  education: [
    {
      institution: "State University",
      degree: "BSc Computer Science",
      field: "Computer Science",
      start_date: "2015-09-01",
      end_date: "2019-06-01",
    },
  ],
  skills: [
    { category: "Frontend", items: ["React", "TypeScript", "CSS"] },
    { category: "Backend", items: ["Node.js", "Python", "SQL"] },
  ],
  languages: [{ language: "English", level: "Native" }],
  raw_text: "Jane Doe\nSoftware Engineer\nReact, Node.js, TypeScript",
};

const mockJob: JobOffer = {
  id: "job-1",
  title: "Senior Frontend Engineer",
  company: "FutureCorp",
  location: "Remote",
  modality: "Remote",
  url: "",
  source_portal: "LinkedIn",
  raw_description: "We need a senior frontend engineer with React and TypeScript",
  extracted_requirements: {
    must_have: ["React", "TypeScript", "CSS"],
    nice_to_have: ["GraphQL", "Docker"],
    technologies: ["React", "TypeScript", "CSS", "GraphQL"],
    years_experience: 5,
    seniority_level: "Senior",
    languages: ["English"],
  },
  ats_keywords: ["React", "TypeScript", "Frontend", "A11y"],
  status: "new",
};

describe("optimizeCV", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a structured optimized CV on successful AI response", async () => {
    const mockResponse = {
      target_job: "Senior Frontend Engineer",
      target_company: "FutureCorp",
      full_name: "Jane Doe",
      contact: { email: "jane@test.com" },
      summary:
        "Experienced frontend engineer specializing in React and TypeScript.",
      work_experience: [
        {
          company: "TechInc",
          title: "Software Engineer",
          start_date: "2020-01-01",
          end_date: "2024-01-01",
          description: "Built scalable React applications with TypeScript",
          technologies: ["React", "TypeScript", "Node.js"],
          achievements: ["Reduced load time by 40%"],
        },
      ],
      skills: [
        { category: "Frontend", items: ["React", "TypeScript", "CSS"] },
        { category: "Backend", items: ["Node.js"] },
      ],
      education: [
        {
          institution: "State University",
          degree: "BSc Computer Science",
          field: "Computer Science",
          start_date: "2015-09-01",
          end_date: "2019-06-01",
        },
      ],
      languages: [{ language: "English", level: "Native" }],
      ats_keywords_used: ["React", "TypeScript", "Frontend"],
      changes_summary: ["Rewrote summary", "Reordered skills"],
    };

    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify(mockResponse),
    });

    const result = await optimizeCV(mockConfig, mockParsedCV, mockJob);

    expect(result).toHaveProperty("target_job", "Senior Frontend Engineer");
    expect(result).toHaveProperty("target_company", "FutureCorp");
    expect(result).toHaveProperty("full_name", "Jane Doe");
    expect(result.ats_keywords_used).toContain("React");
    expect(result.changes_summary.length).toBeGreaterThan(0);
  });

  it("extracts JSON from markdown code block in AI response", async () => {
    const mockResponseObj = {
      target_job: "Senior Frontend Engineer",
      target_company: "FutureCorp",
      full_name: "Jane Doe",
      contact: { email: "jane@test.com" },
      summary: "Targeted summary.",
      work_experience: [],
      skills: [],
      education: [],
      languages: [],
      ats_keywords_used: [],
      changes_summary: [],
    };

    vi.mocked(chatCompletion).mockResolvedValue({
      content:
        '```json\n' + JSON.stringify(mockResponseObj) + "\n```",
    });

    const result = await optimizeCV(mockConfig, mockParsedCV, mockJob);
    expect(result.full_name).toBe("Jane Doe");
  });

  it("throws when AI returns empty content", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({ content: "" });

    await expect(
      optimizeCV(mockConfig, mockParsedCV, mockJob),
    ).rejects.toThrow("AI returned an empty response");
  });

  it("throws when AI response is not valid JSON", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: "not valid json at all",
    });

    await expect(
      optimizeCV(mockConfig, mockParsedCV, mockJob),
    ).rejects.toThrow("Failed to parse AI response");
  });

  it("sends correct temperature and max_tokens options", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify({
        target_job: "Test",
        target_company: "Test",
        full_name: "Test",
        contact: {},
        summary: "",
        work_experience: [],
        skills: [],
        education: [],
        languages: [],
        ats_keywords_used: [],
        changes_summary: [],
      }),
    });

    await optimizeCV(mockConfig, mockParsedCV, mockJob);

    expect(chatCompletion).toHaveBeenCalledWith(
      mockConfig,
      expect.any(Array),
      expect.objectContaining({
        temperature: 0.2,
        max_tokens: 16000,
        response_format: { type: "json_object" },
      }),
    );
  });

  it("includes extra instructions in the prompt when provided", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify({
        target_job: "Test",
        target_company: "Test",
        full_name: "Test",
        contact: {},
        summary: "",
        work_experience: [],
        skills: [],
        education: [],
        languages: [],
        ats_keywords_used: [],
        changes_summary: [],
      }),
    });

    await optimizeCV(
      mockConfig,
      mockParsedCV,
      mockJob,
      "Emphasize leadership skills",
    );

    const callArgs = vi.mocked(chatCompletion).mock.calls[0];
    const promptContent = (callArgs[1] as Array<{ role: string; content: string }>)[0].content;
    expect(promptContent).toContain("Emphasize leadership skills");
    expect(promptContent).toContain("ADDITIONAL INSTRUCTIONS FROM USER:");
  });

  it("defaults missing fields from job data", async () => {
    const minimalResponse = {
      full_name: "Jane Doe",
      summary: "",
      work_experience: [],
      skills: [],
      education: [],
      languages: [],
    };

    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify(minimalResponse),
    });

    const result = await optimizeCV(mockConfig, mockParsedCV, mockJob);

    expect(result.target_job).toBe(mockJob.title);
    expect(result.target_company).toBe(mockJob.company);
    expect(result.contact).toEqual({});
  });
});
