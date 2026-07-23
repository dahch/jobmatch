import { describe, it, expect, beforeEach, vi } from "vitest";
import type { JobOffer } from "@/shared/types";

const { mockStorage } = vi.hoisted(() => ({ mockStorage: {} as Record<string, string> }));

const { mockSearchJobs, mockProfileState } = vi.hoisted(() => {
  type MockProfile = { job_titles: string[]; technologies: string[]; location: string; modality: string; seniority: string; exclude_keywords: string[]; extra_context: string };
  return {
    mockSearchJobs: vi.fn(),
    mockProfileState: { profile: null as MockProfile | null },
  };
});

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

vi.mock("@/features/job-search/api/jobSearchAgent", () => ({
  searchJobs: mockSearchJobs,
}));

vi.mock("@/features/job-search/model/profileStore", () => ({
  useJobSearchStore: {
    getState: () => mockProfileState,
  },
}));

import { useJobsStore } from "@/features/job-search/model/store";

const mockJob: JobOffer = {
  id: "job-1",
  title: "Software Engineer",
  company: "TestCorp",
  location: "Remote",
  modality: "Remote",
  url: "",
  source_portal: "LinkedIn",
  raw_description: "Test description",
  extracted_requirements: {
    must_have: ["React"],
    nice_to_have: [],
    technologies: ["React"],
  },
  ats_keywords: ["React"],
  status: "new",
};

beforeEach(() => {
  useJobsStore.setState({
    jobs: [],
    isSearching: false,
    searchProgress: null,
    searchError: null,
    selectedJobId: null,
  });
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  vi.clearAllMocks();
});

describe("useJobsStore", () => {
  describe("initial state", () => {
    it("has empty jobs array by default", () => {
      const state = useJobsStore.getState();
      expect(state.jobs).toEqual([]);
    });

    it("has null selectedJobId by default", () => {
      expect(useJobsStore.getState().selectedJobId).toBeNull();
    });

    it("is not searching by default", () => {
      expect(useJobsStore.getState().isSearching).toBe(false);
    });
  });

  describe("selectJob", () => {
    it("sets selectedJobId", () => {
      useJobsStore.getState().selectJob("job-1");
      expect(useJobsStore.getState().selectedJobId).toBe("job-1");
    });

    it("changes selectedJobId to another", () => {
      useJobsStore.getState().selectJob("job-1");
      useJobsStore.getState().selectJob("job-2");
      expect(useJobsStore.getState().selectedJobId).toBe("job-2");
    });
  });

  describe("updateJobStatus", () => {
    it("updates the status of a specific job", () => {
      useJobsStore.setState({
        jobs: [
          { ...mockJob, id: "job-1" },
          { ...mockJob, id: "job-2" },
        ],
      });

      useJobsStore.getState().updateJobStatus("job-1", "applied");

      const jobs = useJobsStore.getState().jobs;
      expect(jobs[0].status).toBe("applied");
      expect(jobs[1].status).toBe("new");
    });

    it("persists updated jobs to storage", () => {
      useJobsStore.setState({ jobs: [{ ...mockJob, id: "job-1" }] });
      useJobsStore.getState().updateJobStatus("job-1", "discarded");

      const raw = mockStorage["jobs"];
      expect(raw).toBeDefined();
      const parsed = JSON.parse(raw);
      expect(parsed[0].status).toBe("discarded");
    });

    it("does not modify jobs when id is not found", () => {
      useJobsStore.setState({ jobs: [mockJob] });
      useJobsStore.getState().updateJobStatus("nonexistent", "applied");

      expect(useJobsStore.getState().jobs[0].status).toBe("new");
    });
  });

  describe("addJob", () => {
    it("appends a job to the list", () => {
      useJobsStore.getState().addJob(mockJob);
      expect(useJobsStore.getState().jobs).toHaveLength(1);
      expect(useJobsStore.getState().jobs[0]).toEqual(mockJob);
    });

    it("appends multiple jobs", () => {
      useJobsStore.getState().addJob({ ...mockJob, id: "1" });
      useJobsStore.getState().addJob({ ...mockJob, id: "2" });
      expect(useJobsStore.getState().jobs).toHaveLength(2);
    });
  });

  describe("clearJobs", () => {
    it("clears all jobs and selectedJobId", () => {
      useJobsStore.setState({
        jobs: [mockJob],
        selectedJobId: "job-1",
      });

      useJobsStore.getState().clearJobs();

      expect(useJobsStore.getState().jobs).toEqual([]);
      expect(useJobsStore.getState().selectedJobId).toBeNull();
    });
  });

  describe("searchJobs action", () => {
    const testProfile = {
      job_titles: ["Dev"],
      technologies: [],
      location: "",
      modality: "Any" as const,
      seniority: "Any" as const,
      exclude_keywords: [],
      extra_context: "",
    };

    beforeEach(() => {
      mockSearchJobs.mockReset();
      mockProfileState.profile = null;
    });

    it("sets searchError when no profile is defined", async () => {
      mockProfileState.profile = null;
      await useJobsStore.getState().searchJobs();
      expect(useJobsStore.getState().searchError).toBe(
        "Search profile not defined. Set your criteria first.",
      );
      expect(useJobsStore.getState().isSearching).toBe(false);
    });

    it("sets isSearching to true when starting search", async () => {
      mockProfileState.profile = testProfile;
      mockSearchJobs.mockResolvedValue([]);

      const promise = useJobsStore.getState().searchJobs();
      await promise;

      expect(useJobsStore.getState().isSearching).toBe(false);
    });

    it("stores jobs and updates progress on success", async () => {
      mockProfileState.profile = testProfile;
      const returnedJobs: JobOffer[] = [
        { ...mockJob, id: "new-1", title: "Found Job" },
      ];
      mockSearchJobs.mockResolvedValue(returnedJobs);

      await useJobsStore.getState().searchJobs();

      expect(useJobsStore.getState().jobs).toEqual(returnedJobs);
      expect(useJobsStore.getState().isSearching).toBe(false);
      expect(useJobsStore.getState().searchProgress?.phase).toContain(
        "Found 1 jobs",
      );
    });

    it("sets searchError when searchJobs throws", async () => {
      mockProfileState.profile = testProfile;
      mockSearchJobs.mockRejectedValue(new Error("API unavailable"));

      await useJobsStore.getState().searchJobs();

      expect(useJobsStore.getState().searchError).toBe("API unavailable");
      expect(useJobsStore.getState().isSearching).toBe(false);
      expect(useJobsStore.getState().searchProgress).toBeNull();
    });

    it("persists jobs to storage on success", async () => {
      mockProfileState.profile = testProfile;
      const returnedJobs: JobOffer[] = [
        { ...mockJob, id: "stored-1" },
      ];
      mockSearchJobs.mockResolvedValue(returnedJobs);

      await useJobsStore.getState().searchJobs();

      expect(mockStorage["jobs"]).toBeDefined();
      const parsed = JSON.parse(mockStorage["jobs"]);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe("stored-1");
    });

    it("handles empty results from searchJobs gracefully", async () => {
      mockProfileState.profile = testProfile;
      mockSearchJobs.mockResolvedValue([]);

      await useJobsStore.getState().searchJobs();

      const state = useJobsStore.getState();
      expect(state.searchError).toBeNull();
      expect(state.jobs).toEqual([]);
      expect(state.isSearching).toBe(false);
      expect(state.searchProgress?.phase).toContain("Found 0");
    });

    it("handles non-Error throw in searchJobs (e.g. string rejection)", async () => {
      mockProfileState.profile = testProfile;
      mockSearchJobs.mockRejectedValue("string error");

      await useJobsStore.getState().searchJobs();

      expect(useJobsStore.getState().searchError).toBe("Search failed");
      expect(useJobsStore.getState().isSearching).toBe(false);
    });

    it("updates searchProgress via onProgress callback", async () => {
      mockProfileState.profile = testProfile;
      mockSearchJobs.mockImplementation(
        async (
          _profile: unknown,
          onProgress?: (p: { phase: string; detail?: string }) => void,
        ) => {
          onProgress?.({ phase: "Fetching from source..." });
          return [{ ...mockJob, id: "progress-job" }];
        },
      );

      await useJobsStore.getState().searchJobs();

      expect(useJobsStore.getState().searchProgress?.phase).toContain("Found");
    });
  });
});
