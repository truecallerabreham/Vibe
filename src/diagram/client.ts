import { Config } from "../config.js";
import { RepoInfo, DiagramResult } from "../types.js";
import { getDiagramCached, setDiagramCache } from "../cache/store.js";
import { fetchDiagramFromGitDiagram, isGitDiagramAvailable } from "./gitdiagram-client.js";

export async function fetchDiagrams(repos: RepoInfo[], config: Config): Promise<DiagramResult[]> {
  const results: DiagramResult[] = [];
  const gitdiagramAvailable = await isGitDiagramAvailable(config.gitdiagramUrl);

  if (!gitdiagramAvailable) {
    console.log("\n  ⚠ GitDiagram backend is required but not running.");
    console.log("  Install Python 3.14+ and uv, then run:\n");
    console.log("      cd gitdiagram/backend && uv sync");
    console.log("      uv run uvicorn app.main:app --host 0.0.0.0 --port 3001\n");
    console.log("  Or run 'arc build' which auto-starts the backend.\n");
    process.exit(1);
  }

  console.log("  GitDiagram backend available: generating real architecture diagrams\n");

  for (const repo of repos) {
    const cached = getDiagramCached(repo.htmlUrl, repo.defaultBranch);
    if (cached) {
      const parsed = JSON.parse(cached) as DiagramResult;
      parsed.cached = true;
      results.push(parsed);
      console.log(`  ✓ ${repo.fullName} (cached)`);
      continue;
    }

    try {
      const diagram = await fetchDiagramFromGitDiagram(repo, config, config.gitdiagramUrl);
      setDiagramCache(repo.htmlUrl, repo.defaultBranch, JSON.stringify(diagram));
      results.push(diagram);
      console.log(`  ✓ ${repo.fullName} (gitdiagram)`);
    } catch (err) {
      console.error(`  ✗ ${repo.fullName}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return results;
}
