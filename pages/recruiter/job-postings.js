// pages/recruiter/job-postings.js
import { useState } from "react";
import { PlanProvider } from "@/context/PlanContext";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import JobTable from "@/components/recruiter/JobTable";
import JobFormModal from "@/components/recruiter/JobFormModal";
import { PrimaryButton } from "@/components/ui/Buttons";

function HeaderBar({ onOpenModal }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3">
      <div className="hidden md:block" />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#FF7043]">Job Postings</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-xl mx-auto">
          Create and manage roles, then track performance and applications.
        </p>
      </div>
      <div className="justify-self-center md:justify-self-end">
        <PrimaryButton onClick={onOpenModal}>Post a Job</PrimaryButton>
      </div>
    </div>
  );
}

function RightToolsCard() {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="font-medium mb-2">Tips</div>
      <div className="text-sm text-slate-600 space-y-2">
        <p>Use clear titles and must‑have skills up top.</p>
        <p>Keep requirements lean to boost applies.</p>
      </div>
    </div>
  );
}

function Body({ rows, onEdit, onView, onClose }) {
  return (
    <main className="space-y-6">
      <div className="rounded-lg border bg-white p-2 sm:p-4">
        <JobTable 
          jobs={rows} 
          onEdit={onEdit} 
          onView={onView} 
          onClose={onClose} 
        />
      </div>
      <div className="rounded-lg border bg-white p-4 text-sm">
        <div className="font-medium mb-2">Job Performance (Preview)</div>
        <div className="text-slate-500">[Chart placeholder — AnalyticsCharts later]</div>
      </div>
    </main>
  );
}

export default function JobPostingsPage() {
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
    company: data.company,
    worksite: data.worksite,
    location: data.location,
    status: data.status,
    views: 0,
    applications: 0,
  };
  setRows([newRow, ...rows]);
  setOpen(false);
  console.log("JOB SAVED", { id, ...data });
};

  const handleEdit = (job) => console.log("Edit", job);
  const handleView = (job) => console.log("View", job);
  const handleClose = (job) => console.log("Close", job);

  return (
    <PlanProvider>
      <RecruiterLayout
        title="Job Postings — ForgeTomorrow"
        header={<HeaderBar onOpenModal={() => setOpen(true)} />}
        right={<RightToolsCard />}
      >
        <Body 
          rows={rows} 
          onEdit={handleEdit} 
          onView={handleView} 
          onClose={handleClose} 
        />
        <JobFormModal open={open} onClose={() => setOpen(false)} onSave={handleSaveJob} />
      </RecruiterLayout>
    </PlanProvider>
  );
}