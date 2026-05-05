// components/project-promotion/ProjectPromotionEngine.js

import { useState } from "react";

export default function ProjectPromotionEngine() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRun = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/anvil/project-promotion/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>

      <div>
        <h2 style={{ color: "#FF7043", fontWeight: 900 }}>
          Project & Promotion Intelligence
        </h2>
        <p style={{ color: "#546E7A" }}>
          Identify the next high-impact move to increase your value and visibility.
        </p>
      </div>

      <button
        onClick={handleRun}
        style={{
          background: "#FF7043",
          color: "#fff",
          border: "none",
          padding: "10px 16px",
          borderRadius: 8,
          fontWeight: 800,
          cursor: "pointer",
          width: "fit-content",
        }}
      >
        {loading ? "Analyzing..." : "Run Analysis"}
      </button>

      {result && (
        <div style={{ display: "grid", gap: 12 }}>

          <div>
            <strong>Performance Read:</strong>
            <p>{result.performance}</p>
          </div>

          <div>
            <strong>What’s Holding You Back:</strong>
            <p>{result.gap}</p>
          </div>

          <div>
            <strong>Top Moves:</strong>
            {result.moves.map((m, i) => (
              <div key={i}>
                <p><strong>{i + 1}. {m.title}</strong></p>
                <p>{m.description}</p>
              </div>
            ))}
          </div>

          <div>
            <strong>Recommended Move:</strong>
            <p>{result.recommendation}</p>
          </div>

        </div>
      )}
    </div>
  );
}