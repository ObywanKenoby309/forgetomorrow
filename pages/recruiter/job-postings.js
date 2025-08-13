// pages/recruiter/job-postings.js
import Head from "next/head";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterHeader from "../../components/recruiter/RecruiterHeader";
import JobTable from "../../components/recruiter/JobTable";

function Body() {
  const { isEnterprise } = usePlan();

  const jobs = [
    { id: 1, title: "Client Success Team Lead", status: "Open", views: 312, applications: 24 },
    { id: 2, title: "Onboarding Specialist", status: "Draft", views: 0, applications: 0 },
    { id: 3, title: "Support Operations Manager", status: "Closed", views: 891, applications: 73 },
  ];

  const handleEdit = (job) => console.log("Edit", job);
  const handleView = (job) => console.log("View", job);
  const handleClose = (job) => console.log("Close", job);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Job Postings</h1>
        <div className="flex items-center gap-2">
          <button className="rounded bg-black text-white text-sm px-3 py-2">Post a Job</button>
          {!isEnterprise ? (
            <button className="rounded border px-3 py-2 text-sm" title="Enterprise only">🔒 AI Job Description Optimizer</button>
          ) : (
            <button className="rounded border px-3 py-2 text-sm">AI Job Description Optimizer</button>
          )}
        </div>
      </div>

      <JobTable jobs={jobs} onEdit={handleEdit} onView={handleView} onClose={handleClose} />

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
