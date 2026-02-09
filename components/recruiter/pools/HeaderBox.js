// components/recruiter/pools/HeaderBox.js
import React from "react";
import { ORANGE } from "./Pills";

export default function HeaderBox() {
  return (
    <section
      style={{
        background: "white",
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        textAlign: "center",
      }}
    >
      <h1 style={{ color: ORANGE, fontSize: 28, fontWeight: 800, margin: 0 }}>
        Talent Pools
      </h1>
      <p style={{ marginTop: 8, color: "#546E7A", fontSize: 14, marginBottom: 0 }}>
        Save, group, and reuse strong candidates for future roles - with clear “why saved” evidence and fast outreach.
      </p>
    </section>
  );
}
