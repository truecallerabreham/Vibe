import React, { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
  Edge,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CanvasData, DiagramComponent } from "./types";
import { DagreLayout } from "./canvas/layout";
import DraggableNode from "./DraggableNode";

const nodeTypes = {
  draggable: DraggableNode,
};

function buildNodesFromComponents(
  diagram: { repoFullName: string; components: DiagramComponent[] },
  offsetX: number,
  offsetY: number,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const comps = diagram.components;

  if (!comps || comps.length === 0) return { nodes, edges };

  const componentNodes: Node[] = comps.map((comp, i) => ({
    id: `${diagram.repoFullName}:${comp.name}`,
    type: "draggable",
    position: { x: 0, y: i * 120 },
    data: {
      component: comp,
      repoFullName: diagram.repoFullName,
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
    node.position.x += offsetX;
    node.position.y += offsetY;
  }

  return { nodes: laidOut.nodes, edges: laidOut.edges };
}

interface Props {
  data: CanvasData;
  onComponentClick: (repoFullName: string, component: DiagramComponent) => void;
}

export function ReferenceCanvas({ data, onComponentClick }: Props) {
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const comp = (node.data as Record<string, unknown>).component as DiagramComponent | undefined;
      const repo = (node.data as Record<string, unknown>).repoFullName as string | undefined;
      if (comp && repo) {
        onComponentClick(repo, comp);
      }
    },
    [onComponentClick],
  );

  const { nodes, edges } = useMemo(() => {
    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];
    let offsetY = 0;

    for (const diagram of data.diagrams) {
      const repoHeader: Node = {
        id: `header:${diagram.repoFullName}`,
        type: "draggable",
        position: { x: 50, y: offsetY },
        data: { label: `📦 ${diagram.repoFullName}`, isHeader: true },
        draggable: false,
      };
      allNodes.push(repoHeader);
      offsetY += 60;

      const { nodes: compNodes, edges: compEdges } = buildNodesFromComponents(
        diagram,
        50,
        offsetY,
      );
      allNodes.push(...compNodes);
      allEdges.push(...compEdges);

      const maxH = compNodes.length > 0
        ? Math.max(...compNodes.map((n) => n.position.y + 150)) - offsetY
        : 200;
      offsetY += maxH + 60;
    }

    return { nodes: allNodes, edges: allEdges };
  }, [data]);

  return (
    <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
        colorMode="dark"
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#2a2a2a" />
        <Controls showInteractive={false} />
        <MiniMap
          style={{ background: "#111118" }}
          nodeColor="#3a3a6c"
          maskColor="rgba(0,0,0,0.75)"
        />
      </ReactFlow>
    </ReactFlowProvider>
  );
}
