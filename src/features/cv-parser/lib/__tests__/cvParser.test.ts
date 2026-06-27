import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AIClientConfig } from "@/shared/types";

// The cvParser module uses dynamic imports for pdfjs-dist and mammoth.
// We mock these and the AI client.

vi.mock("@/shared/api/aiClient", () => ({
  chatCompletion: vi.fn(),
}));

import { chatCompletion } from "@/shared/api/aiClient";

// Mock pdfjs-dist
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: vi.fn(),
}));

// Mock mammoth
vi.mock("mammoth", () => ({
  extractRawText: vi.fn(),
}));

import { parseCVFile } from "@/features/cv-parser/lib/cvParser";

const mockConfig: AIClientConfig = {
  provider: "openai",
  apiKey: "test-key",
  model: "gpt-4o",
};

const validCVResponse = {
  full_name: "John Smith",
  contact: { email: "john@test.com", phone: null, linkedin: null, github: null, portfolio: null, location: "New York" },
  summary: "Experienced developer",
  work_experience: [
    {
      company: "TechInc",
      title: "Engineer",
      start_date: "2020-01-01",
      end_date: "2024-01-01",
      description: "Built apps",
      technologies: ["React", "Node.js"],
      achievements: [],
    },
  ],
  education: [],
  skills: [{ category: "Frontend", items: ["React"] }],
  languages: [{ language: "English", level: "Native" }],
  certifications: [],
  projects: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parseCVFile", () => {
  it("parses a TXT file", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify(validCVResponse),
    });

    const file = new File(["John Smith\nEngineer\nReact, Node.js"], "cv.txt", {
      type: "text/plain",
    });

    const result = await parseCVFile(file, mockConfig);

    expect(result.full_name).toBe("John Smith");
    expect(result.raw_text).toBe("John Smith\nEngineer\nReact, Node.js");
  });

  it("throws for unsupported file format", async () => {
    const file = new File(["content"], "cv.jpg", { type: "image/jpeg" });

    await expect(parseCVFile(file, mockConfig)).rejects.toThrow(
      "Unsupported file format: jpg",
    );
  });

  it("throws when no text is extracted from file", async () => {
    const file = new File(["   "], "cv.txt", { type: "text/plain" });

    await expect(parseCVFile(file, mockConfig)).rejects.toThrow(
      "No text could be extracted from the file.",
    );
  });

  it("parses a DOCX file", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify(validCVResponse),
    });

    // Mock mammoth extraction
    const mammoth = await import("mammoth");
    vi.mocked(mammoth.extractRawText).mockResolvedValue({
      value: "John Smith\nSoftware Engineer\nReact, Node.js",
      messages: [],
    });

    const file = new File(["fake-docx-content"], "cv.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const result = await parseCVFile(file, mockConfig);
    expect(result.full_name).toBe("John Smith");
    expect(result.raw_text).toBe("John Smith\nSoftware Engineer\nReact, Node.js");
  });

  it("truncates raw text to 15000 chars for AI prompt", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({
      content: JSON.stringify(validCVResponse),
    });

    // Use unique text to verify truncation
    const firstPart = "A".repeat(15000);
    const secondPart = "B".repeat(5000);
    const longText = firstPart + secondPart;
    const file = new File([longText], "cv.txt", { type: "text/plain" });

    await parseCVFile(file, mockConfig);

    // Verify the prompt content was truncated
    const promptArg = vi.mocked(chatCompletion).mock.calls[0][1][0].content;
    // The CV TEXT: section should only contain the first 15000 chars (all A's)
    const cvTextMatch = promptArg.match(/CV TEXT:\n([\s\S]*)$/);
    const cvTextInPrompt = cvTextMatch ? cvTextMatch[1].trim() : "";
    // Should NOT contain any B characters (only first 15000 chars kept)
    expect(cvTextInPrompt).not.toContain("B");
    // Total length of CV text in prompt should be at most 15100 (allowing for newlines/spaces)
    expect(cvTextInPrompt.length).toBeLessThanOrEqual(15100);
  });

  it("handles chatCompletion returning null content", async () => {
    vi.mocked(chatCompletion).mockResolvedValue({ content: "" });

    const file = new File(["Some CV text"], "cv.txt", {
      type: "text/plain",
    });

    await expect(parseCVFile(file, mockConfig)).rejects.toThrow(
      "AI returned an empty response",
    );
  });
});
