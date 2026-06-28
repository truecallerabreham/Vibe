import { Config } from "../config.js";
import { RepoInfo, DiagramResult, DiagramComponent } from "../types.js";

interface SSEEvent {
  status: string;
  session_id?: string;
  error?: string;
  error_code?: string;
  diagram?: string;
  explanation?: string;
  graph?: {
    nodes?: Array<{
      id: string;
      label: string;
      path: string;
      category: string;
      dependencies: string[];
    }>;
    edges?: Array<{
      source: string;
      target: string;
    }>;
  };
  message?: string;
  validation_error?: string;
}

function parseSSEStream(text: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const lines = text.split("\n");
  let currentData = "";

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      currentData += line.slice(6);
    } else if (line.trim() === "" && currentData) {
      try {
        events.push(JSON.parse(currentData));
      } catch {
        // skip malformed JSON
      }
      currentData = "";
    }
  }

  if (currentData) {
    try {
      events.push(JSON.parse(currentData));
    } catch {
      // skip
    }
  }

  return events;
}

function mapGitDiagramResult(events: SSEEvent[], repo: RepoInfo): DiagramResult {
  const completeEvent = events.find((e) => e.status === "complete");
  const errorEvent = events.find((e) => e.status === "error");

  if (!completeEvent && errorEvent) {
    throw new Error(`GitDiagram error: ${errorEvent.error || errorEvent.validation_error || "unknown error"}`);
  }

  if (!completeEvent) {
    throw new Error("GitDiagram did not return a complete result");
  }

  const diagram = completeEvent.diagram || "";
  const explanation = completeEvent.explanation || "";
  const graph = completeEvent.graph;

  const components: DiagramComponent[] = (graph?.nodes || []).map((node) => ({
    name: node.label || node.id,
    path: node.path || "",
    description: "",
    dependencies: node.dependencies || [],
    category: node.category || "uncategorized",
  }));

  const graphJson: Record<string, unknown> = graph ? {
    nodes: graph.nodes?.map((n) => ({ id: n.id, label: n.label, category: n.category })),
    edges: graph.edges,
  } : {};

  return {
    repoFullName: repo.fullName,
    mermaid: diagram,
    explanation,
    components,
    graphJson,
    cached: false,
  };
}

export async function fetchDiagramFromGitDiagram(
  repo: RepoInfo,
  config: Config,
  gitdiagramUrl: string,
): Promise<DiagramResult> {
  const [owner, name] = repo.fullName.split("/");
  const url = `${gitdiagramUrl.replace(/\/+$/, "")}/generate/stream`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: owner,
      repo: name,
      github_pat: config.githubToken,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(`GitDiagram API error ${res.status}: ${errorBody.slice(0, 200)}`);
  }

  const text = await res.text();
  const events = parseSSEStream(text);
  return mapGitDiagramResult(events, repo);
}

export function isGitDiagramAvailable(gitdiagramUrl: string): Promise<boolean> {
  return fetch(`${gitdiagramUrl.replace(/\/+$/, "")}/healthz`, {
    method: "GET",
    signal: AbortSignal.timeout(5000),
  })
    .then((res) => res.ok)
    .catch(() => false);
}
