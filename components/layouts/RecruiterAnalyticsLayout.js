// components/layouts/RecruiterAnalyticsLayout.js
import React, { useMemo } from "react";
import { useRouter } from "next/router";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";

const GLASS = {
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const SOFT_GLASS = {
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.46)",
  boxShadow: "0 8px 18px rgba(0,0,0,0.09)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const ORANGE = "#FF7043";
const SLATE = "#334155";
const MUTED = "#64748B";

const MODE_TABS = [
  { key: "command", label: "Command Center", href: "/recruiter/analytics" },
  { key: "reports", label: "Report Details", href: "/recruiter/analytics/reports" },
  { key: "presentation", label: "Presentation Visuals", href: "/recruiter/analytics/presentation" },
];

const REPORT_LINKS = [
  { label: "Funnel", href: "/recruiter/analytics/funnel" },
  { label: "Sources", href: "/recruiter/analytics/sources" },
  { label: "Recruiters", href: "/recruiter/analytics/recruiters" },
  { label: "Time-to-Fill", href: "/recruiter/analytics/time-to-fill" },
  { label: "Quality of Hire", href: "/recruiter/analytics/quality-of-hire" },
  { label: "Talent Intel", href: "/recruiter/analytics/talent-intelligence" },
];

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? `1px solid ${ORANGE}` : "1px solid rgba(51,65,85,0.14)",
        background: active ? ORANGE : "rgba(255,255,255,0.78)",
        color: active ? "#fff" : SLATE,
        borderRadius: 999,
        padding: "8px 14px",
        fontSize: 12.5,
        fontWeight: 800,
        whiteSpace: "nowrap",
        cursor: "pointer",
        boxShadow: active ? "0 6px 16px rgba(255,112,67,0.24)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? `1px solid ${ORANGE}` : "1px solid rgba(51,65,85,0.14)",
        background: active ? ORANGE : "rgba(255,255,255,0.84)",
        color: active ? "#fff" : SLATE,
        borderRadius: 999,
        padding: "6px 12px",
        fontSize: 11.5,
        fontWeight: 800,
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function AnalyticsHeader({ title, subtitle }) {
  return (
    <div style={{ textAlign: "center" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: ORANGE, lineHeight: 1.1 }}>
        {title}
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "#475569",
          marginTop: 6,
          maxWidth: 720,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.6,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

function DefaultRightRail() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ ...GLASS, borderRadius: 14, padding: 14 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: ORANGE,
            marginBottom: 8,
          }}
        >
          Recruiter Intel
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: SLATE, marginBottom: 6 }}>
          Executive Snapshot
        </div>
        <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
          Use this area for recruiter-facing guidance, quick tips, and short
          contextual notes while the main page handles the analytics workflow.
        </div>
      </div>

      <div style={{ ...GLASS, borderRadius: 14, padding: 14 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#94A3B8",
            marginBottom: 8,
          }}
        >
          Ad Space
        </div>
        <div
          style={{
            borderRadius: 12,
            border: "1px dashed rgba(100,116,139,0.24)",
            background: "rgba(255,255,255,0.60)",
            minHeight: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            textAlign: "center",
            color: "#94A3B8",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Reserved ad / sponsor panel
        </div>
      </div>
    </div>
  );
}

export default function RecruiterAnalyticsLayout({
  title = "Recruiter Analytics — ForgeTomorrow",
  pageTitle = "Recruiter Analytics",
  pageSubtitle = "A recruiter analytics command center built for quick reads, deeper report details, and presentation-ready visuals.",
  activeTab = "command",
  filters,
  onFilterChange,
  children,
  right,
}) {
  const router = useRouter();

  const period = filters?.range || "30d";

  const activePath = useMemo(() => router.pathname || "", [router.pathname]);

  const pushWithFilters = (href) => {
    const nextQuery = {
      ...(filters?.range ? { range: filters.range } : {}),
      ...(filters?.jobId ? { jobId: filters.jobId } : {}),
      ...(filters?.recruiterId ? { recruiterId: filters.recruiterId } : {}),
      ...(filters?.companyId ? { companyId: filters.companyId } : {}),
      ...(filters?.from ? { from: filters.from } : {}),
      ...(filters?.to ? { to: filters.to } : {}),
    };

    router.push({ pathname: href, query: nextQuery }, undefined, { shallow: false });
  };

  const header = (
    <AnalyticsHeader title={pageTitle} subtitle={pageSubtitle} />
  );

  const rightRail = right || <DefaultRightRail />;

  return (
    <RecruiterLayout
      title={title}
      header={header}
      right={rightRail}
      activeNav="analytics"
      contentFullBleed
    >
      <section
        style={{
          ...GLASS,
          borderRadius: 18,
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: ORANGE,
                marginBottom: 6,
              }}
            >
              Recruiter Analytics
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: SLATE, lineHeight: 1.1 }}>
              {activeTab === "command"
                ? "Command Center"
                : activeTab === "reports"
                ? "Report Details"
                : "Presentation Visuals"}
            </div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 6, lineHeight: 1.6 }}>
              One surface for monitoring, understanding, and presenting recruiting performance.
            </div>
          </div>

          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>Refresh</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: SLATE }}>30s live</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>Data source</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: SLATE }}>SQL</div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingTop: 14,
            paddingBottom: 2,
            scrollbarWidth: "none",
          }}
        >
          {MODE_TABS.map((tab) => (
            <TabButton
              key={tab.key}
              active={activeTab === tab.key}
              onClick={() => pushWithFilters(tab.href)}
            >
              {tab.label}
            </TabButton>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingTop: 10,
            paddingBottom: 2,
            scrollbarWidth: "none",
          }}
        >
          {REPORT_LINKS.map((tab) => (
            <TabButton
              key={tab.href}
              active={activePath === tab.href}
              onClick={() => pushWithFilters(tab.href)}
            >
              {tab.label}
            </TabButton>
          ))}
        </div>

        <div
          style={{
            ...SOFT_GLASS,
            borderRadius: 16,
            padding: 14,
            marginTop: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED }}>Period:</div>

            {["7d", "30d", "90d", "ytd", "custom"].map((value) => (
              <FilterPill
                key={value}
                active={period === value}
                onClick={() => onFilterChange?.({ range: value })}
              >
                {value.toUpperCase()}
              </FilterPill>
            ))}

            <select
              value={filters?.jobId || "all"}
              onChange={(e) => onFilterChange?.({ jobId: e.target.value })}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(51,65,85,0.14)",
                background: "rgba(255,255,255,0.84)",
                color: SLATE,
                fontSize: 12,
                fontWeight: 700,
                padding: "7px 12px",
                outline: "none",
              }}
            >
              <option value="all">All Jobs</option>
              <option value="engineering">Engineering</option>
              <option value="sales">Sales</option>
              <option value="operations">Operations</option>
            </select>

            <select
              value={filters?.recruiterId || "all"}
              onChange={(e) => onFilterChange?.({ recruiterId: e.target.value })}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(51,65,85,0.14)",
                background: "rgba(255,255,255,0.84)",
                color: SLATE,
                fontSize: 12,
                fontWeight: 700,
                padding: "7px 12px",
                outline: "none",
              }}
            >
              <option value="all">All Recruiters</option>
              <option value="ajohnson">A. Johnson</option>
              <option value="mchen">M. Chen</option>
              <option value="slee">S. Lee</option>
            </select>

            {period === "custom" ? (
              <>
                <input
                  type="date"
                  value={filters?.from || ""}
                  onChange={(e) => onFilterChange?.({ from: e.target.value })}
                  style={{
                    borderRadius: 999,
                    border: "1px solid rgba(51,65,85,0.14)",
                    background: "rgba(255,255,255,0.84)",
                    color: SLATE,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "7px 12px",
                    outline: "none",
                  }}
                />
                <input
                  type="date"
                  value={filters?.to || ""}
                  onChange={(e) => onFilterChange?.({ to: e.target.value })}
                  style={{
                    borderRadius: 999,
                    border: "1px solid rgba(51,65,85,0.14)",
                    background: "rgba(255,255,255,0.84)",
                    color: SLATE,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "7px 12px",
                    outline: "none",
                  }}
                />
              </>
            ) : null}

            <button
              type="button"
              style={{
                marginLeft: "auto",
                borderRadius: 999,
                border: "1px solid rgba(51,65,85,0.14)",
                background: "rgba(255,255,255,0.92)",
                color: SLATE,
                fontSize: 12,
                fontWeight: 800,
                padding: "7px 14px",
                cursor: "pointer",
              }}
            >
              Export CSV
            </button>
          </div>
        </div>
      </section>

      {children}
    </RecruiterLayout>
  );
}