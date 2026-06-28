import { Config } from "../config.js";
import { callLLMWithJSON } from "../llm.js";

interface ComponentDetailResult {
  overview: string;
  tradeoffs: string[];
  alternatives: string[];
  whyChosen: string;
}

const SYSTEM_PROMPT = `You are a senior software architect explaining a component from an open-source project.
Given the component name, its category, the repo it belongs to, and what it does, provide:

1. A detailed overview paragraph
2. Trade-offs (list of 3-5 considerations)
3. Alternative approaches (list of 2-4)
4. Why this component was likely chosen (a paragraph)

Return JSON with: overview (string), tradeoffs (string[]), alternatives (string[]), whyChosen (string).`;

export async function getComponentDetail(
  repoFullName: string,
  componentName: string,
  category: string,
  description: string,
  config: Config,
): Promise<ComponentDetailResult> {
  const prompt = `Repo: ${repoFullName}
Component: ${componentName}
Category: ${category}
Description: ${description || "N/A"}

Explain this component in detail.`;

  return callLLMWithJSON<ComponentDetailResult>(prompt, SYSTEM_PROMPT, config);
}
