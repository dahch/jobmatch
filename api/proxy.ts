// NOTE: This file must be self-contained. Vercel serverless functions only
// bundle the single entry file; relative imports from api/ subdirectories are
// not included at runtime.

const ALLOWED_HOSTS = [
  "integrate.api.nvidia.com",
  "api.openai.com",
  "openrouter.ai",
  "api.deepseek.com",
  "api.anthropic.com",
  "generativelanguage.googleapis.com",
];

const ALLOWED_FORWARDED_HEADERS = new Set([
  "authorization",
  "x-api-key",
  "anthropic-version",
  "x-goog-api-key",
]);

const ALLOWED_FRONTEND_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://jobmatch-ai.vercel.app",
];

const VERCEL_PREVIEW_RE =
  /^https:\/\/jobmatch-ai-git-.+\.vercel\.app$/;

interface ProxyResult {
  status: number;
  headers: Record<string, string>;
  body: string;
}

interface JobSourceParams {
  what?: string;
  where?: string;
  page?: string;
  q?: string;
  location?: string;
  hl?: string;
  gl?: string;
  google_domain?: string;
  api_key?: string;
}

function isAllowedOrigin(origin: string): boolean {
  return (
    ALLOWED_FRONTEND_ORIGINS.includes(origin) || VERCEL_PREVIEW_RE.test(origin)
  );
}

function validateUrl(targetUrl: string): string | null {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return "Invalid targetUrl";
  }

  if (parsedUrl.protocol !== "https:") {
    return "HTTPS required";
  }

  if (parsedUrl.username || parsedUrl.password) {
    return "Credentials in URL not allowed";
  }

  const hostname = parsedUrl.hostname.replace(/\.$/, "");
  if (!ALLOWED_HOSTS.includes(hostname)) {
    return "Host not allowed";
  }

  return null;
}

function sanitizeForwardedHeaders(
  headers: Record<string, string> | undefined,
): Record<string, string> {
  const safe: Record<string, string> = { "Content-Type": "application/json" };
  if (!headers) return safe;
  for (const [key, value] of Object.entries(headers)) {
    if (ALLOWED_FORWARDED_HEADERS.has(key.toLowerCase())) {
      safe[key] = value;
    }
  }
  return safe;
}

async function proxyAIProvider(
  targetUrl: string,
  headers: Record<string, string> | undefined,
  body: unknown,
): Promise<ProxyResult> {
  const urlError = validateUrl(targetUrl);
  if (urlError) {
    return {
      status: 403,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: urlError }),
    };
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers: sanitizeForwardedHeaders(headers),
      body: JSON.stringify(body),
    });

    const data = await upstream.text();

    if (!upstream.ok) {
      return {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Upstream API returned an error",
          status: upstream.status,
        }),
      };
    }

    return {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
      body: data,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy error";
    return {
      status: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: message }),
    };
  }
}

function sanitizeUpstreamError(status: number, upstreamBody: string): ProxyResult {
  return {
    status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      error: "Upstream API returned an error",
      status,
      upstream_body: upstreamBody.slice(0, 1000),
    }),
  };
}

async function fetchSerpApi(params: JobSourceParams): Promise<ProxyResult> {
  const baseUrl = "https://serpapi.com/search.json";
  const queryParams = new URLSearchParams();

  queryParams.set("engine", "google_jobs");
  queryParams.set("q", params.q || "jobs");
  queryParams.set("google_domain", params.google_domain || "google.com");
  queryParams.set("hl", params.hl || "en");
  queryParams.set("gl", params.gl || "us");

  if (params.location) queryParams.set("location", params.location);
  if (params.api_key) queryParams.set("api_key", params.api_key);

  const targetUrl = `${baseUrl}?${queryParams.toString()}`;

  try {
    const upstream = await fetch(targetUrl);
    const data = await upstream.text();

    if (!upstream.ok) {
      return sanitizeUpstreamError(upstream.status, data);
    }

    return {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
      body: data,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy error";
    return {
      status: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: message }),
    };
  }
}

async function fetchJobSource(
  sourceName: string,
  params: JobSourceParams,
): Promise<ProxyResult> {
  if (sourceName === "serpapi") {
    return fetchSerpApi(params);
  }

  return {
    status: 400,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ error: `Unknown job source: ${sourceName}` }),
  };
}

function extractJobSourceParams(
  raw: Record<string, unknown> | undefined,
): JobSourceParams {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return {
    what: String(raw.what || ""),
    where: String(raw.where || ""),
    page: String(raw.page || ""),
    q: String(raw.q || ""),
    location: String(raw.location || ""),
    hl: String(raw.hl || ""),
    gl: String(raw.gl || ""),
    google_domain: String(raw.google_domain || ""),
    api_key: String(raw.api_key || ""),
  };
}

function extractForwardedHeaders(
  raw: Record<string, unknown> | undefined,
): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Record<string, string>;
}

interface ProxyPayload {
  source?: string;
  targetUrl?: string;
  body?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

async function handleProxyRequest(payload: ProxyPayload): Promise<ProxyResult> {
  const source = payload.source;
  const targetUrl = payload.targetUrl;
  const params = extractJobSourceParams(payload.params);
  const headers = extractForwardedHeaders(payload.headers);

  if (source) {
    return fetchJobSource(source, params);
  }

  if (!targetUrl) {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing targetUrl or source" }),
    };
  }

  if (!payload.body || typeof payload.body !== "object") {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing or invalid body" }),
    };
  }

  return proxyAIProvider(targetUrl, headers, payload.body);
}

export default async function handler(req: any, res: any) {
  try {
    const origin = String(
      req.headers["origin"] || req.headers["referer"] || "",
    );
    const allowedOrigin = isAllowedOrigin(origin);

    res.setHeader(
      "Access-Control-Allow-Origin",
      allowedOrigin ? origin : "null",
    );
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    let payload: Record<string, unknown>;
    try {
      const raw: unknown = await parseBody(req);
      payload =
        typeof raw === "string"
          ? JSON.parse(raw)
          : (raw as Record<string, unknown>);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Parse error";
      return res.status(400).json({ error: "Invalid JSON body", detail });
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return res.status(400).json({ error: "Body must be a JSON object" });
    }

    const result = await handleProxyRequest(payload);
    return sendResult(res, result);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown server error";
    console.error("Proxy invocation failed:", err);
    return res.status(500).json({ error: "Proxy handler error", detail });
  }
}

function sendResult(
  res: any,
  result: {
    status: number;
    headers: Record<string, string>;
    body: string;
  },
) {
  res.status(result.status);
  for (const [name, value] of Object.entries(result.headers)) {
    res.setHeader(name, value);
  }

  if (result.headers["Content-Type"] === "application/json") {
    try {
      return res.json(JSON.parse(result.body));
    } catch {
      // fall through to send()
    }
  }
  return res.send(result.body);
}

async function parseBody(req: any): Promise<unknown> {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return req.body;
    }
  }

  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(text ? JSON.parse(text) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}
