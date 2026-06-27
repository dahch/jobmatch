import { create } from "zustand";
import type {
  ParsedCV,
  OptimizedCV,
  JobOffer,
  AIClientConfig,
} from "@/shared/types";
import { getStorageItem, setStorageItem } from "@/shared/lib/storage";

interface CVStore {
  parsedCV: ParsedCV | null;
  optimizedCVs: { jobId: string; cv: OptimizedCV; createdAt: string }[];
  isParsingCV: boolean;
  isGeneratingCV: boolean;
  generationError: string | null;
  setParsedCV: (cv: ParsedCV) => void;
  addOptimizedCV: (jobId: string, cv: OptimizedCV) => void;
  setIsParsingCV: (v: boolean) => void;
  setIsGeneratingCV: (v: boolean) => void;
  setGenerationError: (e: string | null) => void;
  generateOptimizedCV: (
    job: JobOffer,
    config: AIClientConfig,
    extraInstructions?: string,
  ) => Promise<void>;
}

const PARSED_CV_KEY = "parsed-cv";
const OPTIMIZED_CVS_KEY = "optimized-cvs";

export const useCVStore = create<CVStore>((set, get) => ({
  parsedCV: getStorageItem<ParsedCV>(PARSED_CV_KEY),
  optimizedCVs:
    getStorageItem<{ jobId: string; cv: OptimizedCV; createdAt: string }[]>(
      OPTIMIZED_CVS_KEY,
    ) || [],
  isParsingCV: false,
  isGeneratingCV: false,
  generationError: null,

  setParsedCV: (cv) => {
    const toStore =
      cv.raw_text.length > 50000
        ? { ...cv, raw_text: cv.raw_text.slice(0, 50000) }
        : cv;
    setStorageItem(PARSED_CV_KEY, toStore);
    set({ parsedCV: toStore });
  },

  addOptimizedCV: (jobId, cv) => {
    const existing = get().optimizedCVs;
    const updated = [
      ...existing,
      { jobId, cv, createdAt: new Date().toISOString() },
    ].slice(-10);
    setStorageItem(OPTIMIZED_CVS_KEY, updated);
    set({ optimizedCVs: updated });
  },

  setIsParsingCV: (v) => set({ isParsingCV: v }),
  setIsGeneratingCV: (v) => set({ isGeneratingCV: v }),
  setGenerationError: (e) => set({ generationError: e }),

  generateOptimizedCV: async (job, config, extraInstructions) => {
    const { parsedCV } = get();
    if (!parsedCV) {
      set({ generationError: "No CV uploaded. Upload your CV first." });
      return;
    }

    set({ isGeneratingCV: true, generationError: null });

    try {
      const { optimizeCV } =
        await import("@/features/cv-builder/lib/cvOptimizer");
      const optimized = await optimizeCV(
        config,
        parsedCV,
        job,
        extraInstructions,
      );
      get().addOptimizedCV(job.id, optimized);
      set({ isGeneratingCV: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "CV generation failed";
      set({ generationError: msg, isGeneratingCV: false });
    }
  },
}));
