// pages/recruiter/job-postings.js
import { useState, useEffect } from "react";
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
        <p>Use clear titles and must-have skills up top.</p>
        <p>Keep requirements lean to boost applies.</p>
      </div>
    </div>
  );
}

function Body({ rows, isLoading, onEdit, onView, onClose }) {
  return (
    <main className="space-y-6">
      <div className="rounded-lg border bg-white p-2 sm:p-4">
        {isLoading ? (
          <div className="text-sm text-slate-600">Loading job postings...</div>
        ) : (
          <JobTable
            jobs={rows}
            onEdit={onEdit}
            onView={onView}
            onClose={onClose}
          />
        )}
      </div>
    </main>
  );
}

export default function JobPostingsPage() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Load real jobs from the shared /api/jobs feed (Railway Postgres + cron)
  useEffect(() => {
    let isMounted = true;

    async function fetchJobs() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/jobs");
        if (!res.ok) {
          throw new Error(`Failed to load jobs: ${res.status}`);
        }
        const json = await res.json();
        if (!isMounted) return;

        const jobs = Array.isArray(json.jobs) ? json.jobs : [];
        setRows(jobs);
        setLoadError(null);
      } catch (err) {
        console.error("[Recruiter Job Postings] Error loading jobs:", err);
        if (isMounted) {
          // Sev-1 style transparency: the feed is critical to the service
          setLoadError(
            "We had trouble loading job postings. Contact the Support Team if communication isn't provided in 30 minutes."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchJobs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Post a new job into the shared pipeline (Railway jobs table)
  const handleSaveJob = async (data) => {
    setSaveError(null);

    try {
      const res = await fetch("/api/recruiter/job-postings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const msg =
          payload?.error ||
          `Failed to save job posting (status ${res.status}).`;
        throw new Error(msg);
      }

      const created = await res.json();

      // Normalize for the recruiter table:
      // jobs from /api/jobs won't have status/urgent/views/apps columns yet,
      // but for brand-new recruiter-created postings, we can truthfully start at zero.
      const normalized = {
        ...created,
        worksite: data.worksite || created.worksite || "",
        location: data.location || created.location || "",
        status: data.status || "Open",
        urgent: !!data.urgent,
        views: created.views ?? 0,
        applications: created.applications ?? 0,
      };

      setRows((prev) => [normalized, ...(prev || [])]);
      setOpen(false);
      console.log("JOB SAVED (pipeline)", normalized);
    } catch (err) {
      console.error("[Recruiter Job Postings] save error:", err);
      setSaveError(
        "We couldn't save this job to the shared job feed. Your changes haven't been published yet."
      );
    }
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
        {/* Load error banner for Sev-1 style feed incidents */}
        {loadError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {loadError}
          </div>
        )}

        {/* Save error banner for recruiter posting issues */}
        {saveError && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {saveError}
          </div>
        )}

        <Body
          rows={rows}
          isLoading={isLoading}
          onEdit={handleEdit}
          onView={handleView}
          onClose={handleClose}
        />

        <JobFormModal
          open={open}
          onClose={() => setOpen(false)}
          onSave={handleSaveJob}
        />
      </RecruiterLayout>
    </PlanProvider>
  );
}
