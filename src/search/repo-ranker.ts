import { Config } from "../config.js";
import { RepoInfo } from "../types.js";
import { callLLM } from "../llm.js";
import { fetchRepoReadme, fetchRepoFileTree, summarizeFileTree } from "../github.js";

const STAGE1_SYSTEM = `You are a senior architect evaluating GitHub repos by metadata only.

Given a project description and a list of candidate repos, select the top 10 that seem most architecturally relevant based on name, description, stars, language, and topics.

Return as a JSON array of 10 objects with: { fullName: string, rank: number }
Sort by relevance, most relevant first.`;

const STAGE2_SYSTEM = `You are a senior architect selecting the single best reference repo for a user's project.

You will receive detailed context for each candidate repo: its README content and file tree structure.

Choose the repo whose architecture, tech stack, and project structure best matches the user's described project.

Return as a JSON object with: { fullName: string, reason: string }
The reason should explain the architectural fit in 1-2 sentences.`;

async function stage1Rank(repos: RepoInfo[], description: string, config: Config): Promise<RepoInfo[]> {
  const repoList = repos.map((r) =>
    `${r.fullName} | ⭐${r.stars} | ${r.language || "?"} | topics: ${r.topics.slice(0, 5).join(", ") || "none"} | ${(r.description || "").slice(0, 150)}`
  ).join("\n");

  const prompt = `Project: "${description}"

Candidates (${repos.length}):
${repoList}

Select the top 10 most architecturally relevant. Return JSON array of 10.`;

  const result = await callLLM(prompt, STAGE1_SYSTEM, config);
  const cleaned = result.replace(/```(?:json)?\s*/gi, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as { fullName: string }[];
    const selectedNames = new Set(parsed.map((p) => p.fullName));
    const selected = repos.filter((r) => selectedNames.has(r.fullName));
    return selected.slice(0, 10);
  } catch {
    return repos.slice(0, 10);
  }
}

async function stage2Rank(repos: RepoInfo[], description: string, config: Config): Promise<RepoInfo> {
  const repoEntries: string[] = [];

  for (const repo of repos) {
    try {
      const [readme, tree] = await Promise.all([
        fetchRepoReadme(repo, config),
        fetchRepoFileTree(repo, config).then(summarizeFileTree).catch(() => "(tree unavailable)"),
      ]);
      const readmeSnippet = readme.slice(0, 2000);
      repoEntries.push(`--- REPO: ${repo.fullName} ---
Stars: ${repo.stars}
Language: ${repo.language || "?"}
Topics: ${repo.topics.slice(0, 8).join(", ") || "none"}
Description: ${repo.description || "N/A"}
README (first 2000 chars):
${readmeSnippet}

File Tree:
${tree}
`);
    } catch {
      repoEntries.push(`--- REPO: ${repo.fullName} ---
(error fetching details)
`);
    }
  }

  const prompt = `User's project: "${description}"

Below are ${repos.length} candidate repos with their README content and file structure.

${repoEntries.join("\n")}

Pick the single repo that is the BEST architectural reference for this project.
Return JSON: { fullName: string, reason: string }`;

  const result = await callLLM(prompt, STAGE2_SYSTEM, config);
  const cleaned = result.replace(/```(?:json)?\s*/gi, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as { fullName: string };
    const match = repos.find((r) => r.fullName === parsed.fullName);
    if (match) return match;
  } catch {
    // fall through
  }

  return repos[0];
}

const STAGE1_ONLY_SYSTEM = `You are a senior architect evaluating GitHub repos.

Given a project description and a list of candidate repos, select the top 2 most architecturally relevant.

Consider: architectural pattern alignment, codebase maturity, tech stack relevance, documentation quality.

Return as a JSON array of exactly 2 objects with: { fullName: string, rank: number, reason: string }`;

export async function rankRepos(repos: RepoInfo[], description: string, config: Config): Promise<RepoInfo[]> {
  if (repos.length <= 2) return repos;

  const top10 = await stage1Rank(repos, description, config);
  if (top10.length <= 2) return top10;

  const results: RepoInfo[] = [];

  console.log(`  Deep-analyzing top ${top10.length} candidates...`);

  for (let i = 1; i <= 2; i++) {
    const candidate = await stage2Rank(top10, description, config);
    results.push(candidate);
    // Remove selected so we get distinct repos
    const idx = top10.findIndex((r) => r.fullName === candidate.fullName);
    if (idx !== -1) top10.splice(idx, 1);
  }

  return results;
}
