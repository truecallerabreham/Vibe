import { Config } from "../config.js";
import { ArchitectureReview } from "../types.js";
import { callLLMWithJSON } from "../llm.js";

const SYSTEM_PROMPT = `You are a senior software architect reviewing a system design.
Analyze the given architecture and return structured feedback.

Return a JSON object with:
- strengths: string[] - what the architecture does well
- risks: string[] - gaps, risks, or missing components
- suggestions: array of { component, issue, recommendation, reasoning }
- overall: string - one-sentence summary`;

export async function reviewArchitecture(
  description: string,
  components: Array<{ name: string; source: string }>,
  config: Config
): Promise<ArchitectureReview> {
  const componentsText = components
    .map((c) => `- ${c.name} (from ${c.source})`)
    .join("\n");

  const prompt = `Project description: "${description}"

Components selected:
${componentsText}

Review this architecture and provide actionable feedback.`;

  return callLLMWithJSON<ArchitectureReview>(prompt, SYSTEM_PROMPT, config);
}
