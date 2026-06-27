export interface RepoInfo {
  fullName: string;
  htmlUrl: string;
  description: string | null;
  stars: number;
  language: string | null;
  topics: string[];
  defaultBranch: string;
}

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
}

export interface ArchitectureReview {
  strengths: string[];
  risks: string[];
  suggestions: Suggestion[];
  overall: string;
}

export interface Suggestion {
  component: string;
  issue: string;
  recommendation: string;
  reasoning: string;
}

export interface CanvasData {
  description: string;
  repos: RepoInfo[];
  diagrams: DiagramResult[];
}
