import { create } from "zustand";
import type { AIClientConfig } from "@/shared/types";
import { getStorageItem, setStorageItem } from "@/shared/lib/storage";

interface AIProviderStore {
  config: AIClientConfig | null;
  isConnected: boolean;
  setConfig: (config: AIClientConfig) => void;
  testConnection: () => Promise<boolean>;
}

const STORAGE_KEY = "ai-provider-config";

export const useAIProviderStore = create<AIProviderStore>((set, get) => ({
  config: getStorageItem<AIClientConfig>(STORAGE_KEY),
  isConnected: false,

  setConfig: (config) => {
    const prev = get().config;
    const changed =
      !prev ||
      prev.provider !== config.provider ||
      prev.apiKey !== config.apiKey ||
      prev.model !== config.model ||
      prev.baseUrl !== config.baseUrl;

    setStorageItem(STORAGE_KEY, config);
    set({ config, isConnected: changed ? false : get().isConnected });
  },

  testConnection: async () => {
    const { config } = get();
    if (!config) return false;

    try {
      const { chatCompletion } = await import("@/shared/api/aiClient");
      await chatCompletion(
        config,
        [{ role: "user", content: "Respond with: OK" }],
        {
          max_tokens: 50,
        },
      );
      set({ isConnected: true });
      return true;
    } catch {
      set({ isConnected: false });
      return false;
    }
  },
}));
