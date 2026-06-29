#!/usr/bin/env node

import { execSync } from "child_process";
import { existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const backendDir = join(root, "gitdiagram", "backend");

if (!existsSync(backendDir)) {
  console.log("  GitDiagram backend not bundled — skipping setup.");
  process.exit(0);
}

if (existsSync(join(backendDir, ".venv"))) {
  console.log("  GitDiagram backend already set up.");
  process.exit(0);
}

console.log("  Setting up GitDiagram backend (Python deps)...");

try {
  execSync("uv sync", { cwd: backendDir, stdio: "pipe", timeout: 120000 });
  console.log("  GitDiagram backend ready.");
} catch {
  console.log("  Could not set up GitDiagram backend.");
  console.log("  Arc will fall back to LLM-generated diagrams.");
  console.log("  To use GitDiagram diagrams, install Python 3.14+ and uv, then run: cd gitdiagram/backend && uv sync");
}
