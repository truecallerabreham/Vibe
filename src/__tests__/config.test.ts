import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Config", () => {
  const OLD = { ...process.env };

  afterEach(() => {
    process.env = { ...OLD };
  });

  it("loads provider from env and validates correctly", async () => {
    const { loadConfig, validateConfig } = await import("../config.js");

    process.env.ARC_LLM_PROVIDER = "openrouter";
    process.env.ARC_OPENROUTER_KEY = "sk-or-v1-test-env";
    process.env.GITHUB_TOKEN = "ghp_test_env";

    const config = loadConfig();
    expect(config.llmProvider).toBe("openrouter");
    expect(config.openrouterKey).toBe("sk-or-v1-test-env");

    const errors = validateConfig(config);
    expect(errors.length).toBe(0);
  });

  it("validates groq provider errors when key is missing from yaml", async () => {
    const { loadConfig, validateConfig } = await import("../config.js");

    process.env.ARC_LLM_PROVIDER = "groq";
    delete process.env.ARC_GROQ_KEY;

    const config = loadConfig();
    expect(config.llmProvider).toBe("groq");
    expect(config.groqKey).toBe("");

    const errors = validateConfig(config);
    expect(errors.some(e => e.includes("groq"))).toBe(true);
  });

  it("defaults to openrouter provider when nothing is set", async () => {
    const { loadConfig } = await import("../config.js");

    delete process.env.ARC_LLM_PROVIDER;

    const config = loadConfig();
    expect(config.llmProvider).toBe("openrouter");
  });

  it("getProviderBaseUrl and getDefaultModel return correct values", async () => {
    const { getProviderBaseUrl, getDefaultModel } = await import("../config.js");

    expect(getProviderBaseUrl("groq")).toContain("groq.com");
    expect(getProviderBaseUrl("glm")).toContain("bigmodel.cn");
    expect(getProviderBaseUrl("gemini")).toContain("googleapis.com");
    expect(getProviderBaseUrl("openrouter")).toContain("openrouter.ai");
    expect(getDefaultModel("groq").length).toBeGreaterThan(0);
    expect(getDefaultModel("openrouter")).toBe("deepseek/deepseek-chat");
  });

  it("pickProviderKey uses env var over yaml", async () => {
    const { loadConfig } = await import("../config.js");

    process.env.ARC_LLM_PROVIDER = "gemini";

    const config = loadConfig();
    expect(config.llmProvider).toBe("gemini");
  });
});
