interface VercelRequest {
  method: string;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  setHeader(name: string, value: string): VercelResponse;
  json(data: unknown): VercelResponse;
  send(data: string): VercelResponse;
  end(): VercelResponse;
}

const ALLOWED_HOSTS = [
  "integrate.api.nvidia.com",
  "api.openai.com",
  "openrouter.ai",
  "api.deepseek.com",
  "api.anthropic.com",
  "generativelanguage.googleapis.com",
];

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Vercel may deliver req.body as a raw string instead of a parsed object
  const raw: unknown = req.body;
  const payload = typeof raw === "string" ? JSON.parse(raw) : raw;
  const { targetUrl, headers, body } = payload as {
    targetUrl?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };

  if (!targetUrl) {
    return res.status(400).json({ error: "Missing targetUrl" });
  }

  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Missing or invalid body" });
  }

  try {
    const parsedUrl = new URL(targetUrl);
    if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
      return res.status(403).json({ error: "Host not allowed" });
    }
  } catch {
    return res.status(400).json({ error: "Invalid targetUrl" });
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.text();

    res.setHeader("Content-Type", "application/json");
    return res.status(upstream.status).send(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy error";
    return res.status(502).json({ error: message });
  }
}
