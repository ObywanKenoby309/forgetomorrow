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

function Body({
  rows,
  loading,
  error,
  onEdit,
  onView,
  onClose,
  onDeleteTemplate,
  viewMode,
  onChangeViewMode,
  onUseTemplate,
}) {
  const tableRows = useMemo(
    () =>
      (rows || []).map((j) => ({
        ...j,
        // Map Prisma fields → table expectations
        views: j.viewsCount ?? j.views ?? 0,
        applications: j.applicationsCount ?? j.applications ?? 0,
      })),
    [rows]
  );

  const isTemplates = viewMode === "templates";

  return (
    <main className="space-y-6">
      {/* Error banner (only for real failures) */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="font-semibold mb-1">
            We had trouble loading job postings.
          </div>
          <p>
            The system couldn't load your latest postings. Our team is notified
            automatically. If you don't see an update or status communication
            within 30 minutes, please contact Support so we can investigate.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-white p-2 sm:p-4">
        {/* Jobs | Templates toggle */}
        <div className="px-2 sm:px-0 pb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeViewMode?.("jobs")}
            className={`px-3 py-1.5 rounded border text-sm ${
              viewMode === "jobs"
                ? "bg-[#FF7043] text-white border-[#FF7043]"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Jobs
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode?.("templates")}
            className={`px-3 py-1.5 rounded border text-sm ${
              viewMode === "templates"
                ? "bg-[#FF7043] text-white border-[#FF7043]"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Templates
          </button>

          <div className="ml-auto text-xs text-slate-500">
            {isTemplates
              ? "Reusable role templates"
              : "Active and draft job postings"}
          </div>
        </div>

        <JobTable
          jobs={tableRows}
          mode={isTemplates ? "templates" : "jobs"}
          onEdit={onEdit}
          onView={onView}
          onClose={onClose}
          onUseTemplate={onUseTemplate}
          // ✅ NEW: templates-only delete action (button shows only in templates mode)
          onDelete={onDeleteTemplate}
        />

        {loading && (
          <div className="px-4 py-3 text-xs text-slate-500 text-right">
            Refreshing…
          </div>
        )}
      </div>

      {/* Performance preview – wired later to analytics */}
      {!isTemplates && (
        <div className="rounded-lg border bg-white p-4 text-sm">
          <div className="font-medium mb-2">Job Performance (Preview)</div>
          <div className="text-slate-500">
            This area will pull per-job funnel metrics from Recruiter Analytics
            in a later pass.
          </div>
        </div>
      )}
    </main>
  );
}

export default function JobPostingsPage() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // NEW: track whether we are creating / editing / viewing
  const [editingJob, setEditingJob] = useState(null);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit" | "view"

  // NEW: jobs vs templates view
  const [viewMode, setViewMode] = useState("jobs"); // "jobs" | "templates"

  // ──────────────────────────────────────────────────────────────
  // Load job postings for the current recruiter
  // ──────────────────────────────────────────────────────────────
  const loadJobs = useCallback(async (kind = "jobs") => {
    try {
      setLoading(true);
      setLoadError(null);

      const res = await fetch(
        `/api/recruiter/job-postings?kind=${encodeURIComponent(kind)}`
      );
      let json = null;

      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          console.warn("[JobPostings] non-fatal status", res.status, json);
          setRows([]);
          return;
        }

        const message = json?.error || `HTTP ${res.status}`;
        throw new Error(message);
      }

      setRows(Array.isArray(json?.jobs) ? json.jobs : []);
    } catch (err) {
      console.error("[JobPostings] load error", err);
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs(viewMode);
  }, [loadJobs, viewMode]);

  // ──────────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────────

  const openCreateModal = () => {
    setEditingJob(null);
    setModalMode("create");
    setOpen(true);
  };

  const handleSaveJob = async (formData) => {
    try {
      let res;

      if (editingJob?.id && modalMode === "edit") {
        // UPDATE existing job/template
        res = await fetch("/api/recruiter/job-postings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingJob.id,
            ...formData,
          }),
        });
      } else {
        // CREATE new job (templates are created inside modal to avoid closing)
        res = await fetch("/api/recruiter/job-postings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const savedJob = json.job;

      if (savedJob) {
        if (editingJob?.id && modalMode === "edit") {
          setRows((prev) =>
            prev.map((j) => (j.id === savedJob.id ? savedJob : j))
          );
        } else {
          setRows((prev) => [savedJob, ...prev]);
        }
      }

      setOpen(false);
      setEditingJob(null);
      setModalMode("create");
    } catch (err) {
      console.error("[JobPostings] save error", err);
      alert(
        "We couldn't save this job posting. Please try again in a moment, and contact Support if the issue continues."
      );
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setModalMode("edit");
    setOpen(true);
  };

  const handleView = (job) => {
    setEditingJob(job);
    setModalMode("view");
    setOpen(true);
  };

  const handleUseTemplate = (templateJob) => {
    // Use Template -> open modal in create mode with fields prefilled
    setEditingJob(templateJob);
    setModalMode("create");
    setOpen(true);
  };

  const handleCloseJob = async (job) => {
    if (!job?.id) return;

    // Do not allow "Close" for templates (defense-in-depth)
    if (job?.isTemplate) return;

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

  // ✅ NEW: Delete action for templates (UI now supports it; API needs DELETE handler)
  const handleDeleteTemplate = async (job) => {
    if (!job?.id) return;

    // defense: only allow delete for templates (UI already scopes it)
    if (!job?.isTemplate) return;

    const name = job.templateName || job.title || "this template";

    const ok = window.confirm(
      `Delete "${name}"? This cannot be undone.`
    );
    if (!ok) return;

    try {
      const res = await fetch("/api/recruiter/job-postings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: job.id }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      // remove from current list immediately
      setRows((prev) => prev.filter((j) => j.id !== job.id));
    } catch (err) {
      console.error("[JobPostings] delete template error", err);
      alert(
        "We couldn't delete this template. Please refresh and try again, and contact Support if the issue continues."
      );
    }
  };

  const handleModalClose = () => {
    setOpen(false);
    setEditingJob(null);
    setModalMode("create");
  };

  const handleChangeViewMode = (next) => {
    setViewMode(next);
    // reset modal state (safe)
    setEditingJob(null);
    setModalMode("create");
  };

  return (
    <PlanProvider>
      <RecruiterLayout
        title="Job Postings — ForgeTomorrow"
        header={<HeaderBar onOpenModal={openCreateModal} />}
        right={<RightToolsCard />}
        activeNav="job-postings" // highlight "Job Posting" in recruiter sidebar
      >
        <Body
          rows={rows}
          loading={loading}
          error={loadError}
          onEdit={handleEdit}
          onView={handleView}
          onClose={handleCloseJob}
          onDeleteTemplate={handleDeleteTemplate}
          viewMode={viewMode}
          onChangeViewMode={handleChangeViewMode}
          onUseTemplate={handleUseTemplate}
        />

        <JobFormModal
          open={open}
          mode={modalMode}
          initialJob={editingJob}
          onClose={handleModalClose}
          onSave={handleSaveJob}
        />
      </RecruiterLayout>
    </PlanProvider>
  );
}
