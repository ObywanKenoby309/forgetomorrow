// components/jobs/JobApplyModal.js

import { useState } from "react";

export default function JobApplyModal({ job, onClose }) {
  const [submitting, setSubmitting] = useState(false);

  function resolveApplyLink(job) {
    return job?.externalUrl || job?.applyUrl || job?.url || job?.link || null;
  }

  function buildFallbackSearch(job) {
    const parts = [];
    if (job?.title) parts.push(job.title);
    if (job?.company) parts.push(job.company);
    parts.push("careers");

    const query = encodeURIComponent(parts.join(" "));
    return `https://www.google.com/search?q=${query}`;
  }

  async function handleSubmit(e) {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    if (submitting) return;
    setSubmitting(true);

    const applyLink = resolveApplyLink(job);

    try {
      // Record application / interest for Pipeline
      // This matches pages/api/apply.js (jobId, resumeId, coverId)
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job?.id,
          resumeId: null,
          coverId: null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit application");
      }

      // External jobs: open employer posting (or a careers search fallback)
      const finalUrl = applyLink || buildFallbackSearch(job);
      window.open(finalUrl, "_blank", "noopener,noreferrer");

      if (typeof onClose === "function") {
        onClose();
      }
    } catch (err) {
      console.error("Error submitting application:", err);
      alert(
        "Something went wrong while starting your application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold mb-2">
          External job posting
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          ForgeTomorrow will record this in your pipeline, then we will open the employer&apos;s application page in a new tab.
          If we don&apos;t have a direct link, we&apos;ll open a careers search for this company and role.
        </p>

        <div className="text-sm text-gray-800 mb-4">
          <div className="font-semibold">{job?.title || "Role"}</div>
          <div className="text-gray-600">{job?.company || "Company"}</div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* If you want, add resume/cover selectors here later */}

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm rounded-md border border-gray-300"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-orange-500 text-white font-medium disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Opening..." : "Continue to employer site"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
