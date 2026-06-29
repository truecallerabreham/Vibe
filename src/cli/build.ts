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

  console.log("  Starting GitDiagram backend (this may take a minute for first-time setup)...");

  const env = {
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
    PYTHON_KEYRING_BACKEND: "keyring.backends.null.Keyring",
  };

  const uvCmd = process.platform === "win32" ? "uv.exe" : "uv";

  const checkVenv = join(backendDir, ".venv");
  const syncCmd = existsSync(checkVenv) ? ["run", "--no-sync"] : ["sync"];

  gitdiagramProcess = spawn(uvCmd, [...syncCmd, "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3001"], {
    cwd: backendDir,
    stdio: "pipe",
    env,
    shell: process.platform === "win32",
  });

  let lastLog = Date.now();
  const logInterval = 5000;

  const handleOutput = (data: Buffer) => {
    const msg = data.toString().trim();
    if (!msg) return;
    const now = Date.now();
    if (msg.includes("Uvicorn running") || msg.includes("Application startup") || now - lastLog > logInterval) {
      console.log(`  [gitdiagram] ${msg.split("\n").filter(Boolean).slice(-1)}`);
      lastLog = now;
    }
  };

  gitdiagramProcess.stdout?.on("data", handleOutput);
  gitdiagramProcess.stderr?.on("data", handleOutput);

  gitdiagramProcess.on("error", () => {
    gitdiagramProcess = null;
  });

  const maxWait = 120000;
  const pollInterval = 2000;
  let waited = 0;

  while (waited < maxWait) {
    await new Promise((r) => setTimeout(r, pollInterval));
    waited += pollInterval;
    if (waited % 20000 === 0) {
      console.log(`  Still waiting for GitDiagram backend... (${Math.round(waited / 1000)}s)`);
    }
    const alive = await isGitDiagramAvailable(config.gitdiagramUrl);
    if (alive) {
      console.log("  GitDiagram backend ready\n");
      return;
    }
  }

  console.log("  GitDiagram backend failed to start in time.");
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
