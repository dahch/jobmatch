import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ParsedCV, OptimizedCV, AIClientConfig, JobOffer } from "@/shared/types";

// Use hoisted mock storage to avoid TDZ issues with vi.mock
const { mockStorage } = vi.hoisted(() => ({ mockStorage: {} as Record<string, string> }));

vi.mock("@/shared/lib/storage", () => ({
  getStorageItem: vi.fn((key: string) => {
    const raw = mockStorage[key];
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }),
  setStorageItem: vi.fn((key: string, value: unknown) => {
    mockStorage[key] = JSON.stringify(value);
  }),
}));

import { useCVStore } from "@/features/cv-builder/model/store";

const mockParsedCV: ParsedCV = {
  full_name: "Test User",
  contact: { email: "test@test.com" },
  summary: "A developer",
  work_experience: [],
  education: [],
  skills: [],
  languages: [],
  raw_text: "Test CV text",
};

const mockOptimizedCV: OptimizedCV = {
  target_job: "Software Engineer",
  target_company: "TestCorp",
  full_name: "Test User",
  contact: { email: "test@test.com" },
  summary: "Optimized summary",
  work_experience: [],
  skills: [],
  education: [],
  languages: [],
  ats_keywords_used: ["React"],
  changes_summary: ["Changed summary"],
};

const mockJob: JobOffer = {
  id: "job-1",
  title: "Software Engineer",
  company: "TestCorp",
  location: "Remote",
  modality: "Remote",
  url: "",
  source_portal: "LinkedIn",
  raw_description: "Test job description",
  extracted_requirements: {
    must_have: ["React"],
    nice_to_have: [],
    technologies: ["React"],
  },
  ats_keywords: ["React"],
  status: "new",
};

const mockConfig: AIClientConfig = {
  provider: "openai",
  apiKey: "test-key",
  model: "gpt-4o",
};

beforeEach(() => {
  useCVStore.setState({
    parsedCV: null,
    optimizedCVs: [],
    isParsingCV: false,
    isGeneratingCV: false,
    generationError: null,
  });
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  vi.clearAllMocks();
});

describe("useCVStore", () => {
  describe("setParsedCV", () => {
    it("sets parsedCV and persists to storage", () => {
      const { setParsedCV } = useCVStore.getState();
      setParsedCV(mockParsedCV);

      const state = useCVStore.getState();
      expect(state.parsedCV).toEqual(mockParsedCV);
    });

    it("truncates raw_text in both localStorage and state", () => {
      const { setParsedCV } = useCVStore.getState();
      const longText = "x".repeat(60000);
      setParsedCV({ ...mockParsedCV, raw_text: longText });

      // Both state and localStorage get the truncated version
      const state = useCVStore.getState();
      expect(state.parsedCV?.raw_text.length).toBe(50000);

      const stored = mockStorage["parsed-cv"];
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored);
      expect(parsed.raw_text.length).toBe(50000);
    });
  });

  describe("addOptimizedCV", () => {
    it("adds an optimized CV to the list", () => {
      const { addOptimizedCV } = useCVStore.getState();
      addOptimizedCV("job-1", mockOptimizedCV);

      const state = useCVStore.getState();
      expect(state.optimizedCVs).toHaveLength(1);
      expect(state.optimizedCVs[0].jobId).toBe("job-1");
      expect(state.optimizedCVs[0].cv).toEqual(mockOptimizedCV);
      expect(state.optimizedCVs[0].createdAt).toBeDefined();
    });

    it("keeps only last 10 optimized CVs", () => {
      const { addOptimizedCV } = useCVStore.getState();

      for (let i = 0; i < 15; i++) {
        addOptimizedCV(`job-${i}`, {
          ...mockOptimizedCV,
          target_job: `Job ${i}`,
        });
      }

      const state = useCVStore.getState();
      expect(state.optimizedCVs).toHaveLength(10);
      expect(state.optimizedCVs[9].cv.target_job).toBe("Job 14");
    });
  });

  describe("setIsParsingCV / setIsGeneratingCV", () => {
    it("sets isParsingCV flag", () => {
      useCVStore.getState().setIsParsingCV(true);
      expect(useCVStore.getState().isParsingCV).toBe(true);

      useCVStore.getState().setIsParsingCV(false);
      expect(useCVStore.getState().isParsingCV).toBe(false);
    });

    it("sets isGeneratingCV flag", () => {
      useCVStore.getState().setIsGeneratingCV(true);
      expect(useCVStore.getState().isGeneratingCV).toBe(true);
    });
  });

  describe("setGenerationError", () => {
    it("sets and clears generation error", () => {
      useCVStore.getState().setGenerationError("Something went wrong");
      expect(useCVStore.getState().generationError).toBe("Something went wrong");

      useCVStore.getState().setGenerationError(null);
      expect(useCVStore.getState().generationError).toBeNull();
    });
  });

  describe("generateOptimizedCV", () => {
    it("sets error when no CV is uploaded", async () => {
      await useCVStore.getState().generateOptimizedCV(mockJob, mockConfig);

      expect(useCVStore.getState().generationError).toBe(
        "No CV uploaded. Upload your CV first.",
      );
      expect(useCVStore.getState().isGeneratingCV).toBe(false);
    });
  });
});
