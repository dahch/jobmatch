import { create } from "zustand";
import type { SearchProfile } from "@/shared/types";
import { getStorageItem, setStorageItem } from "@/shared/lib/storage";

interface SearchProfileStore {
  profile: SearchProfile | null;
  setProfile: (profile: SearchProfile) => void;
}

const STORAGE_KEY = "search-profile";

export const useJobSearchStore = create<SearchProfileStore>((set) => ({
  profile: getStorageItem<SearchProfile>(STORAGE_KEY),

  setProfile: (profile) => {
    setStorageItem(STORAGE_KEY, profile);
    set({ profile });
  },
}));
