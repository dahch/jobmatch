import { fetchJobSource, type JobSourceParams, type ProxyResult } from "./jobSources";
import { proxyAIProvider } from "./aiProviders";

export const ALLOWED_FRONTEND_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://jobmatch-ai.vercel.app",
];

export const VERCEL_PREVIEW_RE = /^https:\/\/jobmatch-ai-git-.+\.vercel\.app$/;

export function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_FRONTEND_ORIGINS.includes(origin) || VERCEL_PREVIEW_RE.test(origin);
}

export interface ProxyPayload {
  source?: string;
  targetUrl?: string;
  body?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
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

export async function handleProxyRequest(payload: ProxyPayload): Promise<ProxyResult> {
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
