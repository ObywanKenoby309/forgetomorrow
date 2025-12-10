// pages/recruiter/job-tracker.js

import { useEffect, useState } from "react";
import { PlanProvider, usePlan } from "@/context/PlanContext";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import FeatureLock from "@/components/recruiter/FeatureLock";

function HeaderBar() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3 min-w-0">
      <div className="hidden md:block" />
      <div className="text-center min-w-0">
        <h1 className="text-2xl font-bold text-[#FF7043]">Job Tracker</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-xl mx-auto">
          Track performance of your open roles, applications, and hiring funnel
          so you always know where each job stands.
        </p>
      </div>
      <div className="justify-self-center md:justify-self-end">
        <div className="flex flex-wrap items-center gap-2">
          <PrimaryButton href="/recruiter/job-postings">Manage Jobs</PrimaryButton>
          <SecondaryButton href="/recruiter/analytics">View Analytics</SecondaryButton>
        </div>
      </div>
    </div>
  );
}

function RightToolsCard() {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="font-medium mb-2">Shortcuts</div>
      <div className="space-y-2 text-sm">
        <div className="text-slate-600">
          Jump back into common recruiter tools:
        </div>
        <div className="flex flex-wrap gap-2">
          <SecondaryButton href="/recruiter/job-postings" size="sm">
            Post / Edit Jobs
          </SecondaryButton>
          <SecondaryButton href="/recruiter/candidates" size="sm">
            Browse Candidates
          </SecondaryButton>
          <SecondaryButton href="/recruiter/messaging" size="sm">
            Messaging
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}

// Simple panel wrapper for consistent styling
function Panel({ title, children }) {
  return (
    <section
      className="rounded-lg border bg-white p-4 relative h-full flex flex-col"
      aria-label={title}
    >
      <div className="font-medium mb-2">{title}</div>
      <div className="flex-1 grid content-start gap-2 min-w-0">{children}</div>
    </section>
  );
}

function JobTrackerBody() {
  const { isEnterprise } = usePlan();

  const [summary, setSummary] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch recruiter job tracker data
  // Expected shape (MVP):
  // {
  //   summary: {
  //     openJobs: number,
  //     totalApplicants: number,
  //     activeCandidates: number,
  //     avgTimeToFillDays: number | null
  //   },
  //   jobs: [
  //     {
  //       id: string,
  //       title: string,
  //       location: string,
  //       status: "Open" | "Closed" | "On Hold" | string,
  //       views: number,
  //       applies: number,
  //       newApplicants: number,
  //       lastActivity: string (ISO or human readable)
  //     }
  //   ]
  // }
  useEffect(() => {
    let isMounted = true;

    async function loadTracker() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/recruiter/job-tracker");
        if (!res.ok) {
          throw new Error(`Failed to load job tracker: ${res.status}`);
        }
        const json = await res.json();
        if (!isMounted) return;

        setSummary(json.summary || null);
        setJobs(Array.isArray(json.jobs) ? json.jobs : []);
        setError(null);
      } catch (err) {
        console.error("[RecruiterJobTracker] Error loading data:", err);
        if (isMounted) {
          setError(
            "We had trouble loading your job activity. This view will update automatically once data is available."
          );
          setSummary(null);
          setJobs([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTracker();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadingSkeleton = (
    <div className="rounded-lg border bg-white p-4 animate-pulse space-y-2">
      <div className="h-3 w-24 bg-slate-200 rounded" />
      <div className="h-7 w-16 bg-slate-200 rounded" />
    </div>
  );

  const kpis = summary
    ? [
        { label: "Open Jobs", value: summary.openJobs ?? 0 },
        { label: "Total Applicants", value: summary.totalApplicants ?? 0 },
        { label: "Active Candidates", value: summary.activeCandidates ?? 0 },
        {
          label: "Avg Time-to-Fill",
          value:
            typeof summary.avgTimeToFillDays === "number"
              ? `${summary.avgTimeToFillDays} days`
              : "—",
        },
      ]
    : [
        { label: "Open Jobs", value: "—" },
        { label: "Total Applicants", value: "—" },
        { label: "Active Candidates", value: "—" },
        { label: "Avg Time-to-Fill", value: "—" },
      ];

  return (
    <div className="space-y-6 min-w-0">
      {/* Error banner (soft, non-blocking) */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* KPI Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading && !summary
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx}>{loadingSkeleton}</div>
            ))
          : kpis.map((k) => (
              <div
                key={k.label}
                className="rounded-lg border bg-white p-4 flex flex-col justify-between"
              >
                <div className="text-sm font-medium text-[#FF7043] truncate">
                  {k.label}
                </div>
                <div className="text-2xl font-semibold mt-1">{k.value}</div>
              </div>
            ))}
      </section>

      {/* Panels */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* Simple funnel panel */}
        <Panel title="Funnel Overview">
          {isLoading && !summary ? (
            <div className="text-sm grid gap-2 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-2/3" />
              <div className="h-3 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ) : summary ? (
            <div className="text-sm grid gap-1">
              <div>
                Views → Applies → Hires are tracked per job and rolled up here.
              </div>
              <div className="text-xs text-slate-500 pt-1">
                As candidates start interacting with your roles, you’ll see
                funnel insight appear automatically.
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              Once you start posting jobs and receiving applicants, funnel
              insights will appear here.
            </div>
          )}
        </Panel>

        {/* Responsiveness / accountability panel */}
        <Panel title="Responsiveness & Activity">
          {isEnterprise ? (
            isLoading && !summary ? (
              <div className="text-sm grid gap-2 animate-pulse">
                <div className="h-3 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
              </div>
            ) : summary ? (
              <div className="text-sm grid gap-1">
                <div>
                  Average response time to new applicants will appear here once
                  you start reviewing candidates.
                </div>
                <div className="text-xs text-slate-500 pt-1">
                  This helps seekers understand how quickly your team typically
                  responds on ForgeTomorrow.
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                As you interact with applicants, we’ll surface response and
                activity metrics here.
              </div>
            )
          ) : (
            <FeatureLock label="Responsiveness Metrics">
              <div className="text-sm text-slate-500">
                Upgrade to Enterprise to unlock team responsiveness and employer
                accountability metrics.
              </div>
            </FeatureLock>
          )}
        </Panel>

        {/* Small guidance / next steps panel */}
        <Panel title="Next Steps">
          <div className="text-sm text-slate-600 space-y-2">
            <p>
              Use this tracker as your single place to understand how each role
              is performing and where candidates are in your process.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Post a new job to start collecting applicants.</li>
              <li>Review candidates regularly to keep response times healthy.</li>
              <li>
                Visit <span className="font-medium">Analytics</span> for deeper
                breakdowns by job, recruiter, and source.
              </li>
            </ul>
          </div>
        </Panel>
      </section>

      {/* Job list table */}
      <section className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="font-medium">Jobs Overview</div>
          <SecondaryButton href="/recruiter/job-postings" size="sm">
            Manage All Jobs
          </SecondaryButton>
        </div>

        {isLoading && !jobs.length ? (
          <div className="text-sm text-slate-500 animate-pulse">
            Loading your jobs…
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-sm text-slate-500">
            You don’t have any tracked jobs yet. Post a role to start seeing
            views, applies, and activity here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-t">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="py-2 pr-3">Job</th>
                  <th className="py-2 pr-3">Location</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3 text-right">Views</th>
                  <th className="py-2 pr-3 text-right">Applies</th>
                  <th className="py-2 pr-3 text-right">New</th>
                  <th className="py-2 pr-3 whitespace-nowrap">Last Activity</th>
                  <th className="py-2 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-t border-slate-100 align-middle"
                  >
                    <td className="py-2 pr-3">
                      <div className="font-medium truncate max-w-xs">
                        {job.title || "Untitled role"}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-slate-600">
                      {job.location || "—"}
                    </td>
                    <td className="py-2 pr-3 text-slate-600">
                      {job.status || "Open"}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {typeof job.views === "number" ? job.views : "—"}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {typeof job.applies === "number" ? job.applies : "—"}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {typeof job.newApplicants === "number"
                        ? job.newApplicants
                        : "—"}
                    </td>
                    <td className="py-2 pr-3 text-slate-600 whitespace-nowrap">
                      {job.lastActivity || "—"}
                    </td>
                    <td className="py-2 pl-3 text-right">
                      {/* For now, send them to the existing job postings page.
                          When you have per-job routes, you can swap this link. */}
                      <SecondaryButton
                        href="/recruiter/job-postings"
                        size="sm"
                      >
                        View
                      </SecondaryButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function RecruiterJobTrackerPage() {
  return (
    <PlanProvider>
      <RecruiterLayout
        title="ForgeTomorrow — Recruiter Job Tracker"
        header={<HeaderBar />}
        right={<RightToolsCard />}
      >
        <JobTrackerBody />
      </RecruiterLayout>
    </PlanProvider>
  );
}

export default RecruiterJobTrackerPage;
