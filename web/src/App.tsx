import React, { useEffect, useState, useCallback } from "react";
import { Header } from "./Header";
import { RepoFlow } from "./RepoFlow";
import { DesignCanvas } from "./DesignCanvas";
import { ComponentDetailPanel } from "./components/ComponentDetailPanel";
import { CanvasData, DiagramComponent } from "./types";

function App() {
  const [data, setData] = useState<CanvasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<{
    repoFullName: string;
    component: DiagramComponent;
  } | null>(null);

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

  const onComponentClick = useCallback(
    (repoFullName: string, component: DiagramComponent) => {
      setSelectedComponent({ repoFullName, component });
    },
    [],
  );

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0d0d14",
        color: "#aaa",
        fontFamily: "system-ui",
        gap: 16,
      }}>
        <div style={{ fontSize: 28, opacity: 0.6 }}>◈</div>
        <div style={{ fontSize: 14 }}>Loading architecture data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0d0d14",
        color: "#e55",
        fontFamily: "system-ui",
        gap: 16,
      }}>
        <div style={{ fontSize: 28 }}>⚠</div>
        <div style={{ fontSize: 14 }}>{error}</div>
      </div>
    );
  }

  const leftDiagram = data?.diagrams[0] || null;
  const rightDiagram = data?.diagrams[1] || null;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "#0d0d14",
      color: "#ccc",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <Header description={data?.description || ""} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left panel: first reference */}
        <div style={{
          width: "28%",
          minWidth: 280,
          borderRight: "1px solid #222",
          display: "flex",
          flexDirection: "column",
          background: "#111118",
        }}>
          <div style={{
            padding: "10px 14px",
            borderBottom: "1px solid #222",
            fontSize: 12,
            fontWeight: 600,
            color: "#888",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ color: "#6a6aff" }}>◰</span>
            {leftDiagram ? leftDiagram.repoFullName : "No reference"}
            {leftDiagram?.cached && <span style={{ color: "#666", fontSize: 10 }}>(cached)</span>}
          </div>
          <div style={{ flex: 1 }}>
            {leftDiagram && (
              <RepoFlow diagram={leftDiagram} onComponentClick={onComponentClick} />
            )}
          </div>
        </div>

        {/* Center panel: design canvas */}
        <div style={{
          flex: 1,
          minWidth: 300,
          borderRight: "1px solid #222",
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: "10px 14px",
            borderBottom: "1px solid #222",
            fontSize: 12,
            fontWeight: 600,
            color: "#888",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#111118",
            zIndex: 10,
          }}>
            <span style={{ color: "#4e8" }}>◇</span>
            Your Architecture
          </div>
          <div style={{ width: "100%", height: "100%" }}>
            <DesignCanvas />
          </div>
        </div>

        {/* Right panel: second reference */}
        <div style={{
          width: "28%",
          minWidth: 280,
          display: "flex",
          flexDirection: "column",
          background: "#111118",
        }}>
          <div style={{
            padding: "10px 14px",
            borderBottom: "1px solid #222",
            fontSize: 12,
            fontWeight: 600,
            color: "#888",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ color: "#6a6aff" }}>◰</span>
            {rightDiagram ? rightDiagram.repoFullName : "No reference"}
            {rightDiagram?.cached && <span style={{ color: "#666", fontSize: 10 }}>(cached)</span>}
          </div>
          <div style={{ flex: 1 }}>
            {rightDiagram && (
              <RepoFlow diagram={rightDiagram} onComponentClick={onComponentClick} />
            )}
          </div>
        </div>
      </div>

      {/* Side panel for component details */}
      {selectedComponent && (
        <div style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
        }}>
          <ComponentDetailPanel
            component={selectedComponent.component}
            repoFullName={selectedComponent.repoFullName}
            onClose={() => setSelectedComponent(null)}
          />
        </div>
      )}
    </div>
  );
}

export default App;
