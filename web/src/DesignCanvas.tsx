import React, { useRef, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Node,
  Edge,
  Connection,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface DiagramComponent {
  name: string;
  path: string;
  description: string;
  dependencies: string[];
  category: string;
}

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

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] || "#1e1e2e";
}

interface DragData {
  component: DiagramComponent;
  repoFullName: string;
}

export function DesignCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<{
    screenToFlowPosition: (pos: { x: number; y: number }) => { x: number; y: number };
  } | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: "smoothstep", style: { stroke: "#6a6aff", strokeWidth: 2 } }, eds));
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/arc-component");
      if (!raw || !reactFlowInstance || !reactFlowWrapper.current) return;

      const dragData: DragData = JSON.parse(raw);
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: Node = {
        id: `design:${dragData.repoFullName}:${dragData.component.name}:${Date.now()}`,
        type: "default",
        position,
        data: {
          label: dragData.component.name,
          repoFullName: dragData.repoFullName,
          component: dragData.component,
        },
        style: {
          background: getCategoryColor(dragData.component.category),
          border: "1px solid #6a6aff",
          borderRadius: 10,
          padding: "12px 16px",
          width: 220,
          fontSize: 13,
          color: "#eef",
          boxShadow: "0 2px 12px rgba(106,106,255,0.2)",
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes],
  );

  const onInit = useCallback((instance: { screenToFlowPosition: (pos: { x: number; y: number }) => { x: number; y: number } }) => {
    setReactFlowInstance(instance);
  }, []);

  return (
    <div ref={reactFlowWrapper} style={{ width: "100%", height: "100%", position: "relative" }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
          attributionPosition="bottom-left"
          colorMode="dark"
          minZoom={0.1}
          maxZoom={2}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
          <Controls />
          <MiniMap
            style={{ background: "#1a1a1a" }}
            nodeColor="#3a3a5c"
            maskColor="rgba(0,0,0,0.7)"
          />
        </ReactFlow>
      </ReactFlowProvider>

      <div style={{
        position: "absolute",
        top: 16,
        left: 16,
        padding: "10px 16px",
        background: "rgba(20,20,35,0.9)",
        border: "1px solid #444",
        borderRadius: 8,
        fontSize: 13,
        color: "#888",
        pointerEvents: "none",
        backdropFilter: "blur(4px)",
      }}>
        Drag components from reference diagrams to compose your architecture
      </div>
    </div>
  );
}
