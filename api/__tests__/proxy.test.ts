import { describe, it, expect, vi, beforeEach } from "vitest";

// Must hoist before module import — store original env and modify for tests
const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}));

vi.mock("@/shared/lib/storage", () => ({
  getStorageItem: vi.fn(),
  setStorageItem: vi.fn(),
}));

function createMockRes() {
  const state: { statusCode: number; headers: Record<string, string>; body: unknown } = {
    statusCode: 200,
    headers: {},
    body: null,
  };
  const self = {
    status: vi.fn((code: number) => {
      state.statusCode = code;
      return self;
    }),
    setHeader: vi.fn((name: string, value: string) => {
      state.headers[name] = value;
      return self;
    }),
    json: vi.fn((data: unknown) => {
      state.body = data;
      return self;
    }),
    send: vi.fn((data: string) => {
      state.body = data;
      return self;
    }),
    end: vi.fn(() => self),
    _getState: () => state,
  };
  return self;
}

type MockRes = ReturnType<typeof createMockRes>;

beforeEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
  // Default: upstream fetch succeeds
  mockFetch.mockResolvedValue(
    new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
});

// We import dynamically in each test so process.env changes are picked up
async function getHandler() {
  return (await import("../proxy.ts")).default;
}

async function callHandler(
  reqOverrides: Partial<{ method: string; body: unknown; headers: Record<string, string> }>,
) {
  const mod = await import("../proxy.ts");
  const handler = mod.default;
  const res = createMockRes();
  const req = {
    method: "POST",
    body: {} as Record<string, unknown>,
    headers: {},
    ...reqOverrides,
  };
  await handler(req as never, res as never);
  return res;
}

describe("proxy handler", () => {
  describe("CORS and method handling", () => {
    it("handles OPTIONS preflight", async () => {
      const res = await callHandler({ method: "OPTIONS" });
      const state = res._getState();
      expect(state.statusCode).toBe(200);
    });

    it("rejects non-POST, non-OPTIONS methods", async () => {
      const res = await callHandler({ method: "GET" });
      const state = res._getState();
      expect(state.statusCode).toBe(405);
      expect((state.body as { error: string }).error).toBe("Method not allowed");
    });

    it("sets CORS headers for allowed origin", async () => {
      const res = await callHandler({ headers: { origin: "http://localhost:5173" } });
      const state = res._getState();
      expect(state.headers["Access-Control-Allow-Origin"]).toBe("http://localhost:5173");
    });

    it("sets CORS origin to null for unknown origin", async () => {
      const res = await callHandler({ headers: { origin: "https://evil.com" } });
      const state = res._getState();
      expect(state.headers["Access-Control-Allow-Origin"]).toBe("null");
    });
  });

  describe("body parsing", () => {
    it("rejects invalid JSON body", async () => {
      const res = await callHandler({ body: "not-json{" as never });
      const state = res._getState();
      expect(state.statusCode).toBe(400);
      expect((state.body as { error: string }).error).toBe("Invalid JSON body");
    });

    it("parses string body as JSON", async () => {
      const res = await callHandler({
        body: JSON.stringify({ targetUrl: "https://api.openai.com/v1/chat/completions", body: { test: true } }),
      } as never);
      const state = res._getState();
      // Should not get 400 — valid JSON string body should parse
      expect(state.statusCode).not.toBe(400);
    });

    it("rejects missing targetUrl and source", async () => {
      const res = await callHandler({ body: {} });
      const state = res._getState();
      expect(state.statusCode).toBe(400);
      expect((state.body as { error: string }).error).toContain("Missing targetUrl");
    });
  });

  describe("AI provider proxy", () => {
    it("forwards request to allowed provider", async () => {
      globalThis.fetch = mockFetch;

      const res = await callHandler({
        body: {
          targetUrl: "https://api.openai.com/v1/chat/completions",
          body: { model: "gpt-4o", messages: [] },
        },
      });

      const state = res._getState();
      expect(state.statusCode).toBe(200);
    });

    it("rejects disallowed host", async () => {
      const res = await callHandler({
        body: {
          targetUrl: "https://evil.com/api",
          body: {},
        },
      });

      const state = res._getState();
      expect(state.statusCode).toBe(403);
      expect((state.body as { error: string }).error).toBe("Host not allowed");
    });

    it("rejects non-HTTPS URL", async () => {
      const res = await callHandler({
        body: {
          targetUrl: "http://api.openai.com/v1/chat/completions",
          body: {},
        },
      });

      const state = res._getState();
      expect(state.statusCode).toBe(403);
      expect((state.body as { error: string }).error).toBe("HTTPS required");
    });

    it("rejects URL with embedded credentials", async () => {
      const res = await callHandler({
        body: {
          targetUrl: "https://user:pass@api.openai.com/v1/chat/completions",
          body: {},
        },
      });

      const state = res._getState();
      expect(state.statusCode).toBe(403);
      expect((state.body as { error: string }).error).toBe("Credentials in URL not allowed");
    });

    it("rejects invalid targetUrl format", async () => {
      const res = await callHandler({
        body: {
          targetUrl: "not-a-url",
          body: {},
        },
      });

      const state = res._getState();
      expect(state.statusCode).toBe(403);
    });

    it("rejects missing body", async () => {
      const res = await callHandler({
        body: {
          targetUrl: "https://api.openai.com/v1/chat/completions",
        },
      });

      const state = res._getState();
      expect(state.statusCode).toBe(400);
      expect((state.body as { error: string }).error).toContain("Missing or invalid body");
    });

    it("sanitizes forwarded headers", async () => {
      globalThis.fetch = mockFetch;

      await callHandler({
        body: {
          targetUrl: "https://api.openai.com/v1/chat/completions",
          body: {},
          headers: {
            Authorization: "Bearer sk-test",
            "X-Injected": "malicious",
          },
        },
      });

      // Only allowed headers should be forwarded
      const fetchCall = mockFetch.mock.calls[0];
      const forwardedHeaders = fetchCall[1].headers;
      expect(forwardedHeaders.Authorization).toBe("Bearer sk-test");
      expect(forwardedHeaders["X-Injected"]).toBeUndefined();
    });

    it("handles upstream fetch error", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

      const res = await callHandler({
        body: {
          targetUrl: "https://api.openai.com/v1/chat/completions",
          body: {},
        },
      });

      const state = res._getState();
      expect(state.statusCode).toBe(502);
      expect((state.body as { error: string }).error).toBe("Network failure");
    });
  });

});
