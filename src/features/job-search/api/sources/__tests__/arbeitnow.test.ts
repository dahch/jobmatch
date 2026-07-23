import { describe, it, expect, vi } from "vitest";
import { fetchJobs } from "@/features/job-search/api/sources/arbeitnow";
import type { SearchProfile } from "@/shared/types";

const mockProfile: SearchProfile = {
  job_titles: ["Frontend Developer"],
  technologies: ["React", "TypeScript"],
  location: "Berlin",
  modality: "Remote",
  seniority: "Senior",
  exclude_keywords: [],
  extra_context: "",
};

const mockApiResponse = {
  data: [
    {
      slug: "senior-frontend-dev-123",
      title: "Senior Frontend Developer",
      company_name: "TechCorp",
      url: "https://arbeitnow.com/job/senior-frontend-dev-123",
      location: "Berlin, Germany",
      remote: true,
      created_at: "2025-07-10T12:00:00Z",
      description: "We are looking for a Senior Frontend Developer with React experience.",
      tags: ["React", "TypeScript", "CSS"],
      job_types: ["remote", "full-time"],
      company_logo: null,
    },
    {
      slug: "frontend-dev-456",
      title: "Frontend Developer",
      company_name: "WebCo",
      url: "https://arbeitnow.com/job/frontend-dev-456",
      location: "Remote",
      remote: true,
      created_at: "2025-07-09T08:00:00Z",
      description: "Join our frontend team.",
      tags: ["React", "JavaScript"],
      job_types: ["remote"],
      company_logo: "https://logo.example.com/logo.png",
    },
  ],
  meta: { count: 2, page: 1, last_page: 1 },
};

describe("arbeitnow adapter", () => {
  it("maps API response to JobOffer[]", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockApiResponse), { status: 200 }),
    );

    const jobs = await fetchJobs(mockProfile);

    expect(jobs).toHaveLength(2);
    expect(jobs[0].title).toBe("Senior Frontend Developer");
    expect(jobs[0].company).toBe("TechCorp");
    expect(jobs[0].location).toBe("Berlin, Germany");
    expect(jobs[0].modality).toBe("Remote");
    expect(jobs[0].url).toBe("https://arbeitnow.com/job/senior-frontend-dev-123");
    expect(jobs[0].source_portal).toBe("Arbeitnow");
    expect(jobs[0].posted_at).toBe("2025-07-10");
    expect(jobs[0].extracted_requirements.technologies).toEqual(["React", "TypeScript", "CSS"]);
    expect(jobs[0].ats_keywords).toEqual(["React", "TypeScript", "CSS"]);
    expect(jobs[0].status).toBe("new");
  });

  it("sets modality based on remote flag", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            {
              slug: "test-job",
              title: "Test",
              company_name: "TestCo",
              url: "",
              location: "Office",
              remote: false,
              created_at: null,
              description: "",
              tags: [],
              job_types: ["on-site"],
              company_logo: null,
            },
          ],
          meta: { count: 1, page: 1, last_page: 1 },
        }),
        { status: 200 },
      ),
    );

    const jobs = await fetchJobs(mockProfile);
    expect(jobs[0].modality).toBe("On-site");
  });

  it("sets default values for empty fields", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            {
              slug: "empty-job",
              title: "",
              company_name: "",
              url: "",
              location: "",
              remote: false,
              created_at: null,
              description: "",
              tags: [],
              job_types: [],
              company_logo: null,
            },
          ],
          meta: { count: 1, page: 1, last_page: 1 },
        }),
        { status: 200 },
      ),
    );

    const jobs = await fetchJobs(mockProfile);
    expect(jobs[0].title).toBe("");
    expect(jobs[0].company).toBe("");
    expect(jobs[0].location).toBe("Unknown");
    expect(jobs[0].modality).toBe("Unknown");
  });

  it("throws on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500, statusText: "Internal Server Error" }),
    );

    await expect(fetchJobs(mockProfile)).rejects.toThrow(
      "Arbeitnow API error 500: Internal Server Error",
    );
  });

  it("builds search query from profile", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockApiResponse), { status: 200 }),
    );

    const profileWithLocation: SearchProfile = {
      ...mockProfile,
      location: "Berlin",
    };

    await fetchJobs(profileWithLocation);

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("search=Frontend+Developer");
    expect(calledUrl).toContain("location=Berlin");
  });

  it("returns empty string when no profile params", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockApiResponse), { status: 200 }),
    );

    const emptyProfile: SearchProfile = {
      job_titles: [],
      technologies: [],
      location: "",
      modality: "Any",
      seniority: "Any",
      exclude_keywords: [],
      extra_context: "",
    };

    await fetchJobs(emptyProfile);

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("?");
    expect(calledUrl).toBe("https://www.arbeitnow.com/api/job-board-api");
  });

  it("handles null job_types and tags gracefully", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            {
              slug: "null-fields",
              title: "Test",
              company_name: "TestCo",
              url: "",
              location: "Remote",
              remote: false,
              created_at: null,
              description: "",
              tags: null,
              job_types: null,
              company_logo: null,
            },
          ],
          meta: { count: 1, page: 1, last_page: 1 },
        }),
        { status: 200 },
      ),
    );

    const jobs = await fetchJobs(mockProfile);
    expect(jobs[0].extracted_requirements.technologies).toEqual([]);
    expect(jobs[0].ats_keywords).toEqual([]);
    expect(jobs[0].modality).toBe("Unknown");
  });

  it("handles missing data field in response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ meta: { count: 0 } }), { status: 200 }),
    );

    const jobs = await fetchJobs(mockProfile);
    expect(jobs).toEqual([]);
  });

  it("maps hybrid modality when job_types includes hybrid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({
        data: [{
          slug: "hybrid-job",
          title: "Hybrid Dev",
          company_name: "HybridCo",
          url: "",
          location: "Berlin",
          remote: false,
          created_at: null,
          description: "",
          tags: [],
          job_types: ["hybrid", "full-time"],
          company_logo: null,
        }],
        meta: { count: 1, page: 1, last_page: 1 },
      }), { status: 200 }),
    );

    const jobs = await fetchJobs(mockProfile);
    expect(jobs[0].modality).toBe("Hybrid");
  });

  it("aborts via signal", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new DOMException("Aborted", "AbortError"),
    );

    const controller = new AbortController();
    controller.abort();

    await expect(
      fetchJobs(mockProfile, controller.signal),
    ).rejects.toThrow("Aborted");
  });
});
