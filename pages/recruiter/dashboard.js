// pages/recruiter/dashboard.js
import { PlanProvider, usePlan } from "@/context/PlanContext";
import FeatureLock from "@/components/recruiter/FeatureLock";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";

function HeaderBar() {
  // Center title/subtitle while keeping actions aligned right
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3 min-w-0">
      <div className="hidden md:block" />
      <div className="text-center min-w-0">
        <h1 className="text-2xl font-bold text-[#FF7043]">Recruiter Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-xl mx-auto">
          Monitor open roles, candidate recommendations, and quick analytics at a glance.
        </p>
      </div>
      <div className="justify-self-center md:justify-self-end">
        <div className="flex flex-wrap items-center gap-2">
          <PrimaryButton href="/recruiter/job-postings">Post a Job</PrimaryButton>
          <SecondaryButton href="/recruiter/analytics">View Analytics</SecondaryButton>
        </div>
      </div>
    </div>
  );
}

function RightToolsCard() {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="font-medium mb-2">Quick Tools</div>
      <div className="space-y-2 text-sm">
        <div className="text-slate-600">Jump back into common tasks:</div>
        <div className="flex flex-wrap gap-2">
          <SecondaryButton href="/recruiter/candidates" size="sm">
            Browse Candidates
          </SecondaryButton>
          <SecondaryButton href="/recruiter/messaging" size="sm">
            Messaging
          </SecondaryButton>
          <SecondaryButton href="/recruiter/job-postings" size="sm">
            Manage Jobs
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}

// Panel auto-equal heights via h-full + flex layout; children fill space
function Panel({ title, children }) {
  return (
    <section className="rounded-lg border bg-white p-4 relative h-full flex flex-col" aria-label={title}>
      <div className="font-medium mb-2">{title}</div>
      {/* Ensure uniform internal spacing in all panels */}
      <div className="flex-1 grid content-start gap-2 min-w-0">
        {children}
      </div>
    </section>
  );
}

function DashboardBody() {
  const { isEnterprise } = usePlan();

  return (
    <div className="space-y-6 min-w-0">
      {/* Quick Stats (available to all plans) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Open Jobs", value: 3 },
          { label: "Active Candidates", value: 18 },
          { label: "Messages Waiting", value: 5 },
          { label: "Applications (7d)", value: 42 },
        ].map((t) => (
          <div key={t.label} className="rounded-lg border bg-white p-4">
            <div className="text-sm font-medium text-[#FF7043] truncate">{t.label}</div>
            <div className="text-2xl font-semibold mt-1">{t.value}</div>
          </div>
        ))}
      </section>

      {/* Panels — equal heights & consistent spacing */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Top Candidate Recommendations */}
        <Panel title="Top Candidate Recommendations">
          {isEnterprise ? (
            <ul className="text-sm grid gap-2">
              <li>• Jane D. — Sr. CSM (92% match)</li>
              <li>• Omar R. — Onboarding Lead (88% match)</li>
              <li>• Priya K. — Solutions Architect (86% match)</li>
            </ul>
          ) : (
            <FeatureLock label="AI Candidate Recommendations">
              <ul className="text-sm grid gap-2">
                <li>• Candidate A — (preview)</li>
                <li>• Candidate B — (preview)</li>
                <li>• Candidate C — (preview)</li>
              </ul>
            </FeatureLock>
          )}
        </Panel>

        {/* Quick Analytics Snapshot */}
        <Panel title="Quick Analytics Snapshot">
          {isEnterprise ? (
            <div className="text-sm grid gap-2">
              <div>Time-to-Hire: 18 days</div>
              <div>Top Source: Community Hubs (38%)</div>
              <div>Conversion (View→Apply): 4.7%</div>
            </div>
          ) : (
            // Locked mode wrapped for identical padding/margins
            <FeatureLock label="Analytics Snapshot">
              <div className="text-sm grid gap-2">
                <div>Views</div>
                <div>Applies</div>
                <div>Conversion (preview)</div>
              </div>
            </FeatureLock>
          )}
        </Panel>
      </section>
    </div>
  );
}

export default function RecruiterDashboardPage() {
  return (
    <PlanProvider>
      <RecruiterLayout
        title="ForgeTomorrow — Recruiter"
        header={<HeaderBar />}
        right={<RightToolsCard />}
      >
        <DashboardBody />
      </RecruiterLayout>
    </PlanProvider>
  );
}
