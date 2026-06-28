import { describe, it, expect } from "vitest";

describe("GitDiagram SSE parsing", () => {
  it("parses a complete SSE stream into events", async () => {
    const { fetchDiagramFromGitDiagram } = await import("../diagram/gitdiagram-client.js");

    // Test the internal parseSSEStream via a module-level test
    // We'll test through fetchDiagramFromGitDiagram with a mocked fetch
    const sse = [
      `data: ${JSON.stringify({ status: "started", session_id: "s1" })}`,
      "",
      `data: ${JSON.stringify({ status: "explanation_sent", session_id: "s1" })}`,
      "",
      `data: ${JSON.stringify({ status: "explanation", session_id: "s1" })}`,
      "",
      `data: ${JSON.stringify({ status: "complete", session_id: "s1", diagram: "flowchart TD\\nA-->B", explanation: "test explanation", graph: { nodes: [{ id: "1", label: "A", path: "/a", category: "api", dependencies: [] }], edges: [] } })}`,
      "",
    ].join("\n");

    // Use a global mock to verify parsing works
    const originalFetch = globalThis.fetch;
    try {
      let requestBody: unknown = null;
      globalThis.fetch = async (url: unknown, init?: RequestInit) => {
        requestBody = init?.body;
        return new Response(sse, { status: 200, headers: { "Content-Type": "text/event-stream" } });
      };

      const result = await fetchDiagramFromGitDiagram(
        { fullName: "owner/repo", htmlUrl: "https://github.com/owner/repo", description: "test", stars: 10, language: "ts", topics: [], defaultBranch: "main" },
        { llmProvider: "groq", groqKey: "test", groqModel: "test", openrouterKey: "", openrouterModel: "", glmKey: "", glmModel: "", geminiKey: "", geminiModel: "", githubToken: "token", gitdiagramUrl: "http://localhost:3001" },
        "http://localhost:3001",
      );

      expect(result.repoFullName).toBe("owner/repo");
      expect(result.mermaid).toContain("flowchart TD");
      expect(result.explanation).toBe("test explanation");
      expect(result.components).toHaveLength(1);
      expect(result.components[0].name).toBe("A");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("handles empty components gracefully", async () => {
    const { fetchDiagramFromGitDiagram } = await import("../diagram/gitdiagram-client.js");

    const sse = [
      `data: ${JSON.stringify({ status: "complete", session_id: "s1", diagram: "", explanation: "", graph: { nodes: [], edges: [] } })}`,
      "",
    ].join("\n");

    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => new Response(sse, { status: 200 });
      const result = await fetchDiagramFromGitDiagram(
        { fullName: "owner/repo", htmlUrl: "", description: null, stars: 0, language: null, topics: [], defaultBranch: "main" },
        { llmProvider: "groq", groqKey: "test", groqModel: "test", openrouterKey: "", openrouterModel: "", glmKey: "", glmModel: "", geminiKey: "", geminiModel: "", githubToken: "", gitdiagramUrl: "http://localhost:3001" },
        "http://localhost:3001",
      );

      expect(result.components).toEqual([]);
      expect(result.mermaid).toBe("");
      expect(result.graphJson).toEqual({ nodes: [], edges: [] });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("throws on error event", async () => {
    const { fetchDiagramFromGitDiagram } = await import("../diagram/gitdiagram-client.js");

    const sse = [
      `data: ${JSON.stringify({ status: "error", error: "Repository too large", error_code: "TOKEN_LIMIT_EXCEEDED" })}`,
      "",
    ].join("\n");

    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => new Response(sse, { status: 200 });
      await expect(
        fetchDiagramFromGitDiagram(
          { fullName: "owner/repo", htmlUrl: "", description: null, stars: 0, language: null, topics: [], defaultBranch: "main" },
          { llmProvider: "groq", groqKey: "test", groqModel: "test", openrouterKey: "", openrouterModel: "", glmKey: "", glmModel: "", geminiKey: "", geminiModel: "", githubToken: "", gitdiagramUrl: "http://localhost:3001" },
          "http://localhost:3001",
        )
      ).rejects.toThrow("Repository too large");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("throws on non-ok response", async () => {
    const { fetchDiagramFromGitDiagram } = await import("../diagram/gitdiagram-client.js");

    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => new Response("Not Found", { status: 404 });
      await expect(
        fetchDiagramFromGitDiagram(
          { fullName: "owner/repo", htmlUrl: "", description: null, stars: 0, language: null, topics: [], defaultBranch: "main" },
          { llmProvider: "groq", groqKey: "test", groqModel: "test", openrouterKey: "", openrouterModel: "", glmKey: "", glmModel: "", geminiKey: "", geminiModel: "", githubToken: "", gitdiagramUrl: "http://localhost:3001" },
          "http://localhost:3001",
        )
      ).rejects.toThrow("GitDiagram API error 404");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("isGitDiagramAvailable resolves false on connection error", async () => {
    const { isGitDiagramAvailable } = await import("../diagram/gitdiagram-client.js");

    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => { throw new Error("connection refused"); };
      const result = await isGitDiagramAvailable("http://localhost:3001");
      expect(result).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
