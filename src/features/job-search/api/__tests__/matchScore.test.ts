import { describe, it, expect } from "vitest";
import { calculateMatchScore } from "@/features/job-search/api/matchScore";
import type { ParsedCV, JobOffer } from "@/shared/types";

const mockCV: ParsedCV = {
  full_name: "John Doe",
  contact: { email: "john@test.com" },
  summary: "Senior frontend developer",
  work_experience: [
    {
      company: "Acme",
      title: "Senior Frontend Dev",
      start_date: "2020-01-01",
      end_date: "2024-01-01",
      description: "Built React apps with TypeScript",
      technologies: ["React", "TypeScript", "Node.js"],
      achievements: ["Improved performance by 50%"],
    },
  ],
  education: [],
  skills: [
    { category: "Frontend", items: ["React", "TypeScript", "CSS"] },
    { category: "Backend", items: ["Node.js", "Python"] },
  ],
  languages: [{ language: "English", level: "Native" }],
  raw_text: "test",
};

const mockJob: JobOffer = {
  id: "1",
  title: "Senior Frontend Engineer",
  company: "TechCorp",
  location: "Barcelona",
  modality: "Remote",
  url: "",
  source_portal: "LinkedIn",
  raw_description: "Looking for a React developer",
  extracted_requirements: {
    must_have: ["React experience", "TypeScript knowledge"],
    nice_to_have: ["GraphQL"],
    technologies: ["React", "TypeScript", "GraphQL"],
    years_experience: 5,
    seniority_level: "Senior",
    languages: ["English"],
  },
  ats_keywords: ["React", "TypeScript", "Frontend"],
  status: "new",
};

describe("calculateMatchScore", () => {
  it("returns a score between 0 and 100", () => {
    const result = calculateMatchScore(mockCV, mockJob);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns breakdown with all required fields", () => {
    const result = calculateMatchScore(mockCV, mockJob);
    expect(result.breakdown).toHaveProperty("skills");
    expect(result.breakdown).toHaveProperty("technologies");
    expect(result.breakdown).toHaveProperty("experience");
    expect(result.breakdown).toHaveProperty("seniority");
  });

  it("returns matched and missing arrays", () => {
    const result = calculateMatchScore(mockCV, mockJob);
    expect(Array.isArray(result.matchedTech)).toBe(true);
    expect(Array.isArray(result.missingTech)).toBe(true);
    expect(Array.isArray(result.matchedSkills)).toBe(true);
    expect(Array.isArray(result.missingSkills)).toBe(true);
  });

  it("matches technologies that exist in CV", () => {
    const result = calculateMatchScore(mockCV, mockJob);
    expect(result.matchedTech).toContain("react");
    expect(result.matchedTech).toContain("typescript");
  });

  it("handles empty job requirements", () => {
    const emptyJob: JobOffer = {
      ...mockJob,
      extracted_requirements: {
        must_have: [],
        nice_to_have: [],
        technologies: [],
        languages: [],
      },
      ats_keywords: [],
    };
    const result = calculateMatchScore(mockCV, emptyJob);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("handles CV with null fields gracefully", () => {
    const sparseCV: ParsedCV = {
      ...mockCV,
      work_experience: [
        {
          company: "Test",
          title: "Dev",
          start_date: "2022",
          description: null as unknown as string,
          technologies: null as unknown as string[],
          achievements: null as unknown as string[],
        },
      ],
    };
    expect(() => calculateMatchScore(sparseCV, mockJob)).not.toThrow();
  });
});
