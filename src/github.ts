import { Config } from "./config.js";
import { RepoInfo } from "./types.js";

export interface GitHubFileTreeItem {
  name: string;
  path: string;
  type: "blob" | "tree";
}

interface GitHubRepoContent {
  tree: GitHubFileTreeItem[];
}

export async function fetchRepoFileTree(repo: RepoInfo, config: Config): Promise<GitHubFileTreeItem[]> {
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

export async function fetchRepoReadme(repo: RepoInfo, config: Config): Promise<string> {
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

export function summarizeFileTree(tree: GitHubFileTreeItem[]): string {
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
