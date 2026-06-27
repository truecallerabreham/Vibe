import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export interface Config {
  openrouterKey: string;
  githubToken: string;
  gitdiagramUrl: string;
  openrouterModel: string;
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

export function loadConfig(): Config {
  const yamlPath = join(homedir(), ".arcrc");
  const yamlConfig = existsSync(yamlPath) ? loadYaml(yamlPath) : {};

  return {
    openrouterKey: process.env.ARC_OPENROUTER_KEY || yamlConfig["openrouter_key"] || "",
    githubToken: process.env.GITHUB_TOKEN || yamlConfig["github_token"] || "",
    gitdiagramUrl: process.env.ARC_GITDIAGRAM_URL || yamlConfig["gitdiagram_url"] || "http://localhost:3001",
    openrouterModel: process.env.ARC_OPENROUTER_MODEL || yamlConfig["openrouter_model"] || "deepseek/deepseek-v4-flash:floor",
  };
}

export function validateConfig(config: Config): string[] {
  const errors: string[] = [];
  if (!config.openrouterKey) errors.push("ARC_OPENROUTER_KEY is required (set env var or add openrouter_key to ~/.arcrc)");
  if (!config.githubToken) errors.push("GITHUB_TOKEN is required (set env var or add github_token to ~/.arcrc)");
  return errors;
}
