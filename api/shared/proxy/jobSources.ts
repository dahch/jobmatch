export interface JobSourceParams {
  what?: string;
  where?: string;
  page?: string;
  // SerpApi params (BYOK — api_key comes per-request)
  q?: string;
  location?: string;
  hl?: string;
  gl?: string;
  google_domain?: string;
  api_key?: string;
}

export interface JobSourceConfig {
  baseUrl: string;
  apiKey?: string;
  appId?: string;
  params?: Record<string, string>;
}

export interface ProxyResult {
  status: number;
  headers: Record<string, string>;
  body: string;
}

/*
 * Adzuna was evaluated and removed (ADR-013, 2026-07-23).
 * The free tier returns "PRO FEATURE ONLY" for live job search;
 * it is not usable without a paid plan.
 */
export const JOB_SOURCES: Record<string, JobSourceConfig> = {
  // Add new proxied job sources here (env-keyed). Example:
  // themuse: {
  //   baseUrl: "https://www.themuse.com/api/public/jobs",
  // },
};

function sanitizeUpstreamError(
  status: number,
  upstreamBody: string,
): ProxyResult {
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

export async function fetchJobSource(
  sourceName: string,
  params: JobSourceParams,
): Promise<ProxyResult> {
  // SerpApi is BYOK — route separately from env-keyed JOB_SOURCES
  if (sourceName === "serpapi") {
    return fetchSerpApi(params);
  }

  const config = JOB_SOURCES[sourceName];
  if (!config) {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: `Unknown job source: ${sourceName}` }),
    };
  }

  if (!config.baseUrl.startsWith("https://")) {
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid source configuration" }),
    };
  }

  const queryParams = new URLSearchParams();

  if (config.appId && config.appId.length > 0)
    queryParams.set("app_id", config.appId);
  if (config.apiKey && config.apiKey.length > 0)
    queryParams.set("app_key", config.apiKey);

  if (params.what) queryParams.set("what", params.what);
  if (params.where) queryParams.set("where", params.where);
  if (params.page) queryParams.set("page", params.page);

  if (config.params) {
    for (const [k, v] of Object.entries(config.params)) {
      queryParams.set(k, v);
    }
  }

  const qs = queryParams.toString();
  const targetUrl = qs ? `${config.baseUrl}?${qs}` : config.baseUrl;

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
