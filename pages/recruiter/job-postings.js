// pages/recruiter/job-postings.js
import { useState } from "react";
import { PlanProvider, usePlan } from "../../context/PlanContext";
import RecruiterLayout from "../../components/layouts/RecruiterLayout";
import JobTable from "../../components/recruiter/JobTable";
import JobFormModal from "../../components/recruiter/JobFormModal";
import { PrimaryButton, SecondaryButton } from "../../components/ui/Buttons";

function HeaderBar({ onOpenModal }) {
  const { isEnterprise } = usePlan();

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
        <div className="flex items-center gap-2">
          <PrimaryButton onClick={onOpenModal}>Post a Job</PrimaryButton>

          {isEnterprise ? (
            <SecondaryButton href="#" onClick={(e) => e.preventDefault()}>
              AI Job Description Optimizer
            </SecondaryButton>
          ) : (
            // Overlay (tooltip) that does not change layout height
            <span className="relative inline-block align-middle group">
              <SecondaryButton
                onClick={(e) => {
                  e.preventDefault();
                  // you can route to upgrade page here if desired
                }}
              >
                AI Job Description Optimizer
              </SecondaryButton>

              {/* Floating upgrade callout (no layout shift) */}
              <span
                className="
                  absolute -top-10 right-0 hidden group-hover:block
                  whitespace-nowrap rounded-md border bg-white px-3 py-1 text-xs
                  shadow-md text-slate-700
                "
                style={{ zIndex: 30 }}
              >
                🔒 Upgrade to use AI Job Description Optimizer
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Optional right column tools */
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
  const { isEnterprise } = usePlan();

  return (
    <main className="space-y-6">
      {/* Table */}
      <div className="rounded-lg border bg-white p-2 sm:p-4">
        <JobTable jobs={rows} onEdit={onEdit} onView={onView} onClose={onClose} />
      </div>

      {/* Job Performance Analytics */}
      {isEnterprise ? (
        <div className="rounded-lg border bg-white p-4 text-sm">
          <div className="font-medium mb-2">Job Performance (Preview)</div>
          <div className="text-slate-500">[Chart placeholder — AnalyticsCharts later]</div>
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-4 text-sm">
          <div className="font-medium mb-2">Job Performance (Preview)</div>
          <div className="text-slate-500">[Chart placeholder — AnalyticsCharts later]</div>
        </div>
      )}
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
    const newRow = { id, title: data.title, status: data.status, views: 0, applications: 0 };
    setRows([newRow, ...rows]);
    setOpen(false);
    console.log("JOB SAVED (demo)", { id, ...data });
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
        <Body rows={rows} onEdit={handleEdit} onView={handleView} onClose={handleClose} />

        {/* Post-a-Job modal */}
        <JobFormModal open={open} onClose={() => setOpen(false)} onSave={handleSaveJob} />
      </RecruiterLayout>
    </PlanProvider>
  );
}
