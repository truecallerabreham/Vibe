import express from "express";
import { createServer } from "http";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { CanvasData } from "../types.js";
import { loadConfig } from "../config.js";
import { reviewArchitecture } from "../review/reviewer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_DIST = join(__dirname, "..", "..", "web", "dist");

interface ServerOptions {
  repos: CanvasData["repos"];
  diagrams: CanvasData["diagrams"];
  description: string;
}

export async function startServer(options: ServerOptions): Promise<number> {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  const canvasData: CanvasData = {
    description: options.description,
    repos: options.repos,
    diagrams: options.diagrams,
  };

  app.get("/api/data", (_req, res) => {
    res.json(canvasData);
  });

  app.post("/api/review", async (req, res) => {
    const components = options.diagrams.flatMap((d) =>
      d.components.map((c) => ({ name: c.name, source: d.repoFullName }))
    );
    const config = loadConfig();
    const review = await reviewArchitecture(options.description, components, config);
    res.json(review);
  });

  if (existsSync(WEB_DIST)) {
    app.use(express.static(WEB_DIST));
    app.get("*", (_req, res) => {
      res.sendFile(join(WEB_DIST, "index.html"));
    });
  } else {
    app.get("/", (_req, res) => {
      res.json({
        message: "Arc Canvas Server running. Build the web app with: cd web && npm run build",
        repos: options.repos.map((r) => r.fullName),
      });
    });
  }

  return new Promise((resolve) => {
    // Use a specific port or let OS assign one
    const listener = server.listen(0, "127.0.0.1", () => {
      const port = (listener.address() as { port: number }).port;
      // Store port for cleanup
      (app as unknown as Record<string, unknown>).__port = port;
      resolve(port);
    });
  });
}
