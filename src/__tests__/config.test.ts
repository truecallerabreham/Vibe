import { describe, it, expect } from "vitest";

describe("Config", () => {
  it("loads environment variables", () => {
    const prevKey = process.env.ARC_OPENROUTER_KEY;
    process.env.ARC_OPENROUTER_KEY = "test-key";

    // Dynamic import to get fresh module state
    import("../config.js").then(({ loadConfig, validateConfig }) => {
      const config = loadConfig();
      expect(config.openrouterKey).toBe("test-key");

      const errors = validateConfig(config);
      expect(errors.length).toBeGreaterThan(0); // GITHUB_TOKEN still missing

      process.env.ARC_OPENROUTER_KEY = prevKey;
    });
  });

  it("reports missing required config", async () => {
    const { loadConfig, validateConfig } = await import("../config.js");
    // Ensure no env vars are set
    const prevKey = process.env.ARC_OPENROUTER_KEY;
    const prevGh = process.env.GITHUB_TOKEN;
    delete process.env.ARC_OPENROUTER_KEY;
    delete process.env.GITHUB_TOKEN;

    const config = loadConfig();
    const errors = validateConfig(config);
    expect(errors.length).toBe(2);
    expect(errors[0]).toContain("ARC_OPENROUTER_KEY");

    process.env.ARC_OPENROUTER_KEY = prevKey;
    process.env.GITHUB_TOKEN = prevGh;
  });
});
