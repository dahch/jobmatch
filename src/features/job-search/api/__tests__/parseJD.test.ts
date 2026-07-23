import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AIClientConfig } from "@/shared/types";

// Mock the AI client
vi.mock("@/shared/api/aiClient", () => ({
  chatCompletion: vi.fn(),
}));

import { chatCompletion } from "@/shared/api/aiClient";
import { parseJDText } from "@/features/job-search/api/parseJD";

const mockConfig: AIClientConfig = {
  provider: "openai",
  apiKey: "test-key",
  model: "gpt-4o",
};

const mockJDText = "Senior React Developer at TechCorp\nRemote position\n5+ years experience";

const validAIResponse = {
  title: "Senior React Developer",
  company: "TechCorp",
  location: "Remote",
  modality: "Remote",
  url: "",
  source_portal: "Manual Paste",
  raw_description: "Senior React Developer at TechCorp\nRemote position\n5+ years experience",
  extracted_requirements: {
    must_have: ["React experience", "TypeScript", "5+ years frontend"],
    nice_to_have: ["GraphQL", "AWS"],
    technologies: ["React", "TypeScript", "GraphQL", "AWS"],
    years_experience: 5,
    seniority_level: "Senior",
    languages: ["English"],
  },
  ats_keywords: ["React", "TypeScript", "Frontend", "Senior", "Remote"],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parseJDText", () => {
  it("parses a job description and returns a JobOffer", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify(validAIResponse),
    });

    const result = await parseJDText(mockConfig, mockJDText);

    expect(result.title).toBe("Senior React Developer");
    expect(result.company).toBe("TechCorp");
    expect(result.modality).toBe("Remote");
    expect(result.source_portal).toBe("Manual Paste");
    expect(result.status).toBe("new");
    expect(result.id).toBeDefined();
    expect(result.id.length).toBeGreaterThan(0);
  });

  it("normalizes modality values", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify({
        ...validAIResponse,
        modality: "hybrid",
      }),
    });

    const result = await parseJDText(mockConfig, mockJDText);
    expect(result.modality).toBe("Hybrid");
  });

  it("normalizes on-site modality variants", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify({
        ...validAIResponse,
        modality: "onsite",
      }),
    });

    const result = await parseJDText(mockConfig, mockJDText);
    expect(result.modality).toBe("On-site");
  });

  it("falls back to raw text for raw_description when AI omits it", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify({
        ...validAIResponse,
        raw_description: "",
      }),
    });

    const result = await parseJDText(mockConfig, mockJDText);
    expect(result.raw_description).toBe(mockJDText);
  });

  it("handles empty extracted_requirements gracefully", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify({
        title: "Test Job",
        company: "Test",
        location: "Test",
        modality: "Unknown",
        url: "",
        raw_description: "Test",
        extracted_requirements: null,
        ats_keywords: [],
      }),
    });

    const result = await parseJDText(mockConfig, mockJDText);

    expect(result.extracted_requirements.must_have).toEqual([]);
    expect(result.extracted_requirements.technologies).toEqual([]);
    expect(result.extracted_requirements.seniority_level).toBeUndefined();
    expect(result.extracted_requirements.years_experience).toBeUndefined();
  });

  it("falls back to defaults for missing fields", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify({}),
    });

    const result = await parseJDText(mockConfig, mockJDText);

    expect(result.title).toBe("Unknown Title");
    expect(result.company).toBe("Unknown Company");
    expect(result.location).toBe("Unknown");
    expect(result.modality).toBe("Unknown");
  });

  it("throws when AI returns empty content", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({ content: "" });

    await expect(
      parseJDText(mockConfig, mockJDText),
    ).rejects.toThrow("AI returned an empty response");
  });

  it("throws when AI returns whitespace-only content", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({ content: "   " });

    await expect(
      parseJDText(mockConfig, mockJDText),
    ).rejects.toThrow("AI returned an empty response");
  });

  it("sends correct temperature and max_tokens options", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify(validAIResponse),
    });

    await parseJDText(mockConfig, mockJDText);

    expect(chatCompletion).toHaveBeenCalledWith(
      mockConfig,
      expect.any(Array),
      expect.objectContaining({
        temperature: 0,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    );
  });

  it("preserves years_experience as a number", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify({
        ...validAIResponse,
        extracted_requirements: {
          must_have: ["React"],
          nice_to_have: [],
          technologies: ["React"],
          years_experience: 7,
          seniority_level: "Senior",
          languages: ["English"],
        },
      }),
    });

    const result = await parseJDText(mockConfig, mockJDText);
    expect(result.extracted_requirements.years_experience).toBe(7);
  });

  it("handles years_experience as null", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify({
        ...validAIResponse,
        extracted_requirements: {
          must_have: ["React"],
          nice_to_have: [],
          technologies: ["React"],
          years_experience: null,
          seniority_level: null,
          languages: [],
        },
      }),
    });

    const result = await parseJDText(mockConfig, mockJDText);
    expect(result.extracted_requirements.years_experience).toBeUndefined();
  });

  it("sanitizes control characters from input to prevent prompt injection", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify(validAIResponse),
    });

    const maliciousText = "Normal JD text\u0000with null byte\u0001and other\u001Fcontrols";
    await parseJDText(mockConfig, maliciousText);

    const sentContent = vi.mocked(chatCompletion).mock.calls[0][1][0].content;
    expect(sentContent).not.toContain("\u0000");
    expect(sentContent).not.toContain("\u0001");
    expect(sentContent).not.toContain("\u001F");
    expect(sentContent).toContain("Normal JD text");
    expect(sentContent).toContain("with null byte");
    expect(sentContent).toContain("and othercontrols");
  });

  it("truncates input longer than 10000 chars", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify(validAIResponse),
    });

    const longText = "A".repeat(15000);
    await parseJDText(mockConfig, longText);

    const sentContent = vi.mocked(chatCompletion).mock.calls[0][1][0].content;
    expect(sentContent.length).toBeLessThan(15000);
    expect(sentContent).toContain("A".repeat(10000));
  });
});
