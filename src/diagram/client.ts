import { Config } from "../config.js";
import { RepoInfo, DiagramResult } from "../types.js";
import { getDiagramCached, setDiagramCache } from "../cache/store.js";

interface GitDiagramResponse {
  mermaid: string;
  explanation: string;
  components: Array<{
    name: string;
    path: string;
    description: string;
    dependencies: string[];
    category: string;
  }>;
  graphJson: Record<string, unknown>;
}

async function generateDiagram(repo: RepoInfo, config: Config): Promise<DiagramResult> {
  const url = `${config.gitdiagramUrl}/api/generate`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repoUrl: repo.htmlUrl,
      branch: repo.defaultBranch,
    }),
  });

  if (!res.ok) {
    throw new Error(`GitDiagram API error: ${res.status} for ${repo.fullName}`);
  }

  const data = (await res.json()) as GitDiagramResponse;

  return {
    repoFullName: repo.fullName,
    mermaid: data.mermaid,
    explanation: data.explanation,
    components: data.components,
    graphJson: data.graphJson,
    cached: false,
  };
}

export async function fetchDiagrams(repos: RepoInfo[], config: Config): Promise<DiagramResult[]> {
  const results: DiagramResult[] = [];

  for (const repo of repos) {
    const cacheKey = `${repo.htmlUrl}:${repo.defaultBranch}`;

    const cached = getDiagramCached(repo.htmlUrl, repo.defaultBranch);
    if (cached) {
      const parsed = JSON.parse(cached) as DiagramResult;
      parsed.cached = true;
      results.push(parsed);
      console.log(`  ✓ ${repo.fullName} (cached)`);
      continue;
    }

    try {
      const diagram = await generateDiagram(repo, config);
      setDiagramCache(repo.htmlUrl, repo.defaultBranch, JSON.stringify(diagram));
      results.push(diagram);
      console.log(`  ✓ ${repo.fullName}`);
    } catch (err) {
      console.error(`  ✗ ${repo.fullName}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return results;
}
