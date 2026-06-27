export type Provider =
  | "openai"
  | "openrouter"
  | "anthropic"
  | "gemini"
  | "opencode"
  | "custom";

export interface AIClientConfig {
  provider: Provider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface AIResponse {
  content: string;
  tool_calls?: ToolCall[];
}

export const PROVIDER_MODELS: Record<Provider, string[]> = {
  openai: ["gpt-4o", "gpt-4-turbo", "gpt-4o-mini"],
  openrouter: [
    "openai/gpt-4o",
    "anthropic/claude-3-5-sonnet",
    "google/gemini-pro-1.5",
    "meta-llama/llama-3.1-70b-instruct",
  ],
  anthropic: ["claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-3-5"],
  gemini: [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
  ],
  opencode: [],
  custom: [],
};

export const PROVIDER_BASE_URLS: Record<Exclude<Provider, "custom">, string> = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  anthropic: "https://api.anthropic.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  opencode: "",
};
