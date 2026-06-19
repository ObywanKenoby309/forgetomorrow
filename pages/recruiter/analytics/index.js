// pages/recruiter/analytics/index.js
// Unified recruiter analytics workspace with inlay tabs.

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { PlanProvider } from "@/context/PlanContext";
import RecruiterAnalyticsLayout from "@/components/layouts/RecruiterAnalyticsLayout";
import CommandInlay from "@/components/analytics/recruiter/CommandInlay";
import ReportsInlay from "@/components/analytics/recruiter/ReportsInlay";
import PresentationInlay from "@/components/analytics/recruiter/PresentationInlay";
import SnapshotDeliveryInlay from "@/components/analytics/recruiter/SnapshotDeliveryInlay";
import { getFiltersFromQuery } from "@/lib/analytics/analyticsUtils";

const VALID_TABS = new Set(["command", "reports", "presentation", "snapshots"]);

const ORANGE = "#FF7043";
const SLATE = "#334155";
const MUTED = "#64748B";

const WORKSPACE_TABS = [
  { key: "command", label: "Command", hint: "Executive overview" },
  { key: "reports", label: "Reports", hint: "Detailed narratives" },
  { key: "presentation", label: "Presentation", hint: "Export visuals" },
  { key: "snapshots", label: "Snapshots", hint: "Delivery schedules" },
];

function AnalyticsWorkspaceTabs({ activeTab, onChange, isMobile }) {
  return (
    <section
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.22)",
        background: "rgba(255,255,255,0.68)",
        boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: isMobile ? 10 : 12,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        {WORKSPACE_TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              style={{
                border: active ? "1px solid rgba(255,112,67,0.36)" : "1px solid rgba(51,65,85,0.10)",
                background: active ? "rgba(255,112,67,0.14)" : "rgba(255,255,255,0.62)",
                color: active ? ORANGE : SLATE,
                borderRadius: 14,
                padding: isMobile ? "10px 10px" : "12px 14px",
                cursor: "pointer",
                textAlign: "left",
                boxShadow: active ? "0 6px 16px rgba(255,112,67,0.14)" : "none",
                fontFamily: "inherit",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 900, lineHeight: 1.2 }}>{tab.label}</div>
              {!isMobile && (
                <div style={{ fontSize: 11, color: active ? ORANGE : MUTED, marginTop: 3, fontWeight: 700 }}>
                  {tab.hint}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

const TAB_COPY = {
  command: {
    title: "Analytics — ForgeTomorrow",
    subtitle:
      "A recruiter command center for funnel health, source performance, recruiter output, and hiring intelligence.",
  },
  reports: {
    title: "Recruiter Analytics — ForgeTomorrow",
    subtitle:
      "Deep analysis and meeting-ready narrative context behind every metric on the analytics side.",
  },
  presentation: {
    title: "Recruiter Analytics — ForgeTomorrow",
    subtitle:
      "Clean, export-ready charts for QBRs and stakeholder reporting with white background and no watermarks.",
  },
  snapshots: {
    title: "Snapshot Delivery Center — ForgeTomorrow",
    subtitle:
      "Per-report delivery schedules. Each report has its own recipients, timing, and cadence.",
  },
};

function normalizeTab(raw) {
  const value = String(raw || "command").trim();
  if (value === "snapshot" || value === "snapshot-delivery") return "snapshots";
  return VALID_TABS.has(value) ? value : "command";
}

function Body() {
  const router = useRouter();
  const [filters, setFilters] = useState(getFiltersFromQuery(router.query));
  const [activeTab, setActiveTab] = useState("command");
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    setFilters(getFiltersFromQuery(router.query));
    setActiveTab(normalizeTab(router.query?.tab));
  }, [router.isReady, router.query]);

  const onFilterChange = (patch) => {
    const next = { ...filters, ...patch };
    setFilters(next);

    router.replace(
      {
        pathname: "/recruiter/analytics",
        query: {
          ...router.query,
          tab: activeTab,
          range: next.range,
          jobId: next.jobId,
          recruiterId: next.recruiterId,
          companyId: next.companyId,
          ...(next.from ? { from: next.from } : {}),
          ...(next.to ? { to: next.to } : {}),
        },
      },
      undefined,
      { shallow: true, scroll: false }
    );
  };

  const handleTabChange = (tab) => {
    const nextTab = normalizeTab(tab);
    setActiveTab(nextTab);
    router.push(
      {
        pathname: "/recruiter/analytics",
        query: {
          ...router.query,
          tab: nextTab,
          range: filters.range,
          jobId: filters.jobId,
          recruiterId: filters.recruiterId,
          companyId: filters.companyId,
          ...(filters.from ? { from: filters.from } : {}),
          ...(filters.to ? { to: filters.to } : {}),
        },
      },
      undefined,
      { shallow: true, scroll: false }
    );
  };

  const activeCopy = TAB_COPY[activeTab] || TAB_COPY.command;

  const inlay = useMemo(() => {
    if (activeTab === "reports") {
      return <ReportsInlay filters={filters} onFilterChange={onFilterChange} isMobile={isMobile === true} />;
    }

    if (activeTab === "presentation") {
      return <PresentationInlay filters={filters} onFilterChange={onFilterChange} isMobile={isMobile === true} />;
    }

    if (activeTab === "snapshots") {
      return <SnapshotDeliveryInlay isMobile={isMobile === true} />;
    }

    return <CommandInlay filters={filters} onFilterChange={onFilterChange} isMobile={isMobile === true} />;
  }, [activeTab, filters, isMobile]);

  return (
    <RecruiterAnalyticsLayout
      title={activeCopy.title}
      pageSubtitle={activeCopy.subtitle}
      activeTab={activeTab}
      filters={filters}
      onFilterChange={onFilterChange}
      isMobile={isMobile === true}
      isDesktop={isMobile === false}
      mobileShell={isMobile === null}
      hideDesktopRightRail={activeTab === "snapshots"}
    >
      {isMobile === null ? null : (
        <div style={{ display: "grid", gap: 12 }}>
          <AnalyticsWorkspaceTabs
            activeTab={activeTab}
            onChange={handleTabChange}
            isMobile={isMobile === true}
          />
          {inlay}
        </div>
      )}
    </RecruiterAnalyticsLayout>
  );
}

export default function RecruiterAnalyticsPage() {
  return (
    <PlanProvider>
      <Body />
    </PlanProvider>
  );
}
