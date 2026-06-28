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
  const [error, setError] = React.useState<string | null>(null);

  const handleReview = async () => {
    setReviewing(true);
    setError(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Server error ${res.status}: ${errBody.slice(0, 200)}`);
      }
      const data = await res.json();
      setReview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div
      style={{
        width: 320,
        background: "#151525",
        borderLeft: "1px solid #333",
        display: "flex",
        flexDirection: "column",
        padding: 16,
      }}
    >
      <h3 style={{ margin: "0 0 4px", fontSize: 14, color: "#eef" }}>Architecture Review</h3>
      <p style={{ margin: "0 0 12px", fontSize: 11, color: "#666" }}>
        Get AI feedback on your composed architecture
      </p>

      {error && (
        <div style={{
          padding: 12,
          marginBottom: 12,
          background: "#3a1a1a",
          border: "1px solid #633",
          borderRadius: 8,
          fontSize: 12,
          color: "#e66",
        }}>
          {error}
        </div>
      )}

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
            fontWeight: 500,
            opacity: reviewing ? 0.6 : 1,
            transition: "all 0.15s",
          }}
        >
          {reviewing ? "Analyzing..." : "Review My Architecture"}
        </button>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", fontSize: 13, lineHeight: 1.6 }}>
          <div style={{ marginBottom: 16, padding: 12, background: "#1a3a1e", border: "1px solid #2a5a2e", borderRadius: 8 }}>
            <strong style={{ color: "#4c4", fontSize: 12 }}>✓ Strengths</strong>
            <ul style={{ margin: "8px 0 0", paddingLeft: 16, color: "#ccc" }}>
              {review.strengths.map((s, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{s}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: 16, padding: 12, background: "#3a2a1e", border: "1px solid #5a4a2e", borderRadius: 8 }}>
            <strong style={{ color: "#ea4", fontSize: 12 }}>⚠ Risks</strong>
            <ul style={{ margin: "8px 0 0", paddingLeft: 16, color: "#ccc" }}>
              {review.risks.map((r, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{r}</li>
              ))}
            </ul>
          </div>

          {review.suggestions.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: "#6af", fontSize: 12 }}>Suggestions</strong>
              {review.suggestions.map((s, i) => (
                <div
                  key={i}
                  style={{
                    marginTop: 8,
                    padding: 12,
                    background: "#1e1e3a",
                    border: "1px solid #3a3a5a",
                    borderRadius: 8,
                  }}
                >
                  <strong style={{ color: "#aaf", fontSize: 12 }}>{s.component}</strong>
                  <p style={{ margin: "4px 0", color: "#e88", fontSize: 12 }}>{s.issue}</p>
                  <p style={{ margin: "4px 0", color: "#8e8", fontSize: 12 }}>{s.recommendation}</p>
                  <p style={{ margin: "4px 0 0", color: "#999", fontSize: 11 }}>{s.reasoning}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{
            padding: 12,
            background: "#2a2a4e",
            border: "1px solid #4a4a6e",
            borderRadius: 8,
            color: "#ccc",
            fontSize: 12,
          }}>
            <strong style={{ color: "#eef" }}>Overall</strong>
            <p style={{ margin: "4px 0 0", lineHeight: 1.5 }}>{review.overall}</p>
          </div>
        </div>
      )}
    </div>
  );
}
