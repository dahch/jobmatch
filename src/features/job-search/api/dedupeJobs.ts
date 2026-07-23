import type { JobOffer } from "@/shared/types";

export function dedupeJobs(jobs: JobOffer[]): JobOffer[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const safe = (s: string | undefined) =>
      s?.trim()?.toLowerCase() || "__MISSING__";
    const title = safe(job.title);
    const company = safe(job.company);
    const location = safe(job.location);

    // If no identifying metadata at all, let through (can't deduplicate)
    if (title === "__MISSING__" && company === "__MISSING__" && location === "__MISSING__") {
      return true;
    }

    const key = `${title}|${company}|${location}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
