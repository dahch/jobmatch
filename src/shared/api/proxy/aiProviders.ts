import type { ProxyResult } from "./jobSources";

export const ALLOWED_HOSTS = [
  "integrate.api.nvidia.com",
  "api.openai.com",
  "openrouter.ai",
  "api.deepseek.com",
  "api.anthropic.com",
  "generativelanguage.googleapis.com",
];

export const ALLOWED_FORWARDED_HEADERS = new Set([
  "authorization",
  "x-api-key",
  "anthropic-version",
  "x-goog-api-key",
]);

export function validateUrl(targetUrl: string): string | null {
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

export function sanitizeForwardedHeaders(
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

export async function proxyAIProvider(
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
