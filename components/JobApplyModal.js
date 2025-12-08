// components/jobs/JobApplyModal.js

import { useState } from "react";

export default function JobApplyModal({ job, onClose }) {
  const [submitting, setSubmitting] = useState(false);

  function resolveApplyLink(job) {
    return (
      job?.externalUrl ||
      job?.applyUrl ||
      job?.url ||
      job?.link ||
      null
    );
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
      await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          title: job.title,
          source: job.source,
          applyLink,
        }),
      });

      if (job.source === "External") {
        if (!applyLink) {
          alert(
            "This job does not have an external application link configured yet. Please check back soon."
          );
          setSubmitting(false);
          return;
        }

        window.open(applyLink, "_blank", "noopener,noreferrer");
      } else {
        alert(`Application submitted for: ${job.title}`);
      }

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
          Apply for {job?.title || "this job"}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          We will record this application in your pipeline. For external jobs,
          you will also be redirected to the employer&apos;s site to complete
          your application.
        </p>

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
              {submitting ? "Submitting..." : "Submit application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
