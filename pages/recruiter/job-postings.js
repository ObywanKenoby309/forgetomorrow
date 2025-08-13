// pages/recruiter/job-postings.js
import Head from "next/head";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterHeader from "../../components/recruiter/RecruiterHeader";

function Body() {
  const { isEnterprise } = usePlan();

  const jobs = [
    { id: 1, title: "Client Success Team Lead", status: "Open", views: 312, applications: 24 },
    { id: 2, title: "Onboarding Specialist", status: "Draft", views: 0, applications: 0 },
    { id: 3, title: "Support Operations Manager", status: "Closed", views: 891, applications: 73 },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Job Postings</h1>
        <div className="flex items-center gap-2">
          <button className="rounded bg-black text-white text-sm px-3 py-2">Post a Job</button>
          {!isEnterprise ? (
            <button className="rounded border px-3 py-2 text-sm" title="Enterprise only">
              🔒 AI Job Description Optimizer
            </button>
          ) : (
            <button className="rounded border px-3 py-2 text-sm">AI Job Description Optimizer</button>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Applications</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{j.title}</td>
                  <td className="px-4 py-3">{j.status}</td>
                  <td className="px-4 py-3">{j.views}</td>
                  <td className="px-4 py-3">{j.applications}</td>
                  <td className="px-4 py-3">
                    <button className="text-sm underline">Edit</button>
                    <span className="mx-2 text-slate-300">|</span>
                    <button className="text-sm underline">View</button>
                    <span className="mx-2 text-slate-300">|</span>
                    <button className="text-sm underline">Close</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!isEnterprise ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-slate-500 bg-slate-50">
          🔒 Job performance graph is an Enterprise feature. Upgrade to unlock.
        </div>
      ) : (
        <div className="rounded-md border p-4 text-sm bg-white">
          <div className="font-medium mb-2">Job Performance (Preview)</div>
          <div className="text-slate-500">[Chart placeholder — AnalyticsCharts later]</div>
        </div>
      )}
    </main>
  );
}

export default function JobPostingsPage() {
  return (
    <PlanProvider>
      <Head><title>Job Postings — ForgeTomorrow</title></Head>
      <RecruiterHeader />
      <Body />
    </PlanProvider>
  );
}
