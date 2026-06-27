import { describe, it, expect, beforeEach, vi } from "vitest";
import type { AIClientConfig } from "@/shared/types";

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

import { useAIProviderStore } from "@/features/ai-provider/model/store";

const mockConfig: AIClientConfig = {
  provider: "openai",
  apiKey: "sk-test-key",
  model: "gpt-4o",
};

beforeEach(() => {
  useAIProviderStore.setState({ config: null, isConnected: false });
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  vi.clearAllMocks();
});

describe("useAIProviderStore", () => {
  describe("initial state", () => {
    it("has null config by default", () => {
      expect(useAIProviderStore.getState().config).toBeNull();
    });

    it("is not connected by default", () => {
      expect(useAIProviderStore.getState().isConnected).toBe(false);
    });
  });

  describe("setConfig", () => {
    it("sets the config", () => {
      useAIProviderStore.getState().setConfig(mockConfig);
      expect(useAIProviderStore.getState().config).toEqual(mockConfig);
    });

    it("persists config to localStorage", () => {
      useAIProviderStore.getState().setConfig(mockConfig);

      const raw = mockStorage["ai-provider-config"];
      expect(raw).toBeDefined();
      const parsed = JSON.parse(raw);
      expect(parsed.provider).toBe("openai");
      expect(parsed.apiKey).toBe("sk-test-key");
    });

    it("resets isConnected to false when config changes", () => {
      useAIProviderStore.setState({ config: mockConfig, isConnected: true });

      useAIProviderStore
        .getState()
        .setConfig({ ...mockConfig, model: "gpt-4-turbo" });

      expect(useAIProviderStore.getState().isConnected).toBe(false);
    });

    it("keeps isConnected when config is unchanged", () => {
      useAIProviderStore.setState({ config: mockConfig, isConnected: true });
      useAIProviderStore.getState().setConfig({ ...mockConfig });
      expect(useAIProviderStore.getState().isConnected).toBe(true);
    });

    it("supports opencode provider with baseUrl", () => {
      const openCodeConfig: AIClientConfig = {
        provider: "opencode",
        apiKey: "key",
        model: "model",
        baseUrl: "http://localhost:8080",
      };

      useAIProviderStore.getState().setConfig(openCodeConfig);
      expect(useAIProviderStore.getState().config?.baseUrl).toBe(
        "http://localhost:8080",
      );
    });
  });
});
