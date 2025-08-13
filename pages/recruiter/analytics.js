// pages/recruiter/analytics.js
import Head from "next/head";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterHeader from "../../components/recruiter/RecruiterHeader";
import { SourceBreakdown, Funnel, TrendLine } from "../../components/recruiter/AnalyticsCharts";
import FeatureLock from "../../components/recruiter/FeatureLock";

function Body() {
  const { isEnterprise } = usePlan();

  // Demo data (replace with real aggregates later)
  const sources = [
    { label: "Community Hubs", value: 182 },
    { label: "Direct Search", value: 141 },
    { label: "Referral", value: 79 },
    { label: "Other", value: 45 },
  ];
  const funnel = [
    { label: "Views", value: 5921 },
    { label: "Clicks", value: 1604 },
    { label: "Applies", value: 447 },
    { label: "Hires", value: 12 },
  ];
  const trend = [120, 140, 110, 180, 220, 210, 260, 280, 240, 300, 310, 355];

  const ChartsBlock = (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-lg border bg-white p-4">
        <div className="font-medium mb-2">Source Tracking</div>
        <SourceBreakdown sources={sources} />
      </div>
      <div className="rounded-lg border bg-white p-4">
        <div className="font-medium mb-2">Funnel (Views → Applies → Hires)</div>
        <Funnel stages={funnel} />
      </div>
      <div className="rounded-lg border bg-white p-4 lg:col-span-2">
        <div className="font-medium mb-2">Trends Over Time</div>
        <TrendLine points={trend} />
      </div>
    </section>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <h1 className="text-xl font-semibold">Analytics</h1>

      {/* Always-on KPIs for all plans */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-slate-500">Total Views (30d)</div>
          <div className="text-2xl font-semibold mt-1">5,921</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-slate-500">Total Applications (30d)</div>
          <div className="text-2xl font-semibold mt-1">447</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-slate-500">Avg. View → Apply</div>
          <div className="text-2xl font-semibold mt-1">4.7%</div>
        </div>
      </section>

      {/* Advanced analytics — Enterprise-only */}
      {isEnterprise ? (
        ChartsBlock
      ) : (
        <FeatureLock label="Full Analytics">
          {ChartsBlock}
        </FeatureLock>
      )}
    </main>
  );
}

export default function AnalyticsPage() {
  return (
    <PlanProvider>
      <Head><title>Analytics — ForgeTomorrow</title></Head>
      <RecruiterHeader />
      <Body />
    </PlanProvider>
  );
}
