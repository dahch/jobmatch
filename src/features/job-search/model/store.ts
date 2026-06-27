import { create } from "zustand";
import type { JobOffer, AIClientConfig } from "@/shared/types";
import { getStorageItem, setStorageItem } from "@/shared/lib/storage";
import { searchJobs } from "@/features/job-search/api/jobSearchAgent";

interface SearchProgress {
  phase: string;
  detail?: string;
}

interface JobsStore {
  jobs: JobOffer[];
  isSearching: boolean;
  searchProgress: SearchProgress | null;
  searchError: string | null;
  selectedJobId: string | null;
  searchJobs: (config: AIClientConfig) => Promise<void>;
  selectJob: (id: string) => void;
  updateJobStatus: (id: string, status: JobOffer["status"]) => void;
  clearJobs: () => void;
  addJob: (job: JobOffer) => void;
}

const STORAGE_KEY = "jobs";

export const useJobsStore = create<JobsStore>((set, get) => ({
  jobs: getStorageItem<JobOffer[]>(STORAGE_KEY) || [],
  isSearching: false,
  searchProgress: null,
  searchError: null,
  selectedJobId: null,

  searchJobs: async (config) => {
    const { useJobSearchStore } =
      await import("@/features/job-search/model/profileStore");

    const profile = useJobSearchStore.getState().profile;

    if (!config) {
      set({ searchError: "AI provider not configured. Go to Settings first." });
      return;
    }
    if (!profile) {
      set({
        searchError: "Search profile not defined. Set your criteria first.",
      });
      return;
    }

    set({
      isSearching: true,
      searchError: null,
      searchProgress: { phase: "Starting search..." },
    });

    try {
      const newJobs = await searchJobs(config, profile, (progress) => {
        set({ searchProgress: progress });
      });

      setStorageItem(STORAGE_KEY, newJobs);
      set({
        jobs: newJobs,
        isSearching: false,
        searchProgress: { phase: `Found ${newJobs.length} jobs` },
      });
    } catch (err) {
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
