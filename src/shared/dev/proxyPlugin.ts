/// <reference types="node" />
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import { handleProxyRequest, isAllowedOrigin } from "../../../api/shared/proxy/handler";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function setCORSHeaders(res: ServerResponse, origin: string): void {
  res.setHeader("Access-Control-Allow-Origin", isAllowedOrigin(origin) ? origin : "null");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export function proxyPlugin(): Plugin {
  return {
    name: "local-api-proxy",
    configureServer(server) {
      server.middlewares.use("/api/proxy", async (req, res) => {
        const origin = String(req.headers.origin || req.headers.referer || "");
        setCORSHeaders(res, origin);

        if (req.method === "OPTIONS") {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        const rawBody = await readBody(req);

        let payload: Record<string, unknown>;
        try {
          payload = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Invalid JSON body" }));
          return;
        }

        const result = await handleProxyRequest(payload);

        res.statusCode = result.status;
        for (const [name, value] of Object.entries(result.headers)) {
          res.setHeader(name, value);
        }
        res.end(result.body);
      });
    },
  };
}
