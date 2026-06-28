import { spawn, ChildProcess } from "child_process";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { Config } from "../config.js";
import { discoverRepos } from "../search/index.js";
import { fetchDiagrams } from "../diagram/client.js";
import { isGitDiagramAvailable } from "../diagram/gitdiagram-client.js";
import { startServer } from "../server/index.js";
import { openBrowser } from "../server/browser.js";

let gitdiagramProcess: ChildProcess | null = null;

async function tryStartGitDiagramBackend(config: Config): Promise<void> {
  const available = await isGitDiagramAvailable(config.gitdiagramUrl);
  if (available) return;

  const backendDir = join(process.cwd(), "gitdiagram", "backend");
  if (!existsSync(backendDir)) return;

  const envPath = join(process.cwd(), "gitdiagram", ".env");

  console.log("  Starting GitDiagram backend...");

  gitdiagramProcess = spawn("uv", ["run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3001"], {
    cwd: backendDir,
    stdio: "pipe",
      env: {
        ...process.env,
        ...(existsSync(envPath)
          ? Object.fromEntries(
              readFileSync(envPath, "utf-8")
                .split("\n")
                .filter((l: string) => l.trim() && !l.startsWith("#") && l.includes("="))
                .map((l: string) => {
                  const idx = l.indexOf("=");
                  return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
                }),
            )
          : {}),
      },
  });

  gitdiagramProcess.stdout?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) console.log(`  [gitdiagram] ${msg}`);
  });

  gitdiagramProcess.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) console.log(`  [gitdiagram] ${msg}`);
  });

  gitdiagramProcess.on("error", () => {
    console.log("  GitDiagram backend failed to start (Python >=3.14 required)");
    gitdiagramProcess = null;
  });

  let waited = 0;
  while (waited < 10000) {
    await new Promise((r) => setTimeout(r, 500));
    waited += 500;
    const alive = await isGitDiagramAvailable(config.gitdiagramUrl);
    if (alive) {
      console.log("  GitDiagram backend ready\n");
      return;
    }
  }

  console.log("  GitDiagram backend start timed out (Python >=3.14 likely missing)");
  killGitDiagramBackend();
}

function killGitDiagramBackend(): void {
  if (gitdiagramProcess) {
    try {
      gitdiagramProcess.kill();
    } catch {
      // ignore
    }
    gitdiagramProcess = null;
  }
}

export async function buildCommand(description: string, config: Config): Promise<void> {
  console.log(`\n  🔍 Searching for projects matching: "${description}"\n`);

  const repos = await discoverRepos(description, config);
  if (repos.length === 0) {
    console.log("  No relevant repos found. Try a different description.");
    process.exit(0);
  }

  console.log(`\n  📐 Generating architecture diagrams for ${repos.length} repos...\n`);

  await tryStartGitDiagramBackend(config);

  const diagrams = await fetchDiagrams(repos, config);

  console.log(`\n  🚀 Starting design canvas...\n`);

  const port = await startServer({ repos, diagrams, description });
  const url = `http://localhost:${port}`;
  openBrowser(url);

  console.log(`  Canvas opened at ${url}`);
  console.log("  Press Ctrl+C to stop the server and exit.\n");

  process.on("exit", killGitDiagramBackend);
  process.on("SIGINT", () => {
    killGitDiagramBackend();
    process.exit(0);
  });

  await new Promise(() => {});
}
