import { describe, it, expect, beforeEach, vi } from "vitest";
import type { SearchProfile } from "@/shared/types";

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

import { useJobSearchStore } from "@/features/job-search/model/profileStore";

const mockProfile: SearchProfile = {
  job_titles: ["Software Engineer"],
  technologies: ["React", "TypeScript"],
  location: "Barcelona",
  modality: "Remote",
  seniority: "Senior",
  exclude_keywords: ["PHP"],
  extra_context: "",
};

beforeEach(() => {
  useJobSearchStore.setState({ profile: null });
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  vi.clearAllMocks();
});

describe("useJobSearchStore", () => {
  describe("initial state", () => {
    it("has null profile by default", () => {
      expect(useJobSearchStore.getState().profile).toBeNull();
    });
  });

  describe("setProfile", () => {
    it("sets the profile", () => {
      useJobSearchStore.getState().setProfile(mockProfile);
      expect(useJobSearchStore.getState().profile).toEqual(mockProfile);
    });

    it("persists profile to localStorage", () => {
      useJobSearchStore.getState().setProfile(mockProfile);

      const raw = mockStorage["search-profile"];
      expect(raw).toBeDefined();
      const parsed = JSON.parse(raw);
      expect(parsed.job_titles).toEqual(["Software Engineer"]);
    });

    it("overwrites existing profile", () => {
      useJobSearchStore.getState().setProfile(mockProfile);

      const newProfile: SearchProfile = {
        ...mockProfile,
        location: "Madrid",
      };
      useJobSearchStore.getState().setProfile(newProfile);

      expect(useJobSearchStore.getState().profile?.location).toBe("Madrid");
    });

    it("stores full SearchProfile structure", () => {
      const fullProfile: SearchProfile = {
        job_titles: ["Full Stack Developer", "Backend Engineer"],
        technologies: ["Node.js", "Python", "AWS"],
        location: "Remote (EU)",
        modality: "Hybrid",
        seniority: "Mid",
        exclude_keywords: ["WordPress", "Drupal"],
        extra_context: "Interested in fintech",
      };

      useJobSearchStore.getState().setProfile(fullProfile);
      const stored = useJobSearchStore.getState().profile;

      expect(stored?.job_titles).toEqual(fullProfile.job_titles);
      expect(stored?.technologies).toEqual(fullProfile.technologies);
      expect(stored?.modality).toBe("Hybrid");
      expect(stored?.seniority).toBe("Mid");
      expect(stored?.exclude_keywords).toEqual(fullProfile.exclude_keywords);
      expect(stored?.extra_context).toBe("Interested in fintech");
    });
  });
});
