import { describe, it, expect, beforeEach, vi } from "vitest";
import type { JobOffer } from "@/shared/types";

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
});
