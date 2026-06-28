import { Config } from "../config.js";
import { RepoInfo, DiagramResult, DiagramComponent } from "../types.js";
import { getDiagramCached, setDiagramCache } from "../cache/store.js";
import { callLLMWithJSON } from "../llm.js";
import { fetchDiagramFromGitDiagram, isGitDiagramAvailable } from "./gitdiagram-client.js";

interface GitHubFileTreeItem {
  name: string;
  path: string;
  type: "blob" | "tree";
}

interface GitHubRepoContent {
  tree: GitHubFileTreeItem[];
}

interface DiagramLLMResponse {
  mermaid: string;
  explanation: string;
  components: DiagramComponent[];
  graphJson: Record<string, unknown>;
}

async function fetchRepoFileTree(repo: RepoInfo, config: Config): Promise<GitHubFileTreeItem[]> {
  const [owner, name] = repo.fullName.split("/");
  const url = `https://api.github.com/repos/${owner}/${name}/git/trees/${repo.defaultBranch}?recursive=1`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `token ${config.githubToken}`,
      "User-Agent": "arc",
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status} fetching file tree for ${repo.fullName}`);
  }

  const data = (await res.json()) as GitHubRepoContent;
  return data.tree || [];
}

async function fetchRepoReadme(repo: RepoInfo, config: Config): Promise<string> {
  const [owner, name] = repo.fullName.split("/");
  const url = `https://api.github.com/repos/${owner}/${name}/readme`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3.raw",
      Authorization: `token ${config.githubToken}`,
      "User-Agent": "arc",
    },
  });

  if (!res.ok) {
    return "(no README available)";
  }

  return await res.text();
}

function summarizeFileTree(tree: GitHubFileTreeItem[]): string {
  const dirs = tree.filter((f) => f.type === "tree").map((f) => f.path);
  const topDirs = dirs.filter((d) => !d.includes("/") && d !== ".git");
  const topFiles = tree.filter((f) => f.type === "blob" && !f.path.includes("/")).map((f) => f.name);

  const importantDirs = dirs.filter(
    (d) => !d.startsWith(".") && !d.includes("node_modules") && !d.includes(".git")
  );

  let summary = `Top-level directories: ${topDirs.join(", ") || "none"}\n`;
  summary += `Top-level files: ${topFiles.join(", ") || "none"}\n`;
  summary += `\nProject structure (key paths):\n`;
  for (const dir of importantDirs.slice(0, 60)) {
    const filesInDir = tree
      .filter((f) => f.type === "blob" && f.path.startsWith(dir + "/"))
      .map((f) => f.path)
      .slice(0, 10);
    summary += `  ${dir}/ (${filesInDir.length} files)\n`;
  }
  return summary;
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
    console.log("  GitDiagram backend available: using generated diagrams\n");
  } else {
    console.log("  GitDiagram backend not available: using LLM-generated diagrams (consider starting gitdiagram/backend for better quality)\n");
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
