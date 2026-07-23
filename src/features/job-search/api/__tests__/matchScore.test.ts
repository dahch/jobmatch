import { describe, it, expect } from "vitest";
import { calculateMatchScore, populateMatchScores } from "@/features/job-search/api/matchScore";
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

  it("sets expScore=40 when experience is far below required", () => {
    const job5yrs: JobOffer = {
      ...mockJob,
      extracted_requirements: {
        ...mockJob.extracted_requirements,
        years_experience: 10,
      },
    };
    const result = calculateMatchScore(mockCV, job5yrs);
    expect(result.breakdown.experience).toBe(40);
  });

  it("sets seniorityScore=100 on exact seniority match", () => {
    const seniorCV: ParsedCV = {
      ...mockCV,
      work_experience: Array.from({ length: 6 }, (_, i) => ({
        company: `Co${i}`,
        title: "Engineer",
        start_date: `${2014 + i}`,
        end_date: `${2015 + i}`,
        description: "Worked",
        technologies: ["React"],
        achievements: ["Did things"],
      })),
    };
    const jobSenior: JobOffer = {
      ...mockJob,
      extracted_requirements: {
        ...mockJob.extracted_requirements,
        seniority_level: "Senior",
      },
    };
    const result = calculateMatchScore(seniorCV, jobSenior);
    expect(result.breakdown.seniority).toBe(100);
  });

  it("sets seniorityScore=100 on junior exact match", () => {
    const juniorCV: ParsedCV = {
      ...mockCV,
      work_experience: [
        {
          company: "Startup",
          title: "Junior Dev",
          start_date: "2024-01",
          end_date: "2025-06",
          description: "Built features",
          technologies: ["React"],
          achievements: ["Shipped feature"],
        },
      ],
      skills: [{ category: "Frontend", items: ["React"] }],
    };
    const jobJunior: JobOffer = {
      ...mockJob,
      extracted_requirements: {
        ...mockJob.extracted_requirements,
        seniority_level: "Junior",
        years_experience: 1,
      },
    };
    const result = calculateMatchScore(juniorCV, jobJunior);
    expect(result.breakdown.seniority).toBe(100);
  });

  describe("populateMatchScores", () => {
    it("sets match_score on each job", () => {
      const updated = populateMatchScores([mockJob], mockCV);
      expect(updated[0].match_score).toBeTypeOf("number");
      expect(updated[0].match_score).toBeGreaterThanOrEqual(0);
      expect(updated[0].match_score).toBeLessThanOrEqual(100);
    });

    it("preserves other job fields", () => {
      const updated = populateMatchScores([mockJob], mockCV);
      expect(updated[0].id).toBe(mockJob.id);
      expect(updated[0].title).toBe(mockJob.title);
      expect(updated[0].status).toBe(mockJob.status);
    });

    it("handles empty jobs array", () => {
      const updated = populateMatchScores([], mockCV);
      expect(updated).toEqual([]);
    });
  });

  it("infers seniority from many years", () => {
    // 5 consecutive years → inferSeniority returns "senior"
    const seniorCV: ParsedCV = {
      ...mockCV,
      work_experience: [
        {
          company: "Co1",
          title: "Engineer",
          start_date: "2020-01",
          end_date: "2025-06",
          description: "Worked",
          technologies: ["React"],
          achievements: ["Did things"],
        },
      ],
    };
    // mockJob already has seniority_level: "Senior"
    const result = calculateMatchScore(seniorCV, mockJob);
    expect(result.breakdown.seniority).toBe(100);
  });

  it("sets expScore=80 when totalYears is one below required", () => {
    const jobReq4: JobOffer = {
      ...mockJob,
      extracted_requirements: {
        ...mockJob.extracted_requirements,
        years_experience: 5,
      },
    };
    // 4 years of experience (2020-2024) when 5 required => expScore 80
    const cv4yr: ParsedCV = {
      ...mockCV,
      work_experience: [{
        company: "Co",
        title: "Dev",
        start_date: "2020-01",
        end_date: "2024-01",
        description: "Worked",
        technologies: ["React"],
        achievements: [],
      }],
    };
    const result = calculateMatchScore(cv4yr, jobReq4);
    expect(result.breakdown.experience).toBe(80);
  });

  it("sets expScore=60 when totalYears is two below required", () => {
    const jobReq5: JobOffer = {
      ...mockJob,
      extracted_requirements: {
        ...mockJob.extracted_requirements,
        years_experience: 5,
      },
    };
    // 3 years of experience (2021-2024) when 5 required => expScore 60
    const cv3yr: ParsedCV = {
      ...mockCV,
      work_experience: [{
        company: "Co",
        title: "Dev",
        start_date: "2021-01",
        end_date: "2024-01",
        description: "Worked",
        technologies: ["React"],
        achievements: [],
      }],
    };
    const result = calculateMatchScore(cv3yr, jobReq5);
    expect(result.breakdown.experience).toBe(60);
  });

  it("defaults expScore to 70 when no years_experience required", () => {
    const jobNoReq: JobOffer = {
      ...mockJob,
      extracted_requirements: {
        ...mockJob.extracted_requirements,
        years_experience: undefined,
      },
    };
    const result = calculateMatchScore(mockCV, jobNoReq);
    expect(result.breakdown.experience).toBe(70);
  });

  it("sets seniorityScore=80 when job level is 'any'", () => {
    const jobAny: JobOffer = {
      ...mockJob,
      extracted_requirements: {
        ...mockJob.extracted_requirements,
        seniority_level: "Any",
      },
    };
    const result = calculateMatchScore(mockCV, jobAny);
    expect(result.breakdown.seniority).toBe(80);
  });

  it("sets seniorityScore=80 when job level is empty", () => {
    const jobEmpty: JobOffer = {
      ...mockJob,
      extracted_requirements: {
        ...mockJob.extracted_requirements,
        seniority_level: "",
      },
    };
    const result = calculateMatchScore(mockCV, jobEmpty);
    expect(result.breakdown.seniority).toBe(80);
  });

  it("sets seniorityScore=50 on level mismatch", () => {
    const juniorJob: JobOffer = {
      ...mockJob,
      extracted_requirements: {
        ...mockJob.extracted_requirements,
        seniority_level: "Junior",
      },
    };
    // mockCV has 4 years (2020-2024) => inferSeniority returns "mid"
    const cvMid: ParsedCV = {
      ...mockCV,
      work_experience: [{
        company: "Co",
        title: "Dev",
        start_date: "2020-01",
        end_date: "2024-01",
        description: "Worked",
        technologies: ["React"],
        achievements: [],
      }],
    };
    const result = calculateMatchScore(cvMid, juniorJob);
    expect(result.breakdown.seniority).toBe(50);
  });

  it("infers staff seniority for 8+ years", () => {
    const staffCV: ParsedCV = {
      ...mockCV,
      work_experience: [
        {
          company: "BigCo",
          title: "Engineer",
          start_date: "2015-01",
          end_date: "2024-01",
          description: "Long tenure",
          technologies: ["React"],
          achievements: ["Led teams"],
        },
      ],
    };
    const staffJob: JobOffer = {
      ...mockJob,
      extracted_requirements: {
        ...mockJob.extracted_requirements,
        seniority_level: "Staff / Principal",
      },
    };
    const result = calculateMatchScore(staffCV, staffJob);
    expect(result.breakdown.seniority).toBe(100);
  });

  it("infers mid seniority for 2-4 years", () => {
    const midCV: ParsedCV = {
      ...mockCV,
      work_experience: [
        {
          company: "MidCo",
          title: "Developer",
          start_date: "2022-01",
          end_date: "2024-06",
          description: "Worked",
          technologies: ["React"],
          achievements: [],
        },
      ],
    };
    const midJob: JobOffer = {
      ...mockJob,
      extracted_requirements: {
        ...mockJob.extracted_requirements,
        seniority_level: "Mid",
      },
    };
    const result = calculateMatchScore(midCV, midJob);
    expect(result.breakdown.seniority).toBe(100);
  });

  it("infers junior seniority for <2 years", () => {
    const juniorCV: ParsedCV = {
      ...mockCV,
      work_experience: [
        {
          company: "NewCo",
          title: "Junior Dev",
          start_date: "2023-06",
          end_date: "2024-01",
          description: "Learned",
          technologies: ["React"],
          achievements: [],
        },
      ],
    };
    const juniorJob: JobOffer = {
      ...mockJob,
      extracted_requirements: {
        ...mockJob.extracted_requirements,
        seniority_level: "Junior",
      },
    };
    const result = calculateMatchScore(juniorCV, juniorJob);
    expect(result.breakdown.seniority).toBe(100);
  });

  it("handles null work_experience end_date using current year", () => {
    const cvOngoing: ParsedCV = {
      ...mockCV,
      work_experience: [
        {
          company: "CurrentCo",
          title: "Dev",
          start_date: "2023-01",
          end_date: undefined,
          description: "Current job",
          technologies: ["React"],
          achievements: [],
        },
      ],
    };
    const jobReq3: JobOffer = {
      ...mockJob,
      extracted_requirements: {
        ...mockJob.extracted_requirements,
        years_experience: 3,
      },
    };
    // 2023 to current year (2026) = 3 years => >= required => expScore 100
    const result = calculateMatchScore(cvOngoing, jobReq3);
    expect(result.breakdown.experience).toBe(100);
  });

  it("parses year from malformed date strings safely", () => {
    const cvBadDates: ParsedCV = {
      ...mockCV,
      work_experience: [
        {
          company: "BadCo",
          title: "Dev",
          start_date: "not-a-date",
          end_date: null as unknown as string,
          description: "",
          technologies: [],
          achievements: [],
        },
      ],
    };
    // parseYear("not-a-date") matches no 4-digit sequence => returns 2020
    // parseYear(null) returns 2020
    // difference = 0
    const result = calculateMatchScore(cvBadDates, mockJob);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("matches skills via work experience description", () => {
    const cvWithDesc: ParsedCV = {
      ...mockCV,
      skills: [],
      work_experience: [
        {
          company: "Co",
          title: "Dev",
          start_date: "2020-01",
          end_date: "2024-01",
          description: "Worked extensively with GraphQL and Apollo",
          technologies: ["React"],
          achievements: [],
        },
      ],
    };
    // job has "GraphQL" in nice_to_have — should match via description
    const result = calculateMatchScore(cvWithDesc, mockJob);
    expect(result.matchedSkills).toContain("graphql");
  });

  it("matches skills via achievement text", () => {
    const cvWithAchievement: ParsedCV = {
      ...mockCV,
      skills: [],
      work_experience: [
        {
          company: "Co",
          title: "Dev",
          start_date: "2020-01",
          end_date: "2024-01",
          description: "General dev work",
          technologies: ["React"],
          achievements: ["Implemented GraphQL API"],
        },
      ],
    };
    const result = calculateMatchScore(cvWithAchievement, mockJob);
    expect(result.matchedSkills).toContain("graphql");
  });

  it("handles skill categories without items array", () => {
    const cvNoItems: ParsedCV = {
      ...mockCV,
      skills: [
        { category: "Frontend", items: [] as string[] },
        { category: "Empty", items: undefined as unknown as string[] },
      ],
    };
    expect(() => calculateMatchScore(cvNoItems, mockJob)).not.toThrow();
  });

  it("limits missingSkills to 10 items", () => {
    const jobManyReqs: JobOffer = {
      ...mockJob,
      extracted_requirements: {
        must_have: Array.from({ length: 20 }, (_, i) => `req-${i}`),
        nice_to_have: [],
        technologies: [],
        languages: [],
      },
      ats_keywords: [],
    };
    const result = calculateMatchScore(mockCV, jobManyReqs);
    expect(result.missingSkills.length).toBeLessThanOrEqual(10);
  });
});
