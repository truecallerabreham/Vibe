import React from "react";

interface Props {
  description: string;
}

export function ReviewPanel({ description }: Props) {
  const [reviewing, setReviewing] = React.useState(false);
  const [review, setReview] = React.useState<{
    strengths: string[];
    risks: string[];
    suggestions: Array<{ component: string; issue: string; recommendation: string; reasoning: string }>;
    overall: string;
  } | null>(null);

  const handleReview = async () => {
    setReviewing(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      setReview(data);
    } catch {
      // Mock review for now
      setReview({
        strengths: ["Well-structured component separation", "Good use of proven open-source patterns"],
        risks: ["Consider adding a caching layer", "Monolith might need splitting at scale"],
        suggestions: [
          {
            component: "Database",
            issue: "Single database may become bottleneck",
            recommendation: "Consider read replicas",
            reasoning: "As traffic grows, read replicas improve query performance without complex sharding",
          },
        ],
        overall: "Solid architecture with room for scaling improvements.",
      });
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div
      style={{
        width: 320,
        background: "#1a1a2e",
        borderLeft: "1px solid #333",
        display: "flex",
        flexDirection: "column",
        padding: 16,
      }}
    >
      <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#fff" }}>Architecture Review</h3>

      {!review ? (
        <button
          onClick={handleReview}
          disabled={reviewing}
          style={{
            padding: "10px 16px",
            background: reviewing ? "#333" : "#4a4aff",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            cursor: reviewing ? "wait" : "pointer",
            fontSize: 13,
          }}
        >
          {reviewing ? "Analyzing..." : "Review My Architecture"}
        </button>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", fontSize: 13, lineHeight: 1.6 }}>
          <div style={{ marginBottom: 16, padding: 12, background: "#1e3a2e", borderRadius: 8 }}>
            <strong style={{ color: "#4c4" }}>What's good:</strong>
            <ul style={{ margin: "8px 0", paddingLeft: 16, color: "#ccc" }}>
              {review.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: 16, padding: 12, background: "#3a2e1e", borderRadius: 8 }}>
            <strong style={{ color: "#ea4" }}>Risks:</strong>
            <ul style={{ margin: "8px 0", paddingLeft: 16, color: "#ccc" }}>
              {review.risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: 16 }}>
            <strong style={{ color: "#6af" }}>Suggestions:</strong>
            {review.suggestions.map((s, i) => (
              <div
                key={i}
                style={{ marginTop: 8, padding: 10, background: "#1e1e3a", borderRadius: 8 }}
              >
                <strong style={{ color: "#aaf" }}>{s.component}</strong>
                <p style={{ margin: "4px 0", color: "#e88" }}>{s.issue}</p>
                <p style={{ margin: "4px 0", color: "#8e8" }}>{s.recommendation}</p>
                <p style={{ margin: "4px 0", color: "#999", fontSize: 12 }}>{s.reasoning}</p>
              </div>
            ))}
          </div>

          <div style={{ padding: 12, background: "#2a2a4e", borderRadius: 8, color: "#ccc" }}>
            <strong style={{ color: "#fff" }}>Overall:</strong>
            <p style={{ margin: "4px 0 0" }}>{review.overall}</p>
          </div>
        </div>
      )}
    </div>
  );
}
