import { Config } from "../config.js";
import { callLLM } from "../llm.js";

const SYSTEM_PROMPT = `You are an expert at finding high-quality open-source projects on GitHub.

Given a user's project description, generate 8 diverse GitHub search queries that will find the most architecturally relevant, well-engineered repos.

Rules for queries:
- Use GitHub's search qualifiers effectively: language, stars, pushed, topic, good-first-issues
- Mix of broad queries (e.g., "note-taking app") and narrow ones (e.g., "markdown editor electron")
- Minimum stars: 100 (we want proven, production-quality repos)
- Prefer repos pushed within the last 2 years (pushed:>2024-01-01)
- Include language-specific queries when the description implies a tech stack
- Avoid querying for the description itself verbatim — extract core concepts

Return as a JSON array of strings only. Example: ["note-taking app stars:>500", "markdown editor open-source"]`;

export async function generateSearchQueries(description: string, config: Config): Promise<string[]> {
  const prompt = `Project description: "${description}"

Generate 8 diverse GitHub search queries to find the most architecturally relevant open-source repos for this project. Vary stars ranges (100-1000, 1000+), include language-specific qualifiers where appropriate, and prioritize repos with active maintenance.`;

  const result = await callLLM(prompt, SYSTEM_PROMPT, config);
  const cleaned = result.replace(/```(?:json)?\s*/gi, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 10);
    }
  } catch {
    // fallback
  }

  return [description];
}
