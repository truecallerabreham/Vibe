import { Config } from "../config.js";
import { RepoInfo } from "../types.js";
import { callLLM } from "../llm.js";

const SYSTEM_PROMPT = `You rank GitHub repositories by architectural relevance to a user's project.
Given a list of repos and a project description, return the top 6 most architecturally relevant repos.

Consider:
- How similar the architecture patterns are
- Whether the repo solves a related problem
- Code quality and engineering practices
- Technology stack alignment

Return as a JSON array of objects with: { fullName: string, rank: number, reason: string }`;

export async function rankRepos(repos: RepoInfo[], description: string, config: Config): Promise<RepoInfo[]> {
  if (repos.length <= 6) return repos;

  const repoList = repos.map((r) => `${r.fullName} - ⭐${r.stars} - ${r.language || "?"} - ${(r.description || "").slice(0, 120)}`).join("\n");

  const prompt = `Project description: "${description}"

Repos:
${repoList}

Return the top 6 most architecturally relevant repos as a JSON array.`;

  const result = await callLLM(prompt, SYSTEM_PROMPT, config);
  const cleaned = result.replace(/```(?:json)?\s*/gi, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as { fullName: string }[];
    const selectedNames = new Set(parsed.map((p) => p.fullName));
    const selected = repos.filter((r) => selectedNames.has(r.fullName));
    return selected.length >= 3 ? selected : repos.slice(0, 6);
  } catch {
    return repos.slice(0, 6);
  }
}
