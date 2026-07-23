import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JobDetailPanel } from "@/features/job-search/ui/JobDetailPanel";
import type { JobOffer } from "@/shared/types";
import type { MatchResult } from "@/features/job-search/api/matchScore";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "job_detail.match_score": "Match Score",
        "job_detail.view_original": "View Original",
        "job_detail.matched_tech": "Matched Tech",
        "job_detail.missing_tech": "Missing Tech",
        "job_detail.technologies": "Technologies",
        "job_detail.must_have": "Must Have",
        "job_detail.nice_to_have": "Nice to Have",
        "job_detail.languages": "Languages",
        "job_detail.full_jd": "Full Job Description",
        "job_detail.ats_keywords": "ATS Keywords",
        "job_detail.generate_for_offer": "Generate CV for this offer",
      };
      return map[key] || key;
    },
  }),
}));

const baseJob: JobOffer = {
  id: "job-1",
  title: "Senior Frontend Developer",
  company: "TechCorp",
  location: "Berlin, Germany",
  modality: "Remote",
  url: "https://techcorp.com/jobs/1",
  source_portal: "Arbeitnow",
  posted_at: "2025-07-10",
  raw_description: "We are looking for a Senior Frontend Developer with React and TypeScript.",
  extracted_requirements: {
    must_have: ["React", "TypeScript", "5+ years experience"],
    nice_to_have: ["GraphQL", "AWS"],
    technologies: ["React", "TypeScript", "GraphQL", "AWS", "Node.js"],
    years_experience: 5,
    seniority_level: "Senior",
    languages: ["English", "German"],
  },
  ats_keywords: ["React", "TypeScript", "Frontend", "Senior", "Remote"],
  status: "new",
};

const mockMatchResult: MatchResult = {
  score: 85,
  breakdown: { skills: 80, technologies: 90, experience: 100, seniority: 70 },
  matchedSkills: ["React", "TypeScript"],
  missingSkills: ["GraphQL"],
  matchedTech: ["react", "typescript", "node.js"],
  missingTech: ["graphql"],
};

const defaultProps = {
  job: baseJob,
  matchResult: null,
  hasCV: false,
  isGenerating: false,
  onGenerateCV: vi.fn(),
  onClose: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("JobDetailPanel", () => {
  it("renders job title, company, and location", () => {
    render(<JobDetailPanel {...defaultProps} />);
    expect(screen.getByText("Senior Frontend Developer")).toBeInTheDocument();
    expect(screen.getByText(/TechCorp/)).toBeInTheDocument();
    expect(screen.getByText(/Berlin, Germany/)).toBeInTheDocument();
  });

  it("renders modality badge", () => {
    render(<JobDetailPanel {...defaultProps} />);
    const badges = screen.getAllByText("Remote");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("renders source portal badge", () => {
    render(<JobDetailPanel {...defaultProps} />);
    expect(screen.getByText("Arbeitnow")).toBeInTheDocument();
  });

  it("renders posted_at date when available", () => {
    render(<JobDetailPanel {...defaultProps} />);
    expect(screen.getByText("2025-07-10")).toBeInTheDocument();
  });

  it("renders view original link when url is present", () => {
    render(<JobDetailPanel {...defaultProps} />);
    expect(screen.getByText("View Original")).toBeInTheDocument();
  });

  it("renders search link when url is empty", () => {
    render(
      <JobDetailPanel
        {...defaultProps}
        job={{ ...baseJob, url: "", source_portal: "LinkedIn" }}
      />,
    );
    expect(screen.getByText(/Search on LinkedIn/)).toBeInTheDocument();
  });

  it("renders technologies section", () => {
    render(<JobDetailPanel {...defaultProps} />);
    expect(screen.getByText("Technologies")).toBeInTheDocument();
    const graphQLItems = screen.getAllByText("GraphQL");
    expect(graphQLItems.length).toBeGreaterThanOrEqual(1);
  });

  it("renders must_have section", () => {
    render(<JobDetailPanel {...defaultProps} />);
    expect(screen.getByText("Must Have")).toBeInTheDocument();
    expect(screen.getByText("5+ years experience")).toBeInTheDocument();
  });

  it("renders nice_to_have section", () => {
    render(<JobDetailPanel {...defaultProps} />);
    expect(screen.getByText("Nice to Have")).toBeInTheDocument();
    const graphQLItems = screen.getAllByText("GraphQL");
    expect(graphQLItems.length).toBeGreaterThanOrEqual(1);
  });

  it("renders languages section", () => {
    render(<JobDetailPanel {...defaultProps} />);
    expect(screen.getByText("Languages")).toBeInTheDocument();
    expect(screen.getByText("English, German")).toBeInTheDocument();
  });

  it("renders raw description", () => {
    render(<JobDetailPanel {...defaultProps} />);
    expect(
      screen.getByText(/Senior Frontend Developer with React/),
    ).toBeInTheDocument();
  });

  it("renders ATS keywords section", () => {
    render(<JobDetailPanel {...defaultProps} />);
    expect(screen.getByText("ATS Keywords")).toBeInTheDocument();
    expect(screen.getByText("Senior")).toBeInTheDocument();
  });

  describe("match score display", () => {
    it("renders match score when provided", () => {
      render(
        <JobDetailPanel {...defaultProps} matchResult={mockMatchResult} />,
      );
      expect(screen.getByText("Match Score")).toBeInTheDocument();
      expect(screen.getByText("85%")).toBeInTheDocument();
    });

    it("renders matched tech section", () => {
      render(
        <JobDetailPanel {...defaultProps} matchResult={mockMatchResult} />,
      );
      expect(screen.getByText("Matched Tech")).toBeInTheDocument();
      expect(screen.getByText("react")).toBeInTheDocument();
    });

    it("renders missing tech section", () => {
      render(
        <JobDetailPanel {...defaultProps} matchResult={mockMatchResult} />,
      );
      expect(screen.getByText("Missing Tech")).toBeInTheDocument();
      expect(screen.getByText("graphql")).toBeInTheDocument();
    });

    it("does not render match score section when null", () => {
      render(<JobDetailPanel {...defaultProps} matchResult={null} />);
      expect(screen.queryByText("Match Score")).not.toBeInTheDocument();
    });
  });

  describe("generate CV button", () => {
    it("renders generate button when hasCV is true", () => {
      render(<JobDetailPanel {...defaultProps} hasCV={true} />);
      expect(
        screen.getByText("Generate CV for this offer"),
      ).toBeInTheDocument();
    });

    it("does not render generate button when hasCV is false", () => {
      render(<JobDetailPanel {...defaultProps} hasCV={false} />);
      expect(
        screen.queryByText("Generate CV for this offer"),
      ).not.toBeInTheDocument();
    });

    it("calls onGenerateCV when button clicked", () => {
      const onGenerateCV = vi.fn();
      render(
        <JobDetailPanel
          {...defaultProps}
          hasCV={true}
          onGenerateCV={onGenerateCV}
        />,
      );
      fireEvent.click(screen.getByText("Generate CV for this offer"));
      expect(onGenerateCV).toHaveBeenCalledOnce();
    });
  });

  describe("close button", () => {
    it("calls onClose when close button clicked", () => {
      const onClose = vi.fn();
      const { container } = render(
        <JobDetailPanel {...defaultProps} onClose={onClose} />,
      );
      const closeBtn = container.querySelector(
        'button[class*="text-surface-400"]',
      );
      expect(closeBtn).not.toBeNull();
      fireEvent.click(closeBtn!);
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe("portal search links", () => {
    it("renders LinkedIn search link when source is LinkedIn and no url", () => {
      render(
        <JobDetailPanel
          {...defaultProps}
          job={{ ...baseJob, url: "", source_portal: "LinkedIn" }}
        />,
      );
      const link = screen.getByText(/Search on LinkedIn/);
      expect(link.closest("a")?.href).toContain("linkedin.com/jobs/search");
    });

    it("renders Google search fallback for unknown portal", () => {
      render(
        <JobDetailPanel
          {...defaultProps}
          job={{ ...baseJob, url: "", source_portal: "Arbeitnow" }}
        />,
      );
      const link = screen.getByText(/Search on Arbeitnow/);
      expect(link.closest("a")?.href).toContain("google.com/search");
    });

    it("renders Indeed search link when source is Indeed", () => {
      render(
        <JobDetailPanel
          {...defaultProps}
          job={{ ...baseJob, url: "", source_portal: "Indeed" }}
        />,
      );
      const link = screen.getByText(/Search on Indeed/);
      expect(link.closest("a")?.href).toContain("indeed.com/jobs");
    });

    it("renders Infojobs search link when source is Infojobs", () => {
      render(
        <JobDetailPanel
          {...defaultProps}
          job={{ ...baseJob, url: "", source_portal: "Infojobs" }}
        />,
      );
      const link = screen.getByText(/Search on Infojobs/);
      expect(link.closest("a")?.href).toContain("infojobs.net");
    });

    it("renders Glassdoor search link when source is Glassdoor", () => {
      render(
        <JobDetailPanel
          {...defaultProps}
          job={{ ...baseJob, url: "", source_portal: "Glassdoor" }}
        />,
      );
      const link = screen.getByText(/Search on Glassdoor/);
      expect(link.closest("a")?.href).toContain("glassdoor.com/Job");
    });

    it("renders Wellfound search link when source contains 'wellfound'", () => {
      render(
        <JobDetailPanel
          {...defaultProps}
          job={{ ...baseJob, url: "", source_portal: "Wellfound" }}
        />,
      );
      const link = screen.getByText(/Search on Wellfound/);
      expect(link.closest("a")?.href).toContain("wellfound.com/roles");
    });

    it("renders Wellfound search link when source contains 'angel'", () => {
      render(
        <JobDetailPanel
          {...defaultProps}
          job={{ ...baseJob, url: "", source_portal: "AngelList" }}
        />,
      );
      const link = screen.getByText(/Search on AngelList/);
      expect(link.closest("a")?.href).toContain("wellfound.com/roles");
    });
  });

  describe("match score color variants", () => {
    it("renders amber score (40-69 range)", () => {
      const amberMatch: MatchResult = {
        score: 55,
        breakdown: { skills: 50, technologies: 60, experience: 40, seniority: 70 },
        matchedSkills: ["React"],
        missingSkills: ["GraphQL"],
        matchedTech: ["react"],
        missingTech: ["graphql"],
      };
      render(
        <JobDetailPanel {...defaultProps} matchResult={amberMatch} />,
      );
      expect(screen.getByText("55%")).toBeInTheDocument();
      // All four breakdown labels should be present
      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByText("60%")).toBeInTheDocument();
      expect(screen.getByText("40%")).toBeInTheDocument();
      expect(screen.getByText("70%")).toBeInTheDocument();
    });

    it("renders red score (<40 range)", () => {
      const redMatch: MatchResult = {
        score: 25,
        breakdown: { skills: 20, technologies: 30, experience: 10, seniority: 40 },
        matchedSkills: [],
        missingSkills: ["React", "TypeScript"],
        matchedTech: [],
        missingTech: ["react", "typescript"],
      };
      render(
        <JobDetailPanel {...defaultProps} matchResult={redMatch} />,
      );
      expect(screen.getByText("25%")).toBeInTheDocument();
      // Verify missing tech section is shown
      expect(screen.getByText("Missing Tech")).toBeInTheDocument();
      expect(screen.getByText("react")).toBeInTheDocument();
    });

    it("does not crash when matched/missing arrays are empty", () => {
      const emptyMatch: MatchResult = {
        score: 50,
        breakdown: { skills: 50, technologies: 50, experience: 50, seniority: 50 },
        matchedSkills: [],
        missingSkills: [],
        matchedTech: [],
        missingTech: [],
      };
      render(
        <JobDetailPanel {...defaultProps} matchResult={emptyMatch} />,
      );
      // "50%" appears 5 times: 1 for score + 4 for breakdown values
      const scoreElements = screen.getAllByText("50%");
      expect(scoreElements).toHaveLength(5);
      // Matched/Missing tech sections should NOT be rendered when arrays are empty
      expect(screen.queryByText("Matched Tech")).not.toBeInTheDocument();
      expect(screen.queryByText("Missing Tech")).not.toBeInTheDocument();
    });
  });

  describe("modality badge variants", () => {
    it("renders warning badge for Hybrid modality", () => {
      render(
        <JobDetailPanel
          {...defaultProps}
          job={{ ...baseJob, modality: "Hybrid" }}
        />,
      );
      expect(screen.getByText("Hybrid")).toBeInTheDocument();
    });

    it("renders default badge for On-site modality", () => {
      render(
        <JobDetailPanel
          {...defaultProps}
          job={{ ...baseJob, modality: "On-site" }}
        />,
      );
      expect(screen.getByText("On-site")).toBeInTheDocument();
    });
  });

  describe("isGenerating prop", () => {
    it("shows button with loading state when isGenerating is true", () => {
      render(
        <JobDetailPanel {...defaultProps} hasCV={true} isGenerating={true} />,
      );
      // The generate button is the one with text "Generate CV for this offer"
      const generateBtn = screen.getByText("Generate CV for this offer");
      expect(generateBtn).toBeInTheDocument();
      // Button should be disabled when loading
      const btnElement = generateBtn.closest("button");
      expect(btnElement).toBeDisabled();
    });
  });
});
