import { Config } from "../config.js";
import { RepoInfo } from "../types.js";

interface GitHubRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  topics: string[];
  default_branch: string;
}

export async function searchGithubRepos(queries: string[], config: Config): Promise<RepoInfo[]> {
  const allRepos = new Map<string, RepoInfo>();

  for (const query of queries) {
    try {
      const encoded = encodeURIComponent(query);
      const url = `https://api.github.com/search/repositories?q=${encoded}&sort=stars&order=desc&per_page=30`;

      const res = await fetch(url, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `token ${config.githubToken}`,
          "User-Agent": "arc",
        },
      });

      if (!res.ok) {
        console.warn(`  GitHub API error (${res.status}) for query: ${query}`);
        continue;
      }

      const data = (await res.json()) as { items: GitHubRepo[] };
      for (const item of data.items || []) {
        if (!allRepos.has(item.full_name)) {
          allRepos.set(item.full_name, {
            fullName: item.full_name,
            htmlUrl: item.html_url,
            description: item.description,
            stars: item.stargazers_count,
            language: item.language,
            topics: item.topics || [],
            defaultBranch: item.default_branch,
          });
        }
      }
    } catch (err) {
      console.warn(`  Search failed for query: ${query}`, err);
    }
  }

  return Array.from(allRepos.values()).sort((a, b) => b.stars - a.stars);
}
