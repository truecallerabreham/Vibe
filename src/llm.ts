import OpenAI from "openai";
import { Config } from "./config.js";

let client: OpenAI | null = null;

function getClient(config: Config): OpenAI {
  if (!client) {
    client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: config.openrouterKey,
    });
  }
  return client;
}

export async function callLLM(prompt: string, system: string, config: Config): Promise<string> {
  const openai = getClient(config);

  const res = await openai.chat.completions.create({
    model: config.openrouterModel,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 4000,
  });

  return res.choices[0]?.message?.content?.trim() || "";
}

export async function callLLMWithJSON<T>(prompt: string, system: string, config: Config): Promise<T> {
  const text = await callLLM(prompt, system, config);
  const cleaned = text.replace(/```(?:json)?\s*/gi, "").trim();
  return JSON.parse(cleaned) as T;
}
