import { describe, it, expect, beforeEach } from "vitest";
import { getSources } from "@/features/job-search/api/sources";
import type { SearchProfile } from "@/shared/types";

function makeProfile(location: string, modality: string = "On-site"): SearchProfile {
  return {
    job_titles: ["Developer"],
    technologies: [],
    location,
    modality: modality as SearchProfile["modality"],
    seniority: "Any",
    exclude_keywords: [],
    extra_context: "",
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("getSources", () => {
  it("always includes SerpApi", () => {
    const sources = getSources(makeProfile("Barcelona"));
    expect(sources.map((s) => s.name)).toContain("SerpApi (Google Jobs)");
  });

  it("includes Arbeitnow for Germany (Berlin)", () => {
    const sources = getSources(makeProfile("Berlin"));
    const names = sources.map((s) => s.name);
    expect(names).toContain("Arbeitnow");
    expect(names).toContain("SerpApi (Google Jobs)");
  });

  it("includes Arbeitnow for Germany (Munich)", () => {
    const sources = getSources(makeProfile("Munich"));
    expect(sources.map((s) => s.name)).toContain("Arbeitnow");
  });

  it("includes Arbeitnow for Germany by country name", () => {
    const sources = getSources(makeProfile("Deutschland"));
    expect(sources.map((s) => s.name)).toContain("Arbeitnow");
  });

  it("includes Arbeitnow for Austria (Vienna)", () => {
    const sources = getSources(makeProfile("Wien"));
    expect(sources.map((s) => s.name)).toContain("Arbeitnow");
  });

  it("includes Arbeitnow for Switzerland (Zürich)", () => {
    const sources = getSources(makeProfile("Zürich"));
    expect(sources.map((s) => s.name)).toContain("Arbeitnow");
  });

  it("includes Arbeitnow for Switzerland by country code", () => {
    const sources = getSources(makeProfile("CH"));
    expect(sources.map((s) => s.name)).toContain("Arbeitnow");
  });

  it("excludes Arbeitnow for non-DACH location (Barcelona)", () => {
    const sources = getSources(makeProfile("Barcelona"));
    expect(sources.map((s) => s.name)).not.toContain("Arbeitnow");
  });

  it("excludes Arbeitnow for non-DACH location (London)", () => {
    const sources = getSources(makeProfile("London"));
    expect(sources.map((s) => s.name)).not.toContain("Arbeitnow");
  });

  it("excludes Arbeitnow for non-DACH location (New York)", () => {
    const sources = getSources(makeProfile("New York"));
    expect(sources.map((s) => s.name)).not.toContain("Arbeitnow");
  });

  it("includes Arbeitnow for EU-remote (Remote + EU)", () => {
    const sources = getSources(makeProfile("Remote EU", "Remote"));
    expect(sources.map((s) => s.name)).toContain("Arbeitnow");
  });

  it("includes Arbeitnow for EU-remote (Remote + Europe)", () => {
    const sources = getSources(makeProfile("Remote Europe", "Remote"));
    expect(sources.map((s) => s.name)).toContain("Arbeitnow");
  });

  it("excludes Arbeitnow for Remote but non-EU location", () => {
    const sources = getSources(makeProfile("Remote US", "Remote"));
    expect(sources.map((s) => s.name)).not.toContain("Arbeitnow");
  });

  it("excludes Arbeitnow when modality is On-site and location is Remote EU", () => {
    // Only the modality matters for EU-remote gate
    const sources = getSources(makeProfile("Remote EU", "On-site"));
    expect(sources.map((s) => s.name)).not.toContain("Arbeitnow");
  });

  it("includes Arbeitnow for DACH city matched via regex (Hamburg)", () => {
    const sources = getSources(makeProfile("Hamburg"));
    expect(sources.map((s) => s.name)).toContain("Arbeitnow");
  });

  it("includes Arbeitnow for DACH city matched via regex (Köln)", () => {
    const sources = getSources(makeProfile("Köln"));
    expect(sources.map((s) => s.name)).toContain("Arbeitnow");
  });

  it("returns only SerpApi for empty location", () => {
    const sources = getSources(makeProfile(""));
    const names = sources.map((s) => s.name);
    expect(names).toEqual(["SerpApi (Google Jobs)"]);
  });

  it("matches DACH via broader regex when exact set lookup misses", () => {
    // "Berlin, Germany" -> "berlin, germany" is NOT in the DACH_REGIONS set
    // (the set has "berlin" and "germany" individually, not the compound string)
    // but the broader regex matches because it contains "germany"
    const sources = getSources(makeProfile("Berlin, Germany"));
    const names = sources.map((s) => s.name);
    expect(names).toContain("Arbeitnow");
  });

  it("matches DACH via broader regex for compound city names", () => {
    // "Frankfurt am Main" is NOT in the set, but contains "frankfurt"
    const sources = getSources(makeProfile("Frankfurt am Main"));
    const names = sources.map((s) => s.name);
    expect(names).toContain("Arbeitnow");
  });
});
