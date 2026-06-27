import React, { useEffect, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ComponentDetailPanel } from "./components/ComponentDetailPanel";
import { DagreLayout } from "./canvas/layout";
import { ReviewPanel } from "./review/ReviewPanel";

interface DiagramComponent {
  name: string;
  path: string;
  description: string;
  dependencies: string[];
  category: string;
}

interface DiagramResult {
  repoFullName: string;
  mermaid: string;
  explanation: string;
  components: DiagramComponent[];
  graphJson: Record<string, unknown>;
  cached: boolean;
}

interface CanvasData {
  description: string;
  repos: Array<{
    fullName: string;
    htmlUrl: string;
    description: string | null;
    stars: number;
    language: string | null;
  }>;
  diagrams: DiagramResult[];
}

function buildNodesFromComponents(
  diagram: DiagramResult,
  offsetX: number,
  offsetY: number
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const comps = diagram.components;

  if (!comps || comps.length === 0) return { nodes, edges };

  // Build a node for each component
  const componentNodes = comps.map((comp, i) => ({
    id: `${diagram.repoFullName}:${comp.name}`,
    type: "default",
    position: { x: 0, y: i * 120 },
    data: {
      label: comp.name,
      component: comp,
      repoFullName: diagram.repoFullName,
    },
    style: {
      background: getCategoryColor(comp.category),
      border: "1px solid #555",
      borderRadius: 8,
      padding: 10,
      width: 200,
      fontSize: 12,
    },
  }));

  // Build edges from dependencies
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
          style: { stroke: "#666", strokeWidth: 1.5 },
        });
      }
    }
  }

  const laidOut = DagreLayout(componentNodes, componentEdges, "TB");

  // Apply offset
  for (const node of laidOut.nodes) {
    node.position.x += offsetX;
    node.position.y += offsetY;
    node.data = {
      ...node.data,
      detail: node.data.component,
    };
  }

  return { nodes: laidOut.nodes, edges: laidOut.edges };
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    database: "#1a1a2e",
    cache: "#16213e",
    queue: "#0f3460",
    api: "#1b1b3a",
    frontend: "#2d1b3a",
    service: "#1a3a2e",
    storage: "#2e1a1a",
    auth: "#3a2e1a",
    monitoring: "#1a2e3a",
  };
  return colors[category.toLowerCase()] || "#1e1e2e";
}

function App() {
  const [data, setData] = useState<CanvasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("reference");
  const [selectedComponent, setSelectedComponent] = useState<{
    repoFullName: string;
    component: DiagramComponent;
  } | null>(null);

  const [designNodes, setDesignNodes, onDesignNodesChange] = useNodesState<Node>([]);
  const [designEdges, setDesignEdges, onDesignEdgesChange] = useEdgesState<Edge>([]);

  // Fetch data from the local API
  useEffect(() => {
    fetch("/api/data")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: CanvasData) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  // Build reference diagram nodes
  const [refNodes, setRefNodes, onRefNodesChange] = useNodesState<Node>([]);
  const [refEdges, setRefEdges, onRefEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (!data) return;
    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];
    let offsetY = 0;

    for (const diagram of data.diagrams) {
      const { nodes, edges } = buildNodesFromComponents(diagram, 50, offsetY + 40);
      allNodes.push(...nodes);
      allEdges.push(...edges);
      offsetY += Math.max(nodes.length * 130, 200);
    }

    // Add title nodes for each repo
    const titleNodes: Node[] = data.diagrams.map((d, i) => ({
      id: `title:${d.repoFullName}`,
      type: "default",
      position: { x: 50, y: i * Math.max(data.diagrams[i].components.length * 130 + 40, 240) },
      data: {
        label: `${d.repoFullName}`,
        isTitle: true,
      },
      style: {
        background: "#2a2a3e",
        border: "1px solid #888",
        borderRadius: 8,
        padding: "8px 16px",
        width: 220,
        fontSize: 13,
        fontWeight: "bold",
        color: "#ccc",
      },
      draggable: false,
    }));

    setRefNodes([...titleNodes, ...allNodes]);
    setRefEdges(allEdges);
  }, [data]);

  const onRefNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const comp = (node.data as Record<string, unknown>).component as DiagramComponent | undefined;
      const repo = (node.data as Record<string, unknown>).repoFullName as string | undefined;
      if (comp && repo) {
        setSelectedComponent({ repoFullName: repo, component: comp });
      }
    },
    []
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#111", color: "#ccc", fontFamily: "system-ui" }}>
        Loading architecture data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#111", color: "#e55", fontFamily: "system-ui" }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#111", color: "#ccc", fontFamily: "system-ui" }}>
      <header style={{ padding: "12px 20px", borderBottom: "1px solid #333", display: "flex", alignItems: "center", gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 18, color: "#fff" }}>Arc</h1>
        <span style={{ color: "#888", fontSize: 13 }}>{data?.description}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={() => setActiveTab("reference")}
            style={{
              padding: "6px 14px",
              background: activeTab === "reference" ? "#3a3a5c" : "#222",
              border: "1px solid #555",
              borderRadius: 6,
              color: "#ccc",
              cursor: "pointer",
            }}
          >
            Reference Architectures
          </button>
          <button
            onClick={() => setActiveTab("design")}
            style={{
              padding: "6px 14px",
              background: activeTab === "design" ? "#3a3a5c" : "#222",
              border: "1px solid #555",
              borderRadius: 6,
              color: "#ccc",
              cursor: "pointer",
            }}
          >
            Design Your System
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 1, position: "relative" }}>
          {activeTab === "reference" && (
            <ReactFlowProvider>
              <ReactFlow
                nodes={refNodes}
                edges={refEdges}
                onNodeClick={onRefNodeClick}
                fitView
                attributionPosition="bottom-left"
                colorMode="dark"
                minZoom={0.1}
                maxZoom={2}
                nodesDraggable={false}
                nodesConnectable={false}
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
          )}

          {activeTab === "design" && (
            <ReactFlowProvider>
              <ReactFlow
                nodes={designNodes}
                edges={designEdges}
                onNodesChange={onDesignNodesChange}
                onEdgesChange={onDesignEdgesChange}
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
          )}
        </div>

        {selectedComponent && (
          <ComponentDetailPanel
            component={selectedComponent.component}
            repoFullName={selectedComponent.repoFullName}
            onClose={() => setSelectedComponent(null)}
          />
        )}

        {activeTab === "design" && !selectedComponent && (
          <ReviewPanel description={data?.description || ""} />
        )}
      </div>

      {data && (
        <div style={{ padding: "8px 20px", borderTop: "1px solid #333", display: "flex", gap: 20, fontSize: 12, color: "#666" }}>
          {data.diagrams.map((d) => (
            <span key={d.repoFullName}>
              {d.repoFullName} {d.cached ? "(cached)" : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
