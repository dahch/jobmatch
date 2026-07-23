import type { JobOffer, SearchProfile } from "@/shared/types";
import { generateId } from "@/shared/lib/utils";

interface ArbeitnowJob {
  slug: string;
  title: string;
  company_name: string;
  url: string;
  location: string;
  remote: boolean;
  created_at: string;
  description: string;
  tags: string[];
  job_types: string[];
  company_logo: string | null;
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
  meta: {
    count: number;
    page: number;
    last_page: number;
  };
}

function mapModality(remote: boolean, jobTypes: string[]): JobOffer["modality"] {
  if (remote) return "Remote";
  const types = jobTypes.map((t) => t.toLowerCase());
  if (types.includes("hybrid")) return "Hybrid";
  if (types.includes("on-site") || types.includes("onsite")) return "On-site";
  return "Unknown";
}

function mapJob(raw: ArbeitnowJob): JobOffer {
  const postedAt = raw.created_at
    ? new Date(raw.created_at).toISOString().slice(0, 10)
    : undefined;

  return {
    id: generateId(),
    title: raw.title,
    company: raw.company_name,
    location: raw.location || "Unknown",
    modality: mapModality(raw.remote, raw.job_types || []),
    url: raw.url || "",
    source_portal: "Arbeitnow",
    posted_at: postedAt,
    raw_description: raw.description || "",
    extracted_requirements: {
      must_have: [],
      nice_to_have: [],
      technologies: raw.tags || [],
      years_experience: undefined,
      seniority_level: undefined,
      languages: [],
    },
    ats_keywords: raw.tags || [],
    status: "new",
  };
}

function buildQuery(profile: SearchProfile): string {
  const params = new URLSearchParams();

  if (profile.job_titles.length > 0) {
    params.set("search", profile.job_titles.join(" "));
  }

  if (profile.location) {
    params.set("location", profile.location);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchJobs(
  profile: SearchProfile,
  signal?: AbortSignal,
): Promise<JobOffer[]> {
  const query = buildQuery(profile);
  const url = `https://www.arbeitnow.com/api/job-board-api${query}`;

  const res = await fetch(url, { signal });

  if (!res.ok) {
    throw new Error(`Arbeitnow API error ${res.status}: ${res.statusText}`);
  }

  const json: ArbeitnowResponse = await res.json();
  const rawJobs = json.data || [];

  return rawJobs.map(mapJob);
}
