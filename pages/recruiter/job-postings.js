// pages/recruiter/job-postings.js
import { useEffect, useState, useCallback, useMemo } from "react";
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

function Body({ rows, loading, error, onEdit, onView, onClose }) {
  const tableRows = useMemo(
    () =>
      (rows || []).map((j) => ({
        ...j,
        // Map Prisma fields → table expectations
        views: j.viewsCount ?? 0,
        applications: j.applicationsCount ?? 0,
      })),
    [rows]
  );

  return (
    <main className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="font-semibold mb-1">We had trouble loading job postings.</div>
          <p>
            The system couldn't load your latest postings. Our team is notified automatically.
            If you don't see an update or status communication within 30 minutes, please contact
            Support so we can investigate.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-white p-2 sm:p-4">
        <JobTable
          jobs={tableRows}
          onEdit={onEdit}
          onView={onView}
          onClose={onClose}
        />
        {loading && (
          <div className="px-4 py-3 text-xs text-slate-500 text-right">
            Refreshing job postings…
          </div>
        )}
      </div>

      {/* Performance preview – wired later to analytics */}
      <div className="rounded-lg border bg-white p-4 text-sm">
        <div className="font-medium mb-2">Job Performance (Preview)</div>
        <div className="text-slate-500">
          This area will pull per-job funnel metrics from Recruiter Analytics in a later pass.
        </div>
      </div>
    </main>
  );
}

export default function JobPostingsPage() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // ──────────────────────────────────────────────────────────────
  // Load job postings for the current recruiter
  // ──────────────────────────────────────────────────────────────
  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const res = await fetch("/api/recruiter/job-postings");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setRows(Array.isArray(json.jobs) ? json.jobs : []);
    } catch (err) {
      console.error("[JobPostings] load error", err);
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // ──────────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────────

  // Create new job
  const handleSaveJob = async (data) => {
    try {
      const res = await fetch("/api/recruiter/job-postings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const newJob = json.job;

      if (newJob) {
        setRows((prev) => [newJob, ...prev]);
      }

      setOpen(false);
    } catch (err) {
      console.error("[JobPostings] save error", err);
      alert(
        "We couldn't save this job posting. Please try again in a moment, and contact Support if the issue continues."
      );
    }
  };

  // Placeholder edit / view for now (front-end only)
  const handleEdit = (job) => {
    console.log("Edit (future wiring)", job);
    // Future: open modal pre-filled and PATCH /api/recruiter/job-postings
  };

  const handleView = (job) => {
    console.log("View (future wiring)", job);
    // Future: navigate to /job/[id] or recruiter detail view
  };

  // Close (update status → "Closed")
  const handleClose = async (job) => {
    if (!job?.id) return;
    const confirmClose = window.confirm(
      `Mark "${job.title}" as Closed? Candidates will no longer see it as open.`
    );
    if (!confirmClose) return;

    try {
      const res = await fetch("/api/recruiter/job-postings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: job.id, status: "Closed" }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const updated = json.job;
      if (updated) {
        setRows((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
      }
    } catch (err) {
      console.error("[JobPostings] close error", err);
      alert(
        "We couldn't update this job's status. Please refresh and try again, and contact Support if it keeps happening."
      );
    }
  };

  return (
    <PlanProvider>
      <RecruiterLayout
        title="Job Postings — ForgeTomorrow"
        header={<HeaderBar onOpenModal={() => setOpen(true)} />}
        right={<RightToolsCard />}
      >
        <Body
          rows={rows}
          loading={loading}
          error={loadError}
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
