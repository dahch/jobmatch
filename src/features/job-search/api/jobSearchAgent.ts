import type { SearchProfile, JobOffer } from "@/shared/types";
import { getSources } from "@/features/job-search/api/sources";
import { dedupeJobs } from "@/features/job-search/api/dedupeJobs";

interface SearchProgress {
  phase: string;
  detail?: string;
}

export async function searchJobs(
  profile: SearchProfile,
  onProgress?: (progress: SearchProgress) => void,
  signal?: AbortSignal,
  onWarn?: (warning: string) => void,
): Promise<JobOffer[]> {
  const notify = (p: SearchProgress) => onProgress?.(p);
  const warn = (msg: string) => onWarn?.(msg);
  const sources = getSources(profile);

  notify({
    phase: "Searching job sources...",
    detail: `${sources.length} source(s)`,
  });

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      notify({
        phase: `Fetching from ${source.name}...`,
      });

      const jobs = await source.fetch(profile, signal);

      notify({
        phase: `Got ${jobs.length} jobs from ${source.name}`,
      });

      return jobs;
    }),
  );

  const allJobs: JobOffer[] = [];
  let failedCount = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      allJobs.push(...result.value);
    } else {
      failedCount++;
      const errMsg = result.reason instanceof Error ? result.reason.message : "Unknown error";
      warn(errMsg);
    }
  }

  const deduped = dedupeJobs(allJobs);
  const sourceInfo =
    failedCount > 0
      ? `${deduped.length} from ${sources.length - failedCount}/${sources.length} sources (${failedCount} failed)`
      : `${deduped.length} from ${sources.length} sources`;

  notify({
    phase:
      failedCount > 0
        ? `Search complete (partial) — ${sourceInfo}`
        : `Search complete — ${sourceInfo}`,
    detail: failedCount > 0 ? `${failedCount} source(s) failed` : undefined,
  });

  return deduped;
}
