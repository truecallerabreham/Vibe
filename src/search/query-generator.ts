import { Config } from "../config.js";
import { callLLM } from "../llm.js";

const SYSTEM_PROMPT = `You generate GitHub repository search queries to find open-source projects.
Given a user's project description, produce 8 diverse GitHub search queries that will find relevant, well-engineered repos.

Rules:
- Vary qualifiers: language, topic, stars range, activity
- Use in:name,description,readme for broad matching
- Minimum stars: 50
- Include both broad and narrow queries
- Return as a JSON array of strings only`;

export async function generateSearchQueries(description: string, config: Config): Promise<string[]> {
  const prompt = `Project description: "${description}"

Generate 8 GitHub search queries to find repos architecturally similar to this project.`;

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
