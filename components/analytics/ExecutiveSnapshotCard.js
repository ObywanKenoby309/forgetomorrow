// components/analytics/ExecutiveSnapshotCard.js
import React, { useEffect, useState } from "react";
import Link from "next/link";

const GLASS = {
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.78)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const GLASS_SOFT = {
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.88)",
  boxShadow: "0 8px 22px rgba(15,23,42,0.10)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const ORANGE = "#FF7043";
const SLATE = "#1E293B";
const MUTED = "#475569";

function StatTile({ label, value, hint }) {
  return (
    <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: "14px 14px", minWidth: 0, width: "100%" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: MUTED, lineHeight: 1.2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: SLATE, marginTop: 6, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, lineHeight: 1.4 }}>{hint}</div>
    </div>
  );
}

function ActionLink({ href, children, primary = false, orange = false }) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        borderRadius: 999,
        background: primary ? ORANGE : orange ? "rgba(255,112,67,0.14)" : "rgba(30,41,59,0.08)",
        color: primary ? "#fff" : orange ? ORANGE : SLATE,
        fontSize: 11,
        fontWeight: 850,
        padding: "6px 12px",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Link>
  );
}

export default function ExecutiveSnapshotCard({
  loading,
  topSource,
  offerAcceptanceRate,
  totalHires,
  totalApplies,
}) {
  const tiles = [
    {
      label: "Top source",
      value: loading ? "…" : topSource?.name || "N/A",
      hint: "Best-performing inbound channel",
    },
    {
      label: "Offer acceptance",
      value: loading ? "…" : `${offerAcceptanceRate}%`,
      hint: "Close efficiency signal",
    },
    {
      label: "Apply-to-hire",
      value: loading ? "…" : totalApplies ? `${((totalHires / totalApplies) * 100).toFixed(1)}%` : "0%",
      hint: "Applications converting into hires",
    },
  ];

  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % tiles.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        ...GLASS,
        borderRadius: 18,
        padding: 14,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: SLATE, letterSpacing: "-0.2px", lineHeight: 1.15 }}>
          Executive Snapshot
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.35 }}>
          Source quality, interview flow, and close efficiency.
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <ActionLink href="/recruiter/analytics?tab=reports&report=funnel" orange>Details</ActionLink>
        <ActionLink href="/recruiter/analytics/presentation">Visuals</ActionLink>
        <ActionLink href="/recruiter/analytics/snapshot-delivery" primary>Send</ActionLink>
      </div>

      <div style={{ position: "relative", overflow: "hidden", flex: 1 }}>
        <StatTile
          label={tiles[activeIdx].label}
          value={tiles[activeIdx].value}
          hint={tiles[activeIdx].hint}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        {tiles.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            style={{
              width: i === activeIdx ? 20 : 6,
              height: 6,
              borderRadius: 999,
              background: i === activeIdx ? ORANGE : "rgba(255,112,67,0.25)",
              border: "none",
              padding: 0,
              cursor: "pointer",
              transition: "width 220ms ease, background 220ms ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}