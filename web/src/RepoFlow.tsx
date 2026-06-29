import React, { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DiagramResult, DiagramComponent } from "./types";
import { DagreLayout } from "./canvas/layout";

const CATEGORY_COLORS: Record<string, string> = {
  database: "#1a1a3e",
  cache: "#16213e",
  queue: "#0f3460",
  api: "#1e1e4a",
  frontend: "#3a1a3e",
  service: "#1a3a2e",
  storage: "#3a1a1a",
  auth: "#3a2e1a",
  monitoring: "#1a2e3a",
  testing: "#1e2e1e",
  utility: "#2a2a2a",
};

const CATEGORY_TEXT_COLORS: Record<string, string> = {
  database: "#8af",
  cache: "#6cf",
  queue: "#6af",
  api: "#a8f",
  frontend: "#f8a",
  service: "#4e8",
  storage: "#f66",
  auth: "#ea4",
  monitoring: "#4cf",
  testing: "#8c8",
  utility: "#aaa",
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] || "#1e1e2e";
}

function getCategoryTextColor(category: string): string {
  return CATEGORY_TEXT_COLORS[category.toLowerCase()] || "#ccc";
}

interface Props {
  diagram: DiagramResult;
  onComponentClick: (repoFullName: string, component: DiagramComponent) => void;
}

export function RepoFlow({ diagram, onComponentClick }: Props) {
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const comp = (node.data as Record<string, unknown>).component as DiagramComponent | undefined;
      if (comp) {
        onComponentClick(diagram.repoFullName, comp);
      }
    },
    [diagram.repoFullName, onComponentClick],
  );

  const { nodes, edges } = useMemo(() => {
    const comps = diagram.components;
    if (!comps || comps.length === 0) return { nodes: [], edges: [] };

    const componentNodes: Node[] = comps.map((comp, i) => ({
      id: `${diagram.repoFullName}:${comp.name}`,
      type: "default",
      position: { x: 0, y: i * 110 },
      data: {
        label: comp.name,
        component: comp,
        repoFullName: diagram.repoFullName,
      },
      style: {
        background: getCategoryColor(comp.category),
        border: `1px solid ${getCategoryTextColor(comp.category)}44`,
        borderRadius: 10,
        padding: "10px 14px",
        width: 220,
        fontSize: 12,
        color: "#eef",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      },
    }));

    const componentEdges: Edge[] = [];
    for (const comp of comps) {
      for (const dep of comp.dependencies) {
        const sourceId = `${diagram.repoFullName}:${dep}`;
        const targetId = `${diagram.repoFullName}:${comp.name}`;
        if (comps.some((c) => c.name === dep)) {
          componentEdges.push({
            id: `${sourceId}->${targetId}`,
            source: sourceId,
            target: targetId,
            type: "smoothstep",
            animated: false,
            style: { stroke: "#555", strokeWidth: 1.5 },
          });
        }
      }
    }

    const laidOut = DagreLayout(componentNodes, componentEdges, "TB");

    for (const node of laidOut.nodes) {
      const comp = (node.data as Record<string, unknown>).component as DiagramComponent;
      node.data = { ...node.data, detail: comp };
    }

    return { nodes: laidOut.nodes, edges: laidOut.edges };
  }, [diagram]);

  return (
    <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
        colorMode="dark"
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#2a2a2a" />
      </ReactFlow>
    </ReactFlowProvider>
  );
}
