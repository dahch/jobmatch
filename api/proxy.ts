import { handleProxyRequest, isAllowedOrigin } from "../src/shared/api/proxy/handler";

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

function getOrigin(req: VercelRequest): string {
  return req.headers["origin"] || req.headers["referer"] || "";
}

function sendResult(
  res: VercelResponse,
  result: {
    status: number;
    headers: Record<string, string>;
    body: string;
  },
): VercelResponse {
  res.status(result.status);
  for (const [name, value] of Object.entries(result.headers)) {
    res.setHeader(name, value);
  }
  if (
    result.status >= 400 &&
    result.headers["Content-Type"] === "application/json"
  ) {
    return res.json(JSON.parse(result.body));
  }
  return res.send(result.body);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = getOrigin(req);
  const allowedOrigin = isAllowedOrigin(origin);

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin ? origin : "null");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Vercel may deliver req.body as a raw string instead of a parsed object
  let payload: Record<string, unknown>;
  try {
    const raw: unknown = req.body;
    payload =
      typeof raw === "string"
        ? JSON.parse(raw)
        : (raw as Record<string, unknown>);
  } catch {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Body must be a JSON object" });
  }

  const result = await handleProxyRequest(payload);
  return sendResult(res, result);
}
