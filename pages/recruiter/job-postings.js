// pages/recruiter/job-postings.js
import Head from "next/head";
import { useState } from "react";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterHeader from "../../components/recruiter/RecruiterHeader";
import JobTable from "../../components/recruiter/JobTable";
import JobFormModal from "../../components/recruiter/JobFormModal";
import FeatureLock from "../../components/recruiter/FeatureLock";

function Body() {
  const { isEnterprise } = usePlan();
  const [open, setOpen] = useState(false);

  const [rows, setRows] = useState([
    { id: 1, title: "Client Success Team Lead", status: "Open", views: 312, applications: 24 },
    { id: 2, title: "Onboarding Specialist", status: "Draft", views: 0, applications: 0 },
    { id: 3, title: "Support Operations Manager", status: "Closed", views: 891, applications: 73 },
  ]);

  const handleSaveJob = (data) => {
    const id = Math.max(0, ...rows.map((r) => r.id)) + 1;
    const newRow = {
      id,
      title: data.title,
      status: data.status,
      views: 0,
      applications: 0,
    };
    setRows([newRow, ...rows]);
    setOpen(false);
    console.log("JOB SAVED (demo)", { id, ...data });
  };

  const handleEdit = (job) => console.log("Edit", job);
  const handleView = (job) => console.log("View", job);
  const handleClose = (job) => console.log("Close", job);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Job Postings</h1>
        <div className="flex items-center gap-2">
          <button className="rounded bg-black text-white text-sm px-3 py-2" onClick={() => setOpen(true)}>
            Post a Job
          </button>

          {/* AI JD Optimizer — Enterprise-only */}
          {isEnterprise ? (
            <button className="rounded border px-3 py-2 text-sm">AI Job Description Optimizer</button>
          ) : (
            <FeatureLock label="AI Job Description Optimizer">
              <button className="rounded border px-3 py-2 text-sm">AI Job Description Optimizer</button>
            </FeatureLock>
          )}
        </div>
      </div>

      {/* Table */}
      <JobTable jobs={rows} onEdit={handleEdit} onView={handleView} onClose={handleClose} />

      {/* Job Performance Analytics — Enterprise-only */}
      {isEnterprise ? (
        <div className="rounded-md border p-4 text-sm bg-white">
          <div className="font-medium mb-2">Job Performance (Preview)</div>
          <div className="text-slate-500">[Chart placeholder — AnalyticsCharts later]</div>
        </div>
      ) : (
        <FeatureLock label="Job Performance Analytics">
          <div className="rounded-md border p-4 text-sm bg-white">
            <div className="font-medium mb-2">Job Performance (Preview)</div>
            <div className="text-slate-500">[Chart placeholder — AnalyticsCharts later]</div>
          </div>
        </FeatureLock>
      )}

      {/* Post-a-Job modal */}
      <JobFormModal open={open} onClose={() => setOpen(false)} onSave={handleSaveJob} />
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
