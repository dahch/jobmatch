import type {
  AIClientConfig,
  AIMessage,
  AITool,
  AIResponse,
  Provider,
} from "@/shared/types";
import { PROVIDERS } from "@/shared/types";

interface ModelInfo {
  id: string;
}

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

// Providers that don't allow browser CORS — route through /api/proxy
const PROXIED_PROVIDERS: Set<Provider> = new Set([PROVIDERS.nvidia]);

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  const res = await fetch(url, init);
  if (res.status === 429 && retries > 0) {
    const retryAfter = res.headers.get("Retry-After");
    const delay = retryAfter
      ? parseInt(retryAfter, 10) * 1000
      : BASE_DELAY_MS * (MAX_RETRIES - retries + 1);
    await new Promise((r) => setTimeout(r, Math.min(delay, 10000)));
    return fetchWithRetry(url, init, retries - 1);
  }
  return res;
}

async function proxyFetch(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const rawBody = init.body;
  const parsedBody =
    typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    return await fetchWithRetry(
      "/api/proxy",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: url,
          headers: init.headers,
          body: parsedBody,
        }),
        signal: controller.signal,
      },
      MAX_RETRIES,
    );
  } finally {
    clearTimeout(timeout);
  }
}

// ── Shared OpenAI-compatible completion ──────────────────────────────

interface ProviderEndpoint {
  url: string;
  headers: Record<string, string>;
  errorLabel: string;
}

function getEndpoint(provider: Provider, baseUrl?: string): ProviderEndpoint {
  switch (provider) {
    case PROVIDERS.openai:
      return {
        url: "https://api.openai.com/v1/chat/completions",
        headers: {},
        errorLabel: "OpenAI",
      };
    case PROVIDERS.openrouter:
      return {
        url: "https://openrouter.ai/api/v1/chat/completions",
        headers: {
          "HTTP-Referer": window.location.origin,
          "X-Title": "JobMatch AI",
        },
        errorLabel: "OpenRouter",
      };
    case PROVIDERS.deepseek:
      return {
        url: "https://api.deepseek.com/v1/chat/completions",
        headers: {},
        errorLabel: "DeepSeek",
      };
    case PROVIDERS.nvidia:
      return {
        url: "https://integrate.api.nvidia.com/v1/chat/completions",
        headers: {},
        errorLabel: "NVIDIA NIM",
      };
    case PROVIDERS.opencode:
      if (!baseUrl) throw new Error("OpenCode provider requires a base URL");
      return {
        url: `${baseUrl}/chat/completions`,
        headers: {},
        errorLabel: "OpenCode",
      };
    case PROVIDERS.custom:
      if (!baseUrl) throw new Error("Custom provider requires a base URL");
      return {
        url: `${baseUrl}/chat/completions`,
        headers: {},
        errorLabel: "Custom",
      };
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

async function openAICompatibleCompletion(
  config: AIClientConfig,
  messages: AIMessage[],
  options?: {
    tools?: AITool[];
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: "json_object" };
  },
): Promise<AIResponse> {
  const endpoint = getEndpoint(config.provider, config.baseUrl);

  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature: options?.temperature ?? 0.7,
  };
  if (options?.max_tokens) body.max_tokens = options.max_tokens;
  if (options?.tools)
    body.tools = options.tools.map((t) => ({ type: "function", function: t }));
  if (options?.response_format) body.response_format = options.response_format;

  const res = PROXIED_PROVIDERS.has(config.provider)
    ? await proxyFetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          ...endpoint.headers,
        },
        body: JSON.stringify(body),
      })
    : await fetchWithRetry(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          ...endpoint.headers,
        },
        body: JSON.stringify(body),
      });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `${endpoint.errorLabel} API error ${res.status}: ${err.error?.message || res.statusText}`,
    );
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  return {
    content: choice?.message?.content || "",
    tool_calls: choice?.message?.tool_calls,
  };
}

// ── Anthropic completion ─────────────────────────────────────────────

async function anthropicCompletion(
  config: AIClientConfig,
  messages: AIMessage[],
  options?: { tools?: AITool[]; temperature?: number; max_tokens?: number },
): Promise<AIResponse> {
  const systemMsg = messages.find((m) => m.role === "system");
  const nonSystemMsgs = messages.filter(
    (m) => m.role !== "system",
  ) as AnthropicMessage[];

  const body: Record<string, unknown> = {
    model: config.model,
    max_tokens: options?.max_tokens || 4096,
    messages: nonSystemMsgs,
    temperature: options?.temperature ?? 0.7,
  };
  if (systemMsg) body.system = systemMsg.content;
  if (options?.tools) {
    body.tools = options.tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));
  }

  const res = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Anthropic API error ${res.status}: ${err.error?.message || res.statusText}`,
    );
  }

  const data = await res.json();
  const textBlock = data.content?.find(
    (b: { type: string }) => b.type === "text",
  );
  const toolUseBlocks =
    data.content?.filter((b: { type: string }) => b.type === "tool_use") || [];

  return {
    content: textBlock?.text || "",
    tool_calls: toolUseBlocks.map(
      (b: { id: string; name: string; input: unknown }) => ({
        id: b.id,
        name: b.name,
        arguments: JSON.stringify(b.input),
      }),
    ),
  };
}

// ── Gemini completion ────────────────────────────────────────────────

async function geminiCompletion(
  config: AIClientConfig,
  messages: AIMessage[],
  options?: { tools?: AITool[]; temperature?: number; max_tokens?: number },
): Promise<AIResponse> {
  const model = config.model || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const systemMsg = messages.find((m) => m.role === "system");
  const nonSystemMsgs = messages.filter((m) => m.role !== "system");

  const contents = nonSystemMsgs.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = { contents };

  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  const genConfig: Record<string, unknown> = {};
  if (options?.temperature !== undefined)
    genConfig.temperature = options.temperature;
  if (options?.max_tokens) genConfig.maxOutputTokens = options.max_tokens;
  if (Object.keys(genConfig).length > 0) body.generationConfig = genConfig;

  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": config.apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Gemini API error ${res.status}: ${err.error?.message || res.statusText}`,
    );
  }

  const data = await res.json();
  return { content: data.candidates?.[0]?.content?.parts?.[0]?.text || "" };
}

// ── Public API ───────────────────────────────────────────────────────

export async function chatCompletion(
  config: AIClientConfig,
  messages: AIMessage[],
  options?: {
    tools?: AITool[];
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: "json_object" };
  },
): Promise<AIResponse> {
  switch (config.provider) {
    case PROVIDERS.openai:
    case PROVIDERS.openrouter:
    case PROVIDERS.deepseek:
    case PROVIDERS.nvidia:
    case PROVIDERS.opencode:
    case PROVIDERS.custom:
      return openAICompatibleCompletion(config, messages, options);
    case PROVIDERS.anthropic:
      return anthropicCompletion(config, messages, options);
    case PROVIDERS.gemini:
      return geminiCompletion(config, messages, options);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

// ── Model listing ────────────────────────────────────────────────────

async function listOpenAICompatibleModels(
  url: string,
  headers: Record<string, string>,
  filter?: (id: string) => boolean,
): Promise<string[]> {
  const res = await fetch(url, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  const models: ModelInfo[] = data.data || [];
  const ids = models.map((m) => m.id);
  return filter ? ids.filter(filter).sort() : ids.sort();
}

async function listGeminiModels(apiKey: string): Promise<string[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models`,
    { headers: { "x-goog-api-key": apiKey } },
  );
  if (!res.ok) return [];
  const data = await res.json();
  const models: { name: string }[] = data.models || [];
  return models
    .map((m) => m.name.replace("models/", ""))
    .filter((id) => id.includes("gemini"))
    .sort();
}

export async function listModels(
  provider: Provider,
  apiKey: string,
  baseUrl?: string,
  signal?: AbortSignal,
): Promise<string[]> {
  try {
    switch (provider) {
      case PROVIDERS.openai:
        if (signal?.aborted) return [];
        return listOpenAICompatibleModels(
          "https://api.openai.com/v1/models",
          { Authorization: `Bearer ${apiKey}` },
          (id) => id.includes("gpt") || id.includes("o1") || id.includes("o3"),
        );
      case PROVIDERS.openrouter:
        if (signal?.aborted) return [];
        return listOpenAICompatibleModels(
          "https://openrouter.ai/api/v1/models",
          {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": window.location.origin,
          },
        );
      case PROVIDERS.anthropic: {
        // Anthropic has no public model listing endpoint
        // Return known Claude models statically
        return [
          "claude-3-5-sonnet-20241022",
          "claude-3-5-haiku-20241022",
          "claude-3-opus-20240229",
        ];
      }
      case PROVIDERS.gemini:
        if (signal?.aborted) return [];
        return listGeminiModels(apiKey);
      case PROVIDERS.deepseek:
        if (signal?.aborted) return [];
        return listOpenAICompatibleModels(
          "https://api.deepseek.com/v1/models",
          { Authorization: `Bearer ${apiKey}` },
          (id) => id.includes("deepseek"),
        );
      case PROVIDERS.nvidia:
        if (signal?.aborted) return [];
        return listOpenAICompatibleModels(
          "https://integrate.api.nvidia.com/v1/models",
          { Authorization: `Bearer ${apiKey}` },
        );
      case PROVIDERS.opencode:
      case PROVIDERS.custom:
        if (signal?.aborted) return [];
        if (!baseUrl) return [];
        return listOpenAICompatibleModels(`${baseUrl}/models`, {
          Authorization: `Bearer ${apiKey}`,
        });
      default:
        return [];
    }
  } catch {
    return [];
  }
}
