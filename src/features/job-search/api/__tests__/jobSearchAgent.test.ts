import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchJobs } from "@/features/job-search/api/jobSearchAgent";
import type { SearchProfile } from "@/shared/types";

// DACH location so Arbeitnow is included; no SerpApi key so it returns []
const mockProfile: SearchProfile = {
  job_titles: ["Developer"],
  technologies: [],
  location: "Berlin",
  modality: "Any",
  seniority: "Any",
  exclude_keywords: [],
  extra_context: "",
};

const arbeitnowResponse = {
  data: [
    {
      slug: "job-1",
      title: "Frontend Developer",
      company_name: "TechCorp",
      url: "https://arbeitnow.com/job/job-1",
      location: "Remote",
      remote: true,
      created_at: "2025-07-10T12:00:00Z",
      description: "React developer needed",
      tags: ["React"],
      job_types: ["remote"],
      company_logo: null,
    },
  ],
  meta: { count: 1, page: 1, last_page: 1 },
};

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("searchJobs", () => {
  it("returns results from Arbeitnow (DACH region)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = typeof url === "string" ? url : "";
      if (urlStr.includes("arbeitnow.com")) {
        return new Response(JSON.stringify(arbeitnowResponse), { status: 200 });
      }
      return new Response(null, { status: 404 });
    });

    const jobs = await searchJobs(mockProfile);

    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe("Frontend Developer");
  });

  it("deduplicates jobs with same title+company+location key", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = typeof url === "string" ? url : "";
      if (urlStr.includes("arbeitnow.com")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                ...arbeitnowResponse.data[0],
              },
              {
                slug: "job-2",
                title: "Frontend Developer",
                company_name: "TechCorp",
                url: "https://arbeitnow.com/job/job-2",
                location: "Remote",
                remote: true,
                created_at: "2025-07-11T12:00:00Z",
                description: "Another React developer needed",
                tags: ["React"],
                job_types: ["remote"],
                company_logo: null,
              },
              {
                slug: "job-3",
                title: "Backend Developer",
                company_name: "ServerCo",
                url: "https://arbeitnow.com/job/job-3",
                location: "Remote",
                remote: false,
                created_at: "2025-07-11T12:00:00Z",
                description: "Backend developer needed",
                tags: ["Node"],
                job_types: ["full_time"],
                company_logo: null,
              },
            ],
            meta: { count: 3, page: 1, last_page: 1 },
          }),
          { status: 200 },
        );
      }
      return new Response(null, { status: 404 });
    });

    const jobs = await searchJobs(mockProfile);

    expect(jobs).toHaveLength(2);
    expect(jobs.map((j) => j.title).sort()).toEqual([
      "Backend Developer",
      "Frontend Developer",
    ]);
  });

  it("excludes Arbeitnow for non-DACH location", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 404 }),
    );

    const nonDACHProfile: SearchProfile = {
      ...mockProfile,
      location: "Barcelona",
    };

    const jobs = await searchJobs(nonDACHProfile);

    // No SerpApi key + non-DACH = no sources
    expect(jobs).toEqual([]);
  });

  it("returns empty array when all sources fail", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const jobs = await searchJobs(mockProfile);

    expect(jobs).toEqual([]);
  });

  it("calls onProgress callback with status updates", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = typeof url === "string" ? url : "";
      if (urlStr.includes("arbeitnow.com")) {
        return new Response(JSON.stringify(arbeitnowResponse), { status: 200 });
      }
      return new Response(null, { status: 404 });
    });

    const onProgress = vi.fn();

    await searchJobs(mockProfile, onProgress);

    expect(onProgress.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(onProgress.mock.calls[0][0].phase).toContain("Searching");
    const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1][0];
    expect(lastCall.phase).toContain("complete");
  });

  it("handles aborted signal gracefully", async () => {
    const controller = new AbortController();
    controller.abort();

    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new DOMException("The operation was aborted", "AbortError"),
    );

    const jobs = await searchJobs(mockProfile, undefined, controller.signal);

    // Aborted sources return empty (Promise.allSettled catches rejection)
    expect(jobs).toEqual([]);
  });

  it("returns empty array when all sources return empty (not fail)", async () => {
    // SerpApi with key returns empty results, Arbeitnow returns empty results
    localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = typeof url === "string" ? url : "";
      if (urlStr.includes("/api/proxy")) {
        return new Response(JSON.stringify({
          search_metadata: { status: "Success" },
          jobs_results: [],
        }), { status: 200 });
      }
      if (urlStr.includes("arbeitnow.com")) {
        return new Response(JSON.stringify({
          data: [],
          meta: { count: 0, page: 1, last_page: 1 },
        }), { status: 200 });
      }
      return new Response(null, { status: 404 });
    });

    const jobs = await searchJobs(mockProfile);
    expect(jobs).toEqual([]);
  });

  it("deduplicates jobs with undefined title/company/location using __MISSING__ key", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = typeof url === "string" ? url : "";
      if (urlStr.includes("arbeitnow.com")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                slug: "job-missing",
                title: undefined,
                company_name: undefined,
                url: "",
                location: undefined,
                remote: false,
                created_at: null,
                description: "",
                tags: [],
                job_types: [],
                company_logo: null,
              },
              {
                slug: "job-missing-dup",
                title: undefined,
                company_name: undefined,
                url: "",
                location: undefined,
                remote: false,
                created_at: null,
                description: "",
                tags: [],
                job_types: [],
                company_logo: null,
              },
              {
                slug: "job-normal",
                title: "Normal Title",
                company_name: "Normal Co",
                url: "",
                location: "Berlin",
                remote: false,
                created_at: null,
                description: "",
                tags: [],
                job_types: [],
                company_logo: null,
              },
            ],
            meta: { count: 3, page: 1, last_page: 1 },
          }),
          { status: 200 },
        );
      }
      return new Response(null, { status: 404 });
    });

    const jobs = await searchJobs(mockProfile);
    // Two unique keys: __MISSING__|__MISSING__|__MISSING__ and Normal Title|Normal Co|Berlin
    expect(jobs).toHaveLength(2);
  });

  it("includes partial failure info in progress when one source fails", async () => {
    // Setup: mock SerpApi through proxy with API key (works) + Arbeitnow (fails)
    localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = typeof url === "string" ? url : "";
      if (urlStr.includes("/api/proxy")) {
        return new Response(JSON.stringify({
          search_metadata: { status: "Success" },
          jobs_results: [{
            title: "Found Job",
            company_name: "Co",
            location: "Remote",
            description: "Test",
          }],
        }), { status: 200 });
      }
      if (urlStr.includes("arbeitnow.com")) {
        throw new Error("Arbeitnow down");
      }
      return new Response(null, { status: 404 });
    });

    const onProgress = vi.fn();
    await searchJobs(mockProfile, onProgress);

    const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1][0];
    expect(lastCall.phase).toContain("partial");
    expect(lastCall.detail).toContain("failed");
  });
});
