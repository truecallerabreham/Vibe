import React, { useEffect, useState } from "react";

interface DiagramComponent {
  name: string;
  path: string;
  description: string;
  dependencies: string[];
  category: string;
}

interface ComponentDetail {
  overview: string;
  tradeoffs: string[];
  alternatives: string[];
  whyChosen: string;
}

interface Props {
  component: DiagramComponent;
  repoFullName: string;
  onClose: () => void;
}

export function ComponentDetailPanel({ component, repoFullName, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "tradeoffs" | "alternatives" | "why">("overview");
  const [detail, setDetail] = useState<ComponentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDetail(null);
    setError(null);
    setLoading(true);

    const params = new URLSearchParams({
      repoFullName,
      componentName: component.name,
    });

    fetch(`/api/component-detail?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: ComponentDetail) => {
        setDetail(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [component.name, repoFullName]);

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "tradeoffs" as const, label: "Trade-offs" },
    { id: "alternatives" as const, label: "Alternatives" },
    { id: "why" as const, label: "Why this was chosen" },
  ];

  return (
    <div
      style={{
        width: 380,
        background: "#151525",
        borderLeft: "1px solid #333",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #333",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, color: "#eef" }}>{component.name}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#777" }}>{repoFullName}</p>
          <span
            style={{
              display: "inline-block",
              marginTop: 6,
              padding: "2px 10px",
              background: "#2a2a4e",
              borderRadius: 4,
              fontSize: 11,
              color: "#aaf",
            }}
          >
            {component.category}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#888",
            cursor: "pointer",
            fontSize: 20,
            padding: "4px 8px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #333" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "10px 4px",
              background: activeTab === tab.id ? "#2a2a4e" : "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #6a6aff" : "2px solid transparent",
              color: activeTab === tab.id ? "#eef" : "#777",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: activeTab === tab.id ? 500 : 400,
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: 16, overflowY: "auto", fontSize: 13, lineHeight: 1.6 }}>
        {loading && (
          <div style={{ color: "#888", textAlign: "center", paddingTop: 40 }}>
            Loading analysis...
          </div>
        )}
        {error && (
          <div style={{ color: "#e55", fontSize: 12 }}>
            Failed to load: {error}
            <div style={{ marginTop: 16, color: "#999" }}>
              <p>{component.description || `${component.name} is a ${component.category}-layer component.`}</p>
            </div>
          </div>
        )}
        {!loading && !error && detail && (
          <>
            {activeTab === "overview" && (
              <div>
                <p style={{ color: "#ccc", lineHeight: 1.7 }}>{detail.overview}</p>
                {component.dependencies.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <strong style={{ color: "#aaa", fontSize: 12 }}>Dependencies:</strong>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {component.dependencies.map((dep) => (
                        <span
                          key={dep}
                          style={{
                            padding: "3px 10px",
                            background: "#2a2a4a",
                            borderRadius: 12,
                            fontSize: 12,
                            color: "#aac",
                          }}
                        >
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p style={{ marginTop: 20, color: "#666", fontSize: 12 }}>
                  Path: <code style={{ color: "#888" }}>{component.path}</code>
                </p>
              </div>
            )}

            {activeTab === "tradeoffs" && (
              <ul style={{ margin: 0, paddingLeft: 18, color: "#ccc" }}>
                {detail.tradeoffs.map((t, i) => (
                  <li key={i} style={{ marginBottom: 10 }}>{t}</li>
                ))}
              </ul>
            )}

            {activeTab === "alternatives" && (
              <div>
                {detail.alternatives.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#ccc" }}>
                    {detail.alternatives.map((a, i) => (
                      <li key={i} style={{ marginBottom: 10 }}>{a}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "#888" }}>No alternatives listed.</p>
                )}
              </div>
            )}

            {activeTab === "why" && (
              <div style={{ padding: 14, background: "#1e1e3a", borderRadius: 8, color: "#ccc" }}>
                {detail.whyChosen}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
