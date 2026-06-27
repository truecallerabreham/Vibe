import { Config } from "../config.js";
import { discoverRepos } from "../search/index.js";
import { fetchDiagrams } from "../diagram/client.js";
import { startServer } from "../server/index.js";
import { openBrowser } from "../server/browser.js";

export async function buildCommand(description: string, config: Config): Promise<void> {
  console.log(`\n  🔍 Searching for projects matching: "${description}"\n`);

  const repos = await discoverRepos(description, config);
  if (repos.length === 0) {
    console.log("  No relevant repos found. Try a different description.");
    process.exit(0);
  }

  console.log(`\n  📐 Generating architecture diagrams for ${repos.length} repos...\n`);

  const diagrams = await fetchDiagrams(repos, config);

  console.log(`\n  🚀 Starting design canvas...\n`);

  const port = await startServer({ repos, diagrams, description });
  const url = `http://localhost:${port}`;
  openBrowser(url);

  console.log(`  Canvas opened at ${url}`);
  console.log("  Press Ctrl+C to stop the server and exit.\n");

  await new Promise(() => {});
}
