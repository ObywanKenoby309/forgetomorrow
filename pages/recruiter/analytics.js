// pages/recruiter/analytics.js
import Head from "next/head";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterHeader from "../../components/recruiter/RecruiterHeader";

function Body() {
  const { isEnterprise } = usePlan();

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <h1 className="text-xl font-semibold">Analytics</h1>

      {/* Shared basic analytics */}
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

      {/* Enterprise-only */}
      {!isEnterprise ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-slate-500 bg-slate-50">
          🔒 Full analytics (source tracking, funnel, trends) are Enterprise features. Upgrade to unlock.
        </div>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border bg-white p-4">
            <div className="font-medium mb-2">Source Tracking</div>
            <div className="text-slate-500 text-sm">[Chart placeholder]</div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="font-medium mb-2">Funnel (Views → Applies → Hires)</div>
            <div className="text-slate-500 text-sm">[Chart placeholder]</div>
          </div>
          <div className="rounded-lg border bg-white p-4 lg:col-span-2">
            <div className="font-medium mb-2">Trends Over Time</div>
            <div className="text-slate-500 text-sm">[Line chart placeholder]</div>
          </div>
        </section>
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
