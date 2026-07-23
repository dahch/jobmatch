import { handleProxyRequest, isAllowedOrigin } from "./shared/proxy/handler";

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
