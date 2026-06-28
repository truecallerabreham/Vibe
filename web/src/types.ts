export interface DiagramComponent {
  name: string;
  path: string;
  description: string;
  dependencies: string[];
  category: string;
}

export interface DiagramResult {
  repoFullName: string;
  mermaid: string;
  explanation: string;
  components: DiagramComponent[];
  graphJson: Record<string, unknown>;
  cached: boolean;
  source?: "gitdiagram" | "llm";
}

export interface RepoInfo {
  fullName: string;
  htmlUrl: string;
  description: string | null;
  stars: number;
  language: string | null;
}

export interface CanvasData {
  description: string;
  repos: RepoInfo[];
  diagrams: DiagramResult[];
}
