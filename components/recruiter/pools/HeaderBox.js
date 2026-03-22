// components/recruiter/pools/HeaderBox.js
import React from "react";
import { ORANGE } from "./Pills";

const MUTED = "#64748B";

export default function HeaderBox() {
  return (
    <section
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.22)",
        background: "rgba(255,255,255,0.58)",
        boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        padding: 16,
        textAlign: "center",
      }}
    >
      <div style={{ color: ORANGE, fontSize: 24, fontWeight: 900, margin: 0 }}>
        Talent Pools
      </div>

      <div
        style={{
          marginTop: 6,
          color: MUTED,
          fontSize: 14,
          marginBottom: 0,
          maxWidth: 720,
          marginInline: "auto",
          lineHeight: 1.5,
        }}
      >
        Save, group, and reuse strong candidates for future roles - with clear “why saved” evidence and fast outreach.
      </div>
    </section>
  );
}