import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchJobs } from "@/features/job-search/api/sources/serpapi";
import type { SearchProfile, JobOffer } from "@/shared/types";

const mockProfile: SearchProfile = {
  job_titles: ["Software Engineer"],
  technologies: ["React", "TypeScript"],
  location: "Berlin",
  modality: "Remote",
  seniority: "Senior",
  exclude_keywords: [],
  extra_context: "",
};

const mockSerpApiResponse = {
  search_metadata: { status: "Success" },
  jobs_results: [
    {
      title: "Senior React Developer",
      company_name: "TechCorp GmbH",
      location: "Berlin, Germany",
      via: "LinkedIn",
      description: "Build great UIs with React and TypeScript.",
      extensions: ["Full-time", "Remote"],
      detected_extensions: {
        posted_at: "3 days ago",
        schedule_type: "Full-time",
        salary: "€80,000 a year",
        benefits: ["Health insurance", "30 days vacation"],
      },
      job_id: "abc123",
      apply_options: [
        { title: "LinkedIn", link: "https://linkedin.com/jobs/1" },
        { title: "Indeed", link: "https://indeed.com/jobs/1" },
      ],
    },
    {
      title: "Frontend Engineer",
      company_name: "WebCo",
      location: "Remote",
      description: "Frontend position.",
      extensions: [],
      apply_options: [],
    },
  ],
};

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("serpapi adapter", () => {
  it("returns empty array when no API key is set", async () => {
    const jobs = await fetchJobs(mockProfile);
    expect(jobs).toEqual([]);
  });

  it("maps SerpApi response to JobOffer[]", async () => {
    localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockSerpApiResponse), { status: 200 }),
    );

    const jobs = await fetchJobs(mockProfile);

    expect(jobs).toHaveLength(2);

    const first = jobs[0] as JobOffer;
    expect(first.title).toBe("Senior React Developer");
    expect(first.company).toBe("TechCorp GmbH");
    expect(first.location).toBe("Berlin, Germany");
    expect(first.modality).toBe("Remote");
    expect(first.source_portal).toBe("Google Jobs (via LinkedIn)");
    expect(first.url).toBe("https://linkedin.com/jobs/1");
    expect(first.apply_options).toHaveLength(2);
    expect(first.apply_options![0].title).toBe("LinkedIn");
    expect(first.apply_options![1].link).toBe("https://indeed.com/jobs/1");
    expect(first.salary).toBe("€80,000 a year");
    expect(first.schedule_type).toBe("Full-time");
    expect(first.benefits).toEqual(["Health insurance", "30 days vacation"]);
    expect(first.via).toBe("LinkedIn");

    const second = jobs[1] as JobOffer;
    expect(second.title).toBe("Frontend Engineer");
    expect(second.modality).toBe("Unknown");
    expect(second.url).toBe("");
  });

  it("sends params to proxy", async () => {
    localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("my-key"));
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ search_metadata: { status: "Success" }, jobs_results: [] }), {
        status: 200,
      }),
    );

    await fetchJobs(mockProfile);

    const callUrl = fetchSpy.mock.calls[0][0] as string;
    expect(callUrl).toBe("/api/proxy");

    const callBody = JSON.parse(
      (fetchSpy.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(callBody.source).toBe("serpapi");
    expect(callBody.params.api_key).toBe("my-key");
    expect(callBody.params.q).toContain("Software Engineer");
    expect(callBody.params.q).toContain("React");
    expect(callBody.params.location).toBe("Berlin");
    expect(callBody.params.hl).toBe("de");
    expect(callBody.params.gl).toBe("de");
    expect(callBody.params.google_domain).toBe("google.de");
  });

  it("sends a non-empty q even when profile has no titles or technologies", async () => {
    localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("my-key"));
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ search_metadata: { status: "Success" }, jobs_results: [] }), {
        status: 200,
      }),
    );

    const emptyProfile: SearchProfile = {
      ...mockProfile,
      job_titles: [],
      technologies: [],
    };

    await fetchJobs(emptyProfile);

    const callBody = JSON.parse(
      (fetchSpy.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(callBody.params.q).toBeTruthy();
    expect(callBody.params.q).toContain("jobs");
  });

  it("falls back to jobs in location when only location is provided", async () => {
    localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("my-key"));
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ search_metadata: { status: "Success" }, jobs_results: [] }), {
        status: 200,
      }),
    );

    const locationOnlyProfile: SearchProfile = {
      ...mockProfile,
      job_titles: [],
      technologies: [],
      location: "Barcelona",
    };

    await fetchJobs(locationOnlyProfile);

    const callBody = JSON.parse(
      (fetchSpy.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(callBody.params.q).toContain("jobs");
    expect(callBody.params.q).toContain("Barcelona");
  });

  it("infers Spanish locale for Barcelona", async () => {
    localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("my-key"));
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ search_metadata: { status: "Success" }, jobs_results: [] }), {
        status: 200,
      }),
    );

    const barcelonaProfile: SearchProfile = {
      ...mockProfile,
      location: "Barcelona",
    };

    await fetchJobs(barcelonaProfile);

    const callBody = JSON.parse(
      (fetchSpy.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(callBody.params.gl).toBe("es");
    expect(callBody.params.hl).toBe("es");
    expect(callBody.params.google_domain).toBe("google.es");
  });

  it("fails silently on 429 (quota exhausted)", async () => {
    localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Quota exceeded" }), { status: 429 }),
    );

    const jobs = await fetchJobs(mockProfile);
    expect(jobs).toEqual([]);
  });

  it("throws on 401/403 (invalid key)", async () => {
    localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );

    await expect(fetchJobs(mockProfile)).rejects.toThrow(
      "SerpApi: invalid API key — check your key in Settings",
    );
  });

  it("returns empty for errored SerpApi response", async () => {
    localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ search_metadata: { status: "Error" }, error: "Bad request" }), {
        status: 200,
      }),
    );

    const jobs = await fetchJobs(mockProfile);
    expect(jobs).toEqual([]);
  });

  it("handles empty jobs_results", async () => {
    localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ search_metadata: { status: "Success" }, jobs_results: [] }), {
        status: 200,
      }),
    );

    const jobs = await fetchJobs(mockProfile);
    expect(jobs).toEqual([]);
  });

  it("throws on server errors (500)", async () => {
    localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 }),
    );

    await expect(fetchJobs(mockProfile)).rejects.toThrow("SerpApi error 500");
  });

  describe("mapModality from extensions", () => {
    it("maps hybrid from extensions", async () => {
      localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({
          search_metadata: { status: "Success" },
          jobs_results: [{
            title: "Hybrid Job",
            company_name: "Co",
            location: "Berlin",
            description: "Hybrid position",
            extensions: ["Full-time", "Hybrid"],
          }],
        }), { status: 200 }),
      );

      const jobs = await fetchJobs(mockProfile);
      expect(jobs[0].modality).toBe("Hybrid");
    });

    it("maps on-site from extensions", async () => {
      localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({
          search_metadata: { status: "Success" },
          jobs_results: [{
            title: "On-site Job",
            company_name: "Co",
            location: "Berlin",
            description: "Office job",
            extensions: ["Full-time", "On-site"],
          }],
        }), { status: 200 }),
      );

      const jobs = await fetchJobs(mockProfile);
      expect(jobs[0].modality).toBe("On-site");
    });

    it("maps on-site from 'onsite' variant in extensions", async () => {
      localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({
          search_metadata: { status: "Success" },
          jobs_results: [{
            title: "On-site Job",
            company_name: "Co",
            location: "Berlin",
            description: "Office job",
            extensions: ["onsite"],
          }],
        }), { status: 200 }),
      );

      const jobs = await fetchJobs(mockProfile);
      expect(jobs[0].modality).toBe("On-site");
    });

    it("returns Unknown for undefined extensions", async () => {
      localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({
          search_metadata: { status: "Success" },
          jobs_results: [{
            title: "No Ext Job",
            company_name: "Co",
            location: "Berlin",
            description: "No extensions field",
          }],
        }), { status: 200 }),
      );

      const jobs = await fetchJobs(mockProfile);
      expect(jobs[0].modality).toBe("Unknown");
    });

    it("returns Unknown for non-matching extensions (no remote/hybrid/on-site)", async () => {
      localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({
          search_metadata: { status: "Success" },
          jobs_results: [{
            title: "Office Job",
            company_name: "Co",
            location: "Berlin",
            description: "Regular office job",
            extensions: ["Full-time", "Permanent"],
          }],
        }), { status: 200 }),
      );

      const jobs = await fetchJobs(mockProfile);
      expect(jobs[0].modality).toBe("Unknown");
    });
  });

  it("falls back to generic q when no job titles or technologies", async () => {
    localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ search_metadata: { status: "Success" }, jobs_results: [] }), { status: 200 }),
    );

    const emptyProfile: SearchProfile = {
      job_titles: [],
      technologies: [],
      location: "",
      modality: "Remote",
      seniority: "Any",
      exclude_keywords: [],
      extra_context: "",
    };

    await fetchJobs(emptyProfile);

    const callBody = JSON.parse(
      (fetchSpy.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(callBody.params.q).toBe("jobs");
    expect(callBody.params.location).toBeUndefined();
  });

  it("handles missing jobs_results in response", async () => {
    localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ search_metadata: { status: "Success" } }), { status: 200 }),
    );

    const jobs = await fetchJobs(mockProfile);
    expect(jobs).toEqual([]);
  });

  it("falls back to 'Unknown' location and empty description for missing fields", async () => {
    localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({
        search_metadata: { status: "Success" },
        jobs_results: [{
          title: "Minimal Job",
          company_name: "MinCo",
          description: "",
          extensions: [],
        }],
      }), { status: 200 }),
    );

    const jobs = await fetchJobs(mockProfile);
    expect(jobs[0].location).toBe("Unknown");
    expect(jobs[0].raw_description).toBe("");
  });

  it("falls back to statusText when error response has no error field", async () => {
    localStorage.setItem("jobmatch-serpapi-key", JSON.stringify("test-key"));
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500, statusText: "Bad Gateway" }),
    );

    await expect(fetchJobs(mockProfile)).rejects.toThrow(
      "SerpApi error 500: Bad Gateway",
    );
  });

  describe("getSerpApiKey edge cases", () => {
    it("returns empty string for malformed localStorage JSON", async () => {
      localStorage.setItem("jobmatch-serpapi-key", "{bad-json");
      // Should not throw, returns ""
      const result = await fetchJobs(mockProfile);
      expect(result).toEqual([]);
    });
  });
});
