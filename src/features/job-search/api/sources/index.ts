import type { JobOffer, SearchProfile } from "@/shared/types";
import { fetchJobs as fetchArbeitnow } from "./arbeitnow";
import { fetchJobs as fetchSerpApi } from "./serpapi";

interface JobSource {
  name: string;
  fetch: (profile: SearchProfile, signal?: AbortSignal) => Promise<JobOffer[]>;
  proxied: boolean;
}

/*
 * Arbeitnow is gated to DACH (Germany / Austria / Switzerland) and EU-remote
 * because its actual employer base is concentrated in those regions.
 *
 * Additionally, Arbeitnow's tags[] filtering is broken — calling with
 * ?tags[]=javascript returns all 100 jobs unfiltered; ?tags[0]=x&tags[1]=y
 * is rejected entirely. Do not rely on server-side filtering; we fetch
 * unfiltered pages and let the consumer rank client-side instead.
 *
 * Confirmed 2026-07-23 with live API calls.
 */
const DACH_REGIONS = new Set([
  "germany", "deutschland", "de", "at", "austria", "österreich",
  "switzerland", "schweiz", "ch", "berlin", "munich", "münchen",
  "hamburg", "cologne", "köln", "frankfurt", "stuttgart", "vienna",
  "wien", "zurich", "zürich", "geneva", "genf", "bern",
]);

function isDACHOrEUPremote(location: string, modality: string): boolean {
  const loc = location.toLowerCase().trim();
  if (DACH_REGIONS.has(loc)) return true;

  // Broader match: any location containing DACH country or city names
  if (
    /germany|deutschland|austria|österreich|switzerland|schweiz|berlin|munich|münchen|hamburg|cologne|köln|frankfurt|stuttgart|vienna|wien|zurich|zürich|geneva|genf|bern/i.test(
      loc,
    )
  ) {
    return true;
  }

  // EU-remote: modality is Remote and location mentions EU/Europe
  if (modality.toLowerCase() === "remote") {
    if (/eu|europe|europa/i.test(loc)) return true;
  }

  return false;
}

export function getSources(profile: SearchProfile): JobSource[] {
  const sources: JobSource[] = [];

  // SerpApi: always attempt (fails gracefully if no key)
  sources.push({ name: "SerpApi (Google Jobs)", fetch: fetchSerpApi, proxied: true });

  // Arbeitnow: only for DACH or EU-remote profiles
  if (isDACHOrEUPremote(profile.location, profile.modality)) {
    sources.push({ name: "Arbeitnow", fetch: fetchArbeitnow, proxied: false });
  }

  return sources;
}

export type { JobSource };
