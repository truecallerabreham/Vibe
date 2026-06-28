import React from "react";

interface Props {
  description: string;
  activeTab: "reference" | "design";
  onTabChange: (tab: "reference" | "design") => void;
}

export function Header({ description, activeTab, onTabChange }: Props) {
  return (
    <header style={{
      padding: "12px 20px",
      borderBottom: "1px solid #333",
      display: "flex",
      alignItems: "center",
      gap: 16,
      background: "#151520",
    }}>
      <h1 style={{ margin: 0, fontSize: 20, color: "#eef", fontWeight: 600 }}>
        arc
      </h1>
      <span style={{
        color: "#777",
        fontSize: 13,
        maxWidth: 400,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {description}
      </span>
      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
        <TabButton
          active={activeTab === "reference"}
          onClick={() => onTabChange("reference")}
          label="Reference Architectures"
        />
        <TabButton
          active={activeTab === "design"}
          onClick={() => onTabChange("design")}
          label="Design Your System"
        />
      </div>
    </header>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 16px",
        background: active ? "#3a3a6c" : "transparent",
        border: active ? "1px solid #6a6aff" : "1px solid #444",
        borderRadius: 6,
        color: active ? "#fff" : "#999",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}
