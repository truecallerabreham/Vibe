import { Node, Edge } from "@xyflow/react";

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

export function DagreLayout(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
): LayoutResult {
  // Simple grid-based layout since dagre is a heavy dependency
  // This places nodes in a grid and uses dependency info for ordering
  const hasDeps = edges.length > 0;

  if (!hasDeps) {
    // Simple grid layout
    const cols = Math.ceil(Math.sqrt(nodes.length));
    return {
      nodes: nodes.map((node, i) => ({
        ...node,
        position: {
          x: (i % cols) * 260,
          y: Math.floor(i / cols) * 140,
        },
      })),
      edges,
    };
  }

  // Topological sort based layout
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  }

  for (const edge of edges) {
    const targets = adjList.get(edge.source) || [];
    targets.push(edge.target);
    adjList.set(edge.source, targets);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  // Kahn's algorithm for topological sort
  const queue: string[] = [];
  const levels = new Map<string, number>();

  for (const [id, deg] of inDegree) {
    if (deg === 0) {
      queue.push(id);
      levels.set(id, 0);
    }
  }

  let maxLevel = 0;
  while (queue.length > 0) {
    const current = queue.shift()!;
    const level = levels.get(current) || 0;
    maxLevel = Math.max(maxLevel, level);

    for (const neighbor of adjList.get(current) || []) {
      const newDeg = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
        levels.set(neighbor, level + 1);
      }
    }
  }

  // Layer assignment
  const layerMap = new Map<number, string[]>();
  for (const [id, level] of levels) {
    const layer = layerMap.get(level) || [];
    layer.push(id);
    layerMap.set(level, layer);
  }

  const spacing = direction === "TB" ? { x: 260, y: 140 } : { x: 260, y: 140 };

  return {
    nodes: nodes.map((node) => {
      const level = levels.get(node.id) || 0;
      const layer = layerMap.get(level) || [];
      const idx = layer.indexOf(node.id);
      return {
        ...node,
        position: {
          x: idx * spacing.x + (direction === "TB" ? 0 : level * spacing.y),
          y: level * spacing.y + (direction === "TB" ? 0 : idx * spacing.x),
        },
      };
    }),
    edges,
  };
}
