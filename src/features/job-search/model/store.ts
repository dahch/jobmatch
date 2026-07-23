import { create } from "zustand";
import type { JobOffer } from "@/shared/types";
import { getStorageItem, setStorageItem } from "@/shared/lib/storage";
import { searchJobs } from "@/features/job-search/api/jobSearchAgent";
import { useJobSearchStore } from "@/features/job-search/model/profileStore";
import { useCVStore } from "@/features/cv-builder/model/store";
import { populateMatchScores } from "@/features/job-search/api/matchScore";

interface SearchProgress {
  phase: string;
  detail?: string;
}

interface JobsStore {
  jobs: JobOffer[];
  isSearching: boolean;
  searchProgress: SearchProgress | null;
  searchError: string | null;
  searchWarnings: string[];
  selectedJobId: string | null;
  searchJobs: () => Promise<void>;
  selectJob: (id: string) => void;
  updateJobStatus: (id: string, status: JobOffer["status"]) => void;
  clearJobs: () => void;
  addJob: (job: JobOffer) => void;
}

const STORAGE_KEY = "jobs";

let currentAbortController: AbortController | null = null;

export const useJobsStore = create<JobsStore>((set, get) => ({
  jobs: getStorageItem<JobOffer[]>(STORAGE_KEY) || [],
  isSearching: false,
  searchProgress: null,
  searchError: null,
  searchWarnings: [],
  selectedJobId: null,

  searchJobs: async () => {
    currentAbortController?.abort();
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;

    const profile = useJobSearchStore.getState().profile;

    if (!profile) {
      set({
        searchError: "Search profile not defined. Set your criteria first.",
      });
      return;
    }

    set({
      isSearching: true,
      searchError: null,
      searchWarnings: [],
      searchProgress: { phase: "Starting search..." },
    });

    try {
      const warnings: string[] = [];
      let newJobs = await searchJobs(profile, (progress) => {
        set({ searchProgress: progress });
      }, signal, (w) => warnings.push(w));

      if (signal.aborted) return;

      const parsedCV = useCVStore.getState().parsedCV;
      if (parsedCV) {
        newJobs = populateMatchScores(newJobs, parsedCV);
      }

      setStorageItem(STORAGE_KEY, newJobs);
      set({
        jobs: newJobs,
        isSearching: false,
        searchWarnings: warnings,
        searchProgress: { phase: `Found ${newJobs.length} jobs` },
      });
    } catch (err) {
      if (signal.aborted) return;
      const msg = err instanceof Error ? err.message : "Search failed";
      set({ searchError: msg, isSearching: false, searchProgress: null });
    }
  },

  selectJob: (id) => set({ selectedJobId: id }),

  updateJobStatus: (id, status) => {
    const jobs = get().jobs.map((j) => (j.id === id ? { ...j, status } : j));
    setStorageItem(STORAGE_KEY, jobs);
    set({ jobs });
  },

  clearJobs: () => {
    setStorageItem(STORAGE_KEY, []);
    set({ jobs: [], selectedJobId: null });
  },

  addJob: (job) => {
    const jobs = [...get().jobs, job];
    setStorageItem(STORAGE_KEY, jobs);
    set({ jobs });
  },
}));
