import { Config } from "../config.js";
import { DiagramComponent } from "../types.js";
import { callLLM } from "../llm.js";
import { getComponentCached, setComponentCache } from "../cache/store.js";

const SYSTEM_PROMPT = `You explain software architecture components in detail.
For a given component used in an open-source project, explain:
1. What it does (purpose and role in the architecture)
2. Trade-offs (pros and cons of using this component)
3. Real-world alternatives (other options and when to use them)
4. Why this project likely chose it (based on context)

Be concise but thorough. Use plain language.`;

export async function generateComponentDetail(
  repoUrl: string,
  component: DiagramComponent,
  architectureContext: string,
  config: Config
): Promise<string> {
  const cacheKey = `${repoUrl}:${component.name}`;

  const cached = getComponentCached(repoUrl, component.name);
  if (cached) return cached;

  const prompt = `Repository: ${repoUrl}
Component name: ${component.name}
Category: ${component.category}
Description: ${component.description || "N/A"}
Dependencies: ${component.dependencies.join(", ") || "none"}
Architecture context: ${architectureContext}

Provide a detailed analysis of this component.`;

  const result = await callLLM(prompt, SYSTEM_PROMPT, config);
  setComponentCache(repoUrl, component.name, result);
  return result;
}
