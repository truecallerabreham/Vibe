import { Config } from "../config.js";
import { RepoInfo } from "../types.js";
import { callLLM } from "../llm.js";

const SYSTEM_PROMPT = `You rank GitHub repositories by architectural relevance to a user's project.

Given a list of candidate repos and a project description, select the top 6 most architecturally relevant repos.

Consider:
- Architectural pattern alignment: does this repo solve a structurally similar problem?
- Codebase maturity: well-established repos with clear architecture patterns rank higher
- Technology stack relevance: relevance of the languages, frameworks, and tools used
- Documentation quality: repos with good README and docs are more useful as references
- Community health: active development, recent releases, responsive maintainers

Return as a JSON array of objects with: { fullName: string, rank: number, reason: string }
The reason should briefly explain the architectural relevance.`;

export async function rankRepos(repos: RepoInfo[], description: string, config: Config): Promise<RepoInfo[]> {
  if (repos.length <= 6) return repos;

  const repoList = repos.map((r) =>
    `${r.fullName} | ⭐${r.stars} | ${r.language || "?"} | topics: ${r.topics.slice(0, 5).join(", ") || "none"} | ${(r.description || "").slice(0, 150)}`
  ).join("\n");

  const prompt = `Project description: "${description}"

Candidates (${repos.length} total):
${repoList}

Select and rank the top 6 most architecturally relevant repos. Return as a JSON array.`;

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
