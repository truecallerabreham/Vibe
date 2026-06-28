import React, { useEffect, useState, useCallback } from "react";
import { Header } from "./Header";
import { ReferenceCanvas } from "./ReferenceCanvas";
import { DesignCanvas } from "./DesignCanvas";
import { ComponentDetailPanel } from "./components/ComponentDetailPanel";
import { ReviewPanel } from "./review/ReviewPanel";
import { CanvasData, DiagramComponent } from "./types";

function App() {
  const [data, setData] = useState<CanvasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"reference" | "design">("reference");
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
        background: "#111",
        color: "#aaa",
        fontFamily: "system-ui",
        gap: 16,
      }}>
        <div style={{ fontSize: 24 }}>⏳</div>
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
        background: "#111",
        color: "#e55",
        fontFamily: "system-ui",
        gap: 16,
      }}>
        <div style={{ fontSize: 24 }}>⚠️</div>
        <div style={{ fontSize: 14 }}>Error: {error}</div>
      </div>
    );
  }

  if (!data || data.diagrams.length === 0) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#111",
        color: "#888",
        fontFamily: "system-ui",
        gap: 16,
      }}>
        <div style={{ fontSize: 24 }}>📭</div>
        <div style={{ fontSize: 14 }}>No diagrams found. Try running <code style={{ color: "#6af" }}>arc build</code> with a different description.</div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "#111118",
      color: "#ccc",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <Header
        description={data.description}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 1, position: "relative" }}>
          {activeTab === "reference" && (
            <ReferenceCanvas data={data} onComponentClick={onComponentClick} />
          )}
          {activeTab === "design" && (
            <DesignCanvas />
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
          <ReviewPanel description={data.description} />
        )}
      </div>

      <footer style={{
        padding: "6px 20px",
        borderTop: "1px solid #222",
        display: "flex",
        gap: 24,
        fontSize: 11,
        color: "#555",
        background: "#0e0e14",
      }}>
        {data.diagrams.map((d) => (
          <span key={d.repoFullName}>
            {d.repoFullName}
            {d.source ? ` (${d.source})` : ""}
            {d.cached ? " [cached]" : ""}
          </span>
        ))}
      </footer>
    </div>
  );
}

export default App;
