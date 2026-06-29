import React from "react";

interface Props {
  description: string;
}

export function Header({ description }: Props) {
  return (
    <header style={{
      padding: "10px 20px",
      borderBottom: "1px solid #222",
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "#0d0d14",
    }}>
      <span style={{
        fontSize: 22,
        fontWeight: 700,
        color: "#eef",
        letterSpacing: 1,
      }}>
        arc
      </span>
      <span style={{
        color: "#555",
        fontSize: 13,
        maxWidth: 500,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {description}
      </span>
    </header>
  );
}
