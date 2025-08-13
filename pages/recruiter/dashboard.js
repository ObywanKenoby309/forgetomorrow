// pages/recruiter/dashboard.js
import Head from "next/head";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterHeader from "../../components/recruiter/RecruiterHeader";
import FeatureLock from "../../components/recruiter/FeatureLock";

function DashboardBody() {
  const { isEnterprise } = usePlan();

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Quick Stats (available to all plans) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Open Jobs", value: 3 },
          { label: "Active Candidates", value: 18 },
          { label: "Messages Waiting", value: 5 },
          { label: "Applications (7d)", value: 42 },
        ].map((t) => (
          <div key={t.label} className="rounded-lg border bg-white p-4">
            <div className="text-sm text-slate-500">{t.label}</div>
            <div className="text-2xl font-semibold mt-1">{t.value}</div>
          </div>
        ))}
      </section>

      {/* Panels */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Candidate Recommendations — Enterprise-only */}
        <Panel title="Top Candidate Recommendations">
          {isEnterprise ? (
            <ul className="text-sm space-y-2">
              <li>• Jane D. — Sr. CSM (92% match)</li>
              <li>• Omar R. — Onboarding Lead (88% match)</li>
              <li>• Priya K. — Solutions Architect (86% match)</li>
            </ul>
          ) : (
            <FeatureLock label="AI Candidate Recommendations">
              <ul className="text-sm space-y-2">
                <li>• Candidate A — (preview)</li>
                <li>• Candidate B — (preview)</li>
                <li>• Candidate C — (preview)</li>
              </ul>
            </FeatureLock>
          )}
        </Panel>

        {/* Quick Analytics Snapshot — Enterprise-only */}
        <Panel title="Quick Analytics Snapshot">
          {isEnterprise ? (
            <div className="text-sm">
              <div>Time-to-Hire: 18 days</div>
              <div>Top Source: Community Hubs (38%)</div>
              <div>Conversion (View→Apply): 4.7%</div>
            </div>
          ) : (
            <FeatureLock label="Analytics Snapshot">
              <div className="text-sm text-slate-500">
                Views, applies, conversion (preview)
              </div>
            </FeatureLock>
          )}
        </Panel>
      </section>
    </main>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-lg border bg-white p-4 relative">
      <div className="font-medium mb-2">{title}</div>
      {children}
    </div>
  );
}

export default function RecruiterDashboardPage() {
  return (
    <PlanProvider>
      <Head><title>Recruiter Dashboard — ForgeTomorrow</title></Head>
      <RecruiterHeader />
      <DashboardBody />
    </PlanProvider>
  );
}
