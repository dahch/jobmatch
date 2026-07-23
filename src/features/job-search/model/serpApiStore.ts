import { create } from "zustand";
import { getStorageItem, setStorageItem } from "@/shared/lib/storage";

const STORAGE_KEY = "serpapi-key";

interface SerpApiStore {
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const useSerpApiStore = create<SerpApiStore>((set) => ({
  apiKey: getStorageItem<string>(STORAGE_KEY) || "",
  setApiKey: (apiKey: string) => {
    setStorageItem(STORAGE_KEY, apiKey);
    set({ apiKey });
  },
}));
