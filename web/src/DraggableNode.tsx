import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

interface DiagramComponent {
  name: string;
  path: string;
  description: string;
  dependencies: string[];
  category: string;
}

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

function getCategoryTextColor(category: string): string {
  return CATEGORY_TEXT_COLORS[category.toLowerCase()] || "#ccc";
}

function DraggableNode({ data }: NodeProps) {
  const comp = data.component as DiagramComponent | undefined;
  const repo = data.repoFullName as string | undefined;
  const isHeader = data.isHeader as boolean | undefined;

  if (isHeader || !comp) {
    return <div style={{ padding: "8px 18px", fontSize: 14, fontWeight: 600, color: "#ddf" }}>{data.label as string}</div>;
  }

  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData(
      "application/arc-component",
      JSON.stringify({
        component: comp,
        repoFullName: repo,
      }),
    );
    event.dataTransfer.effectAllowed = "copy";
  };

  const catColor = getCategoryTextColor(comp.category);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{
        background: "#1e1e32",
        border: `1px solid ${catColor}44`,
        borderRadius: 10,
        padding: "12px 16px",
        width: 260,
        cursor: "grab",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 16px ${catColor}22`;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
        e.currentTarget.style.transform = "none";
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <strong style={{ color: "#eef", fontSize: 13 }}>{comp.name}</strong>
        <span style={{
          fontSize: 10,
          color: catColor,
          background: `${catColor}18`,
          padding: "1px 8px",
          borderRadius: 8,
          whiteSpace: "nowrap",
          marginLeft: 8,
        }}>
          {comp.category}
        </span>
      </div>
      {comp.description && (
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#888", lineHeight: 1.4 }}>
          {comp.description.length > 80 ? comp.description.slice(0, 80) + "..." : comp.description}
        </p>
      )}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

export default memo(DraggableNode);
