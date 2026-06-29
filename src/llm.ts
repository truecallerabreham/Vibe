import OpenAI from "openai";
import { Config, getProviderBaseUrl } from "./config.js";

function getApiKey(config: Config): string {
  switch (config.llmProvider) {
    case "openrouter": return config.openrouterKey;
    case "groq": return config.groqKey;
    case "glm": return config.glmKey;
    case "gemini": return config.geminiKey;
  }
}

function getModel(config: Config): string {
  switch (config.llmProvider) {
    case "openrouter": return config.openrouterModel;
    case "groq": return config.groqModel;
    case "glm": return config.glmModel;
    case "gemini": return config.geminiModel;
  }
}

let client: OpenAI | null = null;
let clientProvider: string | null = null;

function getClient(config: Config): OpenAI {
  const provider = config.llmProvider;
  if (!client || clientProvider !== provider) {
    client = new OpenAI({
      baseURL: getProviderBaseUrl(provider),
      apiKey: getApiKey(config),
    });
    clientProvider = provider;
  }
  return client;
}

export async function callLLM(prompt: string, system: string, config: Config): Promise<string> {
  const openai = getClient(config);

  const res = await openai.chat.completions.create({
    model: getModel(config),
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 4000,
  });

  return res.choices[0]?.message?.content?.trim() || "";
}

function sanitizeValue(val: unknown): unknown {
  if (typeof val === "string") {
    return val.replace(/^```(?:mermaid)?\s*\n?|```\s*$/gi, "").trim();
  }
  return val;
}

function sanitizeResult<T>(obj: T): T {
  if (obj && typeof obj === "object") {
    const result = { ...obj } as Record<string, unknown>;
    for (const key of Object.keys(result)) {
      result[key] = sanitizeValue(result[key]);
    }
    return result as T;
  }
  return obj;
}

export async function callLLMWithJSON<T>(prompt: string, system: string, config: Config): Promise<T> {
  const text = await callLLM(prompt, system, config);
  const cleaned = text.replace(/```(?:json)?\s*/gi, "").trim();
  const parsed = JSON.parse(cleaned) as T;
  return sanitizeResult(parsed);
}
