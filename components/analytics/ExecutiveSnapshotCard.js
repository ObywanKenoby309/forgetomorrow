// components/analytics/ExecutiveSnapshotCard.js
import React from "react";
import Link from "next/link";

const GLASS = {
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const GLASS_SOFT = {
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 8px 22px rgba(15,23,42,0.10)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const ORANGE = "#FF7043";
const SLATE = "#334155";
const MUTED = "#64748B";

function StatTile({ label, value, hint }) {
  return (
    <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 11, color: MUTED }}>{label}</div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 900,
          color: SLATE,
          marginTop: 5,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{hint}</div>
    </div>
  );
}

export default function ExecutiveSnapshotCard({
  loading,
  topSource,
  offerAcceptanceRate,
  totalHires,
  totalApplies,
  isMobile,
}) {
  const compactStatColumns = isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))";

  return (
    <div style={{ ...GLASS, borderRadius: 18, padding: 16, width: "100%", minWidth: 0 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: SLATE }}>Executive Snapshot</div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
          Source quality, interview flow, and close efficiency.
        </div>
      </div>

      {/* 🔥 BUTTON ROW (UPDATED) */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <Link
          href="/recruiter/analytics/reports"
          style={{
            textDecoration: "none",
            borderRadius: 999,
            background: "rgba(255,112,67,0.12)",
            color: ORANGE,
            fontSize: 12,
            fontWeight: 800,
            padding: "7px 12px",
          }}
        >
          Report details
        </Link>

        <Link
          href="/recruiter/analytics/presentation"
          style={{
            textDecoration: "none",
            borderRadius: 999,
            background: "rgba(51,65,85,0.08)",
            color: SLATE,
            fontSize: 12,
            fontWeight: 800,
            padding: "7px 12px",
          }}
        >
          Visuals
        </Link>

        {/* ✅ NEW: ROUTE TO DELIVERY PAGE */}
        <Link
          href="/recruiter/analytics/snapshot-delivery"
          style={{
            textDecoration: "none",
            borderRadius: 999,
            background: ORANGE,
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
            padding: "7px 12px",
          }}
        >
          Send Snapshot
        </Link>
      </div>

      {/* ❌ REMOVED old button block */}

      <div style={{ display: "grid", gridTemplateColumns: compactStatColumns, gap: 10 }}>
        <StatTile
          label="Top source"
          value={loading ? "…" : topSource?.name || "N/A"}
          hint="Best-performing inbound channel"
        />
        <StatTile
          label="Offer acceptance"
          value={loading ? "…" : `${offerAcceptanceRate}%`}
          hint="High-trust close efficiency signal"
        />
        <StatTile
          label="Apply-to-hire"
          value={
            loading
              ? "…"
              : totalApplies
                ? `${((totalHires / totalApplies) * 100).toFixed(1)}%`
                : "0%"
          }
          hint="Applications converting into hires"
        />
      </div>
    </div>
  );
}