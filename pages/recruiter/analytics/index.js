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
      {isMobile === null ? null : inlay}
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
