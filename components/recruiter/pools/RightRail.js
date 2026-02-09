// components/recruiter/pools/RightRail.js
import React from "react";

export default function RightRail() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          background: "white",
          borderRadius: 10,
          padding: 12,
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
          border: "1px solid #eee",
        }}
      >
        <div style={{ fontWeight: 900, color: "#37474F", marginBottom: 6 }}>Placeholder</div>
        <p style={{ margin: 0, color: "#607D8B", fontSize: 13, lineHeight: 1.45 }}>
          Right rail will become ad placements.
        </p>
      </div>
    </div>
  );
}
