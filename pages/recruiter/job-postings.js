import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { PlanProvider } from "@/context/PlanContext";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import RecruiterTitleCard from "@/components/recruiter/RecruiterTitleCard";
import RightRailPlacementManager from "@/components/ads/RightRailPlacementManager";
import JobTable from "@/components/recruiter/JobTable";
import JobFormModal from "@/components/recruiter/JobFormModal";
import { PrimaryButton } from "@/components/ui/Buttons";
import { getTimeGreeting } from "@/lib/dashboardGreeting";

const GLASS = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const ORANGE = "#FF7043";

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
  onViewApplicants,
  onOpenModal,
}) {
  const tableRows = useMemo(
    () =>
      (rows || []).map((j) => ({
        ...j,
        views: j.viewsCount ?? j.views ?? 0,
        applications: j.applicationsCount ?? j.applications ?? 0,
      })),
    [rows]
  );

  const isTemplates = viewMode === "templates";

  return (
    <main className="min-w-0 w-full space-y-6">
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

      <section
        style={{
          ...GLASS,
          padding: 16,
        }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: ORANGE,
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
                textShadow: "0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)",
              }}
            >
              Job Posting Tools
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "#64748B",
                lineHeight: 1.5,
              }}
            >
              Create and manage roles, then track performance and applications.
            </div>
          </div>

          <PrimaryButton onClick={onOpenModal}>Post a Job</PrimaryButton>
        </div>
      </section>

      <div className="min-w-0 w-full rounded-lg border bg-white p-2 sm:p-4">
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
          onDelete={onDeleteTemplate}
          onViewApplicants={onViewApplicants}
        />

        {loading && (
          <div className="px-4 py-3 text-xs text-slate-500 text-right">
            Refreshing…
          </div>
        )}
      </div>

      {!isTemplates && (
        <div className="min-w-0 w-full rounded-lg border bg-white p-4 text-sm">
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
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [editingJob, setEditingJob] = useState(null);
  const [modalMode, setModalMode] = useState("create");

  const [viewMode, setViewMode] = useState("jobs");

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

  const openCreateModal = () => {
    setEditingJob(null);
    setModalMode("create");
    setOpen(true);
  };

  const handleSaveJob = async (formData) => {
    try {
      let res;

      if (editingJob?.id && modalMode === "edit") {
        res = await fetch("/api/recruiter/job-postings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingJob.id,
            ...formData,
          }),
        });
      } else {
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
    setEditingJob(templateJob);
    setModalMode("create");
    setOpen(true);
  };

  const handleViewApplicants = (job) => {
    if (!job?.id) return;
    router.push(`/recruiter/job-postings/${job.id}`);
  };

  const handleCloseJob = async (job) => {
    if (!job?.id) return;
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

  const handleDeleteTemplate = async (job) => {
    if (!job?.id) return;
    if (!job?.isTemplate) return;

    const name = job.templateName || job.title || "this template";

    const ok = window.confirm(`Delete "${name}"? This cannot be undone.`);
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
    setEditingJob(null);
    setModalMode("create");
  };

  const greeting = getTimeGreeting();

  const HeaderBox = (
    <RecruiterTitleCard
      greeting={greeting}
      title="Job Postings"
      subtitle="Create and manage roles, then track performance and applications."
      compact
    />
  );

  const RightColumn = <RightRailPlacementManager slot="right_rail_1" />;

  return (
    <PlanProvider>
      <RecruiterLayout
        title="Job Postings - ForgeTomorrow"
        header={HeaderBox}
        headerCard={false}
        right={RightColumn}
        rightBare
        activeNav="job-postings"
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
          onViewApplicants={handleViewApplicants}
          onOpenModal={openCreateModal}
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