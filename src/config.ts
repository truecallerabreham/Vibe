import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export type LlmProvider = "openrouter" | "groq" | "glm" | "gemini";

export interface Config {
  llmProvider: LlmProvider;
  openrouterKey: string;
  openrouterModel: string;
  groqKey: string;
  groqModel: string;
  glmKey: string;
  glmModel: string;
  geminiKey: string;
  geminiModel: string;
  githubToken: string;
  gitdiagramUrl: string;
}

const PROVIDER_BASE_URLS: Record<LlmProvider, string> = {
  openrouter: "https://openrouter.ai/api/v1",
  groq: "https://api.groq.com/openai/v1",
  glm: "https://open.bigmodel.cn/api/paas/v4",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
};

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  openrouter: "deepseek/deepseek-chat",
  groq: "llama-3.3-70b-versatile",
  glm: "glm-4-flash",
  gemini: "gemini-2.0-flash",
};

export function getProviderBaseUrl(provider: LlmProvider): string {
  return PROVIDER_BASE_URLS[provider];
}

export function getDefaultModel(provider: LlmProvider): string {
  return DEFAULT_MODELS[provider];
}

function loadYaml(path: string): Record<string, string> {
  try {
    const content = readFileSync(path, "utf-8");
    const result: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx === -1) continue;
      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();
      result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}

function pickProviderKey(configMap: Record<string, string>): LlmProvider {
  const raw = process.env.ARC_LLM_PROVIDER || configMap["llm_provider"] || "openrouter";
  if (["openrouter", "groq", "glm", "gemini"].includes(raw)) return raw as LlmProvider;
  return "openrouter";
}

export function loadConfig(): Config {
  const yamlPath = join(homedir(), ".arcrc");
  const yamlConfig = existsSync(yamlPath) ? loadYaml(yamlPath) : {};
  const provider = pickProviderKey(yamlConfig);

  return {
    llmProvider: provider,
    openrouterKey: process.env.ARC_OPENROUTER_KEY || yamlConfig["openrouter_key"] || "",
    openrouterModel: process.env.ARC_OPENROUTER_MODEL || yamlConfig["openrouter_model"] || DEFAULT_MODELS.openrouter,
    groqKey: process.env.ARC_GROQ_KEY || yamlConfig["groq_key"] || "",
    groqModel: process.env.ARC_GROQ_MODEL || yamlConfig["groq_model"] || DEFAULT_MODELS.groq,
    glmKey: process.env.ARC_GLM_KEY || yamlConfig["glm_key"] || "",
    glmModel: process.env.ARC_GLM_MODEL || yamlConfig["glm_model"] || DEFAULT_MODELS.glm,
    geminiKey: process.env.ARC_GEMINI_KEY || yamlConfig["gemini_key"] || "",
    geminiModel: process.env.ARC_GEMINI_MODEL || yamlConfig["gemini_model"] || DEFAULT_MODELS.gemini,
    githubToken: process.env.GITHUB_TOKEN || yamlConfig["github_token"] || "",
    gitdiagramUrl: process.env.ARC_GITDIAGRAM_URL || yamlConfig["gitdiagram_url"] || "http://localhost:3001",
  };
}

export function validateConfig(config: Config): string[] {
  const errors: string[] = [];
  const providerKeyName: Record<LlmProvider, string> = {
    openrouter: "ARC_OPENROUTER_KEY / openrouter_key",
    groq: "ARC_GROQ_KEY / groq_key",
    glm: "ARC_GLM_KEY / glm_key",
    gemini: "ARC_GEMINI_KEY / gemini_key",
  };

  const key = config.llmProvider === "openrouter" ? config.openrouterKey
    : config.llmProvider === "groq" ? config.groqKey
    : config.llmProvider === "glm" ? config.glmKey
    : config.geminiKey;

  if (!key) {
    errors.push(`LLM API key for provider "${config.llmProvider}" is missing — set ${providerKeyName[config.llmProvider]} in env or ~/.arcrc`);
  }
  if (!config.githubToken) errors.push("GITHUB_TOKEN is required (set env var or add github_token to ~/.arcrc)");
  return errors;
}
