import { Config } from "../config.js";
import { RepoInfo, DiagramResult, DiagramComponent } from "../types.js";
import { getDiagramCached, setDiagramCache } from "../cache/store.js";
import { callLLMWithJSON } from "../llm.js";
import { fetchDiagramFromGitDiagram, isGitDiagramAvailable } from "./gitdiagram-client.js";
import { fetchRepoFileTree, fetchRepoReadme, summarizeFileTree } from "../github.js";

interface DiagramLLMResponse {
  mermaid: string;
  explanation: string;
  components: DiagramComponent[];
  graphJson: Record<string, unknown>;
}

async function generateDiagramViaLLM(repo: RepoInfo, config: Config): Promise<DiagramResult> {
  const fileTree = await fetchRepoFileTree(repo, config);
  const readme = await fetchRepoReadme(repo, config);

  const treeSummary = summarizeFileTree(fileTree);

  const systemPrompt = `You are an expert software architect. Analyze a GitHub repository and produce:
1. A Mermaid.js architecture diagram (flowchart TD) showing the main components and how they connect
2. An explanation of the architecture
3. A list of key components with their descriptions, dependencies, and categories

Focus on the high-level architecture. Group related files into logical components.
Use clear Mermaid syntax with subgraphs for major subsystems.`;

  const prompt = `Repository: ${repo.fullName}
Description: ${repo.description || "N/A"}
Stars: ${repo.stars}
Language: ${repo.language || "N/A"}
Topics: ${repo.topics.join(", ")}

README:
${readme.slice(0, 4000)}

File Tree:
${treeSummary}

Generate a Mermaid flowchart diagram showing the architecture. Use subgraphs for major subsystems.
Return JSON with: mermaid (string), explanation (string, 3-5 paragraphs), components (array of {name, path, description, dependencies: string[], category: string}), graphJson (object with nodes/edges).`;

  const result = await callLLMWithJSON<DiagramLLMResponse>(prompt, systemPrompt, config);

  return {
    repoFullName: repo.fullName,
    mermaid: result.mermaid,
    explanation: result.explanation,
    components: result.components,
    graphJson: result.graphJson,
    cached: false,
    source: "llm",
  };
}

export async function fetchDiagrams(repos: RepoInfo[], config: Config): Promise<DiagramResult[]> {
  const results: DiagramResult[] = [];
  const gitdiagramAvailable = await isGitDiagramAvailable(config.gitdiagramUrl);

  if (gitdiagramAvailable) {
    console.log("  GitDiagram backend available: generating real architecture diagrams\n");
  } else {
    console.log("  ⚠ GitDiagram backend not available. Install Python 3.14+ and uv, then run: cd gitdiagram/backend && uv sync\n");
    console.log("  Falling back to LLM-generated diagrams (less accurate)...\n");
  }

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
      let diagram: DiagramResult;

      if (gitdiagramAvailable) {
        try {
          diagram = await fetchDiagramFromGitDiagram(repo, config, config.gitdiagramUrl);
          console.log(`  ✓ ${repo.fullName} (gitdiagram)`);
        } catch (err) {
          console.log(`  ! GitDiagram failed for ${repo.fullName}, falling back to LLM: ${err instanceof Error ? err.message : "unknown error"}`);
          diagram = await generateDiagramViaLLM(repo, config);
          console.log(`  ✓ ${repo.fullName} (llm fallback)`);
        }
      } else {
        diagram = await generateDiagramViaLLM(repo, config);
        console.log(`  ✓ ${repo.fullName}`);
      }

      setDiagramCache(repo.htmlUrl, repo.defaultBranch, JSON.stringify(diagram));
      results.push(diagram);
    } catch (err) {
      console.error(`  ✗ ${repo.fullName}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return results;
}
