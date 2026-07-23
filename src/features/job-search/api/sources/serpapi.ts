import type { JobOffer, SearchProfile } from "@/shared/types";
import { generateId } from "@/shared/lib/utils";
import { getStorageItem } from "@/shared/lib/storage";

interface SerpApiApplyOption {
  title: string;
  link: string;
}

interface SerpApiDetectedExtensions {
  posted_at?: string;
  schedule_type?: string;
  salary?: string;
  benefits?: string[];
}

interface SerpApiJobResult {
  title: string;
  company_name: string;
  location: string;
  via?: string;
  description: string;
  extensions?: string[];
  detected_extensions?: SerpApiDetectedExtensions;
  job_id?: string;
  apply_options?: SerpApiApplyOption[];
}

interface SerpApiResponse {
  search_metadata: { status: string };
  jobs_results?: SerpApiJobResult[];
  error?: string;
}

function mapModality(extensions: string[] | undefined): JobOffer["modality"] {
  if (!extensions || extensions.length === 0) return "Unknown";
  const joined = extensions.join(" ").toLowerCase();
  if (joined.includes("remote")) return "Remote";
  if (joined.includes("hybrid")) return "Hybrid";
  if (joined.includes("on-site") || joined.includes("onsite")) return "On-site";
  return "Unknown";
}

function mapJob(raw: SerpApiJobResult): JobOffer {
  const detected = raw.detected_extensions;

  return {
    id: generateId(),
    title: raw.title,
    company: raw.company_name,
    location: raw.location || "Unknown",
    modality: mapModality(raw.extensions),
    url: raw.apply_options?.[0]?.link || "",
    source_portal: raw.via ? `Google Jobs (via ${raw.via})` : "Google Jobs",
    posted_at: detected?.posted_at,
    raw_description: raw.description || "",
    extracted_requirements: {
      must_have: [],
      nice_to_have: [],
      technologies: raw.extensions || [],
      years_experience: undefined,
      seniority_level: undefined,
      languages: [],
    },
    ats_keywords: [],
    status: "new",
    apply_options: raw.apply_options?.map((o) => ({ title: o.title, link: o.link })),
    salary: detected?.salary,
    schedule_type: detected?.schedule_type,
    benefits: detected?.benefits,
    via: raw.via,
  };
}

interface SerpApiLocale {
  gl: string;
  google_domain: string;
  hl: string;
}

function inferLocale(location: string): SerpApiLocale {
  const loc = location.toLowerCase();

  const countryRules: { patterns: string[]; locale: SerpApiLocale }[] = [
    {
      patterns: ["spain", "españa", "espa", "barcelona", "madrid", "valencia", "sevilla", "bilbao"],
      locale: { gl: "es", google_domain: "google.es", hl: "es" },
    },
    {
      patterns: ["germany", "deutschland", "berlin", "munich", "münchen", "hamburg", "cologne", "köln", "frankfurt", "stuttgart"],
      locale: { gl: "de", google_domain: "google.de", hl: "de" },
    },
    {
      patterns: ["austria", "österreich", "vienna", "wien"],
      locale: { gl: "at", google_domain: "google.at", hl: "de" },
    },
    {
      patterns: ["switzerland", "schweiz", "zurich", "zürich", "geneva", "genf", "bern"],
      locale: { gl: "ch", google_domain: "google.ch", hl: "de" },
    },
    {
      patterns: ["united kingdom", "uk", "england", "london", "manchester", "birmingham"],
      locale: { gl: "gb", google_domain: "google.co.uk", hl: "en" },
    },
    {
      patterns: ["france", "paris", "lyon", "marseille", "toulouse"],
      locale: { gl: "fr", google_domain: "google.fr", hl: "fr" },
    },
    {
      patterns: ["united states", "usa", "austin", "new york", "san francisco", "los angeles", "chicago", "boston", "seattle"],
      locale: { gl: "us", google_domain: "google.com", hl: "en" },
    },
  ];

  for (const rule of countryRules) {
    if (rule.patterns.some((p) => loc.includes(p))) {
      return rule.locale;
    }
  }

  return { gl: "us", google_domain: "google.com", hl: "en" };
}

function buildParams(profile: SearchProfile) {
  const parts: string[] = [];
  if (profile.job_titles.length > 0) {
    parts.push(profile.job_titles.join(" "));
  }
  if (profile.technologies.length > 0) {
    parts.push(profile.technologies.join(" "));
  }

  // SerpApi requires a non-empty `q` parameter. If the user has not supplied
  // job titles or technologies, fall back to a generic query so the search still
  // executes against the requested location.
  const q = parts.join(" ") || (profile.location ? `jobs in ${profile.location}` : "jobs");
  const locale = inferLocale(profile.location);

  return {
    q,
    location: profile.location || undefined,
    ...locale,
  };
}

export async function fetchJobs(
  profile: SearchProfile,
  signal?: AbortSignal,
): Promise<JobOffer[]> {
  const params = buildParams(profile);
  const apiKey = getSerpApiKey();

  if (!apiKey) return [];

  const res = await fetch("/api/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "serpapi",
      params: { ...params, api_key: apiKey },
    }),
    signal,
  });

  if (!res.ok) {
    // 429 indicates quota exhausted — fail silently, don't retry
    if (res.status === 429) return [];

    const err = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "SerpApi: invalid API key — check your key in Settings",
      );
    }

    throw new Error(
      `SerpApi error ${res.status}: ${(err as { error?: string }).error || res.statusText}`,
    );
  }

  const json: SerpApiResponse = await res.json();

  if (json.error) {
    return [];
  }

  const rawJobs = json.jobs_results || [];

  return rawJobs.map(mapJob);
}

function getSerpApiKey(): string {
  return getStorageItem<string>("serpapi-key") || "";
}
