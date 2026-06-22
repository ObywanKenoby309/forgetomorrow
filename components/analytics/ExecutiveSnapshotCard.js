// components/analytics/ExecutiveSnapshotCard.js
import React from "react";
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
    <div style={{ ...GLASS_SOFT, borderRadius: 12, padding: "10px 11px", minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: MUTED, lineHeight: 1.2 }}>{label}</div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 900,
          color: SLATE,
          marginTop: 4,
          lineHeight: 1.15,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10.5,
          color: "#64748B",
          marginTop: 3,
          lineHeight: 1.3,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {hint}
      </div>
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
        padding: "6px 10px",
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
  isMobile,
}) {
  const compactStatColumns = isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))";

  return (
    <div
      style={{
        ...GLASS,
        borderRadius: 18,
        padding: 12,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: SLATE, letterSpacing: "-0.2px", lineHeight: 1.15 }}>
            Executive Snapshot
          </div>
          <div
            style={{
              fontSize: 12,
              color: MUTED,
              marginTop: 3,
              lineHeight: 1.35,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Source quality, interview flow, and close efficiency.
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <ActionLink href="/recruiter/analytics/reports?report=funnel" orange>
            Details
          </ActionLink>
          <ActionLink href="/recruiter/analytics/presentation">
            Visuals
          </ActionLink>
          <ActionLink href="/recruiter/analytics/snapshot-delivery" primary>
            Send
          </ActionLink>
        </div>

        <div style={{ overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(80px, 1fr))", gap: 8, minWidth: 0 }}>
          <StatTile
            label="Top source"
            value={loading ? "…" : topSource?.name || "N/A"}
            hint="Best-performing inbound channel"
          />
          <StatTile
            label="Offer acceptance"
            value={loading ? "…" : `${offerAcceptanceRate}%`}
            hint="Close efficiency signal"
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
        </div>
      </div>
    </div>
  );
}