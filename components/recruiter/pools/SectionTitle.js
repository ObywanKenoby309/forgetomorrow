// components/recruiter/pools/SectionTitle.js
import React from "react";

export default function SectionTitle({ title, subtitle, right }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 900, color: "#37474F", fontSize: 14 }}>{title}</div>
        {subtitle ? (
          <div style={{ color: "#607D8B", fontSize: 12, marginTop: 2, lineHeight: 1.35 }}>{subtitle}</div>
        ) : null}
      </div>
      {right ? <div style={{ flex: "0 0 auto" }}>{right}</div> : null}
    </div>
  );
}
