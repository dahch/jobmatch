import { describe, it, expect, vi, beforeEach } from "vitest";
import { chatCompletion } from "@/shared/api/aiClient";
import type { AIClientConfig } from "@/shared/types";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockConfig: AIClientConfig = {
  provider: "openai",
  apiKey: "test-key",
  model: "gpt-4o",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("chatCompletion - routing", () => {
  it("routes to OpenAI-compatible for openai provider", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: "Hello!" } }],
        }),
    } as Response);

    const result = await chatCompletion(mockConfig, [
      { role: "user", content: "Hi" },
    ]);

    expect(result.content).toBe("Hello!");
  });

  it("routes to OpenAI-compatible for openrouter provider", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: "Hi from OpenRouter!" } }],
        }),
    } as Response);

    const result = await chatCompletion(
      { ...mockConfig, provider: "openrouter" },
      [{ role: "user", content: "Hi" }],
    );

    expect(result.content).toBe("Hi from OpenRouter!");
    // Verify OpenRouter-specific headers
    expect(mockFetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        headers: expect.objectContaining({
          "HTTP-Referer": expect.any(String),
          "X-Title": "JobMatch AI",
        }),
      }),
    );
  });

  it("routes to Anthropic for anthropic provider", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ type: "text", text: "Hello from Claude!" }],
        }),
    } as Response);

    const result = await chatCompletion(
      { ...mockConfig, provider: "anthropic", model: "claude-3-5-sonnet-20241022" },
      [{ role: "user", content: "Hi" }],
    );

    expect(result.content).toBe("Hello from Claude!");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-api-key": "test-key",
          "anthropic-version": "2023-06-01",
        }),
      }),
    );
  });

  it("routes to Gemini for gemini provider", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [
            {
              content: {
                parts: [{ text: "Hello from Gemini!" }],
              },
            },
          ],
        }),
    } as Response);

    const result = await chatCompletion(
      { ...mockConfig, provider: "gemini", model: "gemini-2.0-flash" },
      [{ role: "user", content: "Hi" }],
    );

    expect(result.content).toBe("Hello from Gemini!");
  });

  it("requires baseUrl for opencode provider", async () => {
    await expect(
      chatCompletion(
        { ...mockConfig, provider: "opencode", baseUrl: undefined },
        [{ role: "user", content: "Hi" }],
      ),
    ).rejects.toThrow("OpenCode provider requires a base URL");
  });

  it("requires baseUrl for custom provider", async () => {
    await expect(
      chatCompletion(
        { ...mockConfig, provider: "custom", baseUrl: undefined },
        [{ role: "user", content: "Hi" }],
      ),
    ).rejects.toThrow("Custom provider requires a base URL");
  });

  it("throws for unknown provider", async () => {
    await expect(
      chatCompletion(
        { ...mockConfig, provider: "unknown" as never },
        [{ role: "user", content: "Hi" }],
      ),
    ).rejects.toThrow("Unknown provider");
  });
});

describe("chatCompletion - error handling", () => {
  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: () => Promise.resolve({}),
    } as Response);

    await expect(
      chatCompletion(mockConfig, [{ role: "user", content: "Hi" }]),
    ).rejects.toThrow(/API error 401/);
  });

  it("retries on 429 status", async () => {
    // First call returns 429, second returns success
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "0" }), // minimal delay for test
        json: () => Promise.resolve({}),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: "Retry success" } }],
          }),
      } as Response);

    // Mock setTimeout for immediate resolution
    vi.useFakeTimers();
    const promise = chatCompletion(mockConfig, [
      { role: "user", content: "Hi" },
    ]);
    await vi.runAllTimersAsync();
    const result = await promise;
    vi.useRealTimers();

    expect(result.content).toBe("Retry success");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("chatCompletion - Anthropic specifics", () => {
  it("extracts system message for Anthropic", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ type: "text", text: "I understand my role." }],
        }),
    } as Response);

    await chatCompletion(
      { ...mockConfig, provider: "anthropic", model: "claude-3-5-sonnet-20241022" },
      [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hi" },
      ],
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.system).toBe("You are a helpful assistant.");
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe("user");
  });
});

describe("chatCompletion - Gemini specifics", () => {
  it("extracts system instruction for Gemini", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [{ content: { parts: [{ text: "OK" }] } }],
        }),
    } as Response);

    await chatCompletion(
      { ...mockConfig, provider: "gemini", model: "gemini-2.0-flash" },
      [
        { role: "system", content: "You are helpful." },
        { role: "user", content: "Hi" },
      ],
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.systemInstruction).toEqual({
      parts: [{ text: "You are helpful." }],
    });
    expect(body.contents).toHaveLength(1);
    expect(body.contents[0].role).toBe("user");
  });
});
