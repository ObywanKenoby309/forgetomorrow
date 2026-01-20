// components/ai/ATSAdvisor.js
"use client";

import { useState } from "react";

export default function ATSAdvisor({ draft, title, company }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const hasDescription = !!draft && draft.trim().length > 0;

  const handleAnalyze = async () => {
    if (!hasDescription || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/recruiter/ats-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: draft,
          title: (title || "").trim() || "(Untitled role)",
          company: company || "",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      setResult(json);
    } catch (err) {
      console.error("[ATSAdvisor] API error", err);
      setResult({
        error:
          err.message ||
          "We could not review this description. Please try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getQualityLabel = (score) => {
    if (typeof score !== "number") return null;
    if (score >= 80) return { label: "Strong foundation", cls: "bg-emerald-600 text-white" };
    if (score >= 60) return { label: "Solid start", cls: "bg-slate-800 text-white" };
    return { label: "Needs clarity", cls: "bg-amber-600 text-white" };
  };

  const quality = getQualityLabel(result?.score);

  return (
    <div className="mt-3 p-4 border border-slate-200 rounded-lg bg-slate-50">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <p className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
            Clarity Review
          </p>
          <p className="text-[11px] text-slate-700">
            Highlights what reads clearly, what may confuse candidates, and the fastest improvements to make.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!hasDescription || loading}
          className={`px-3 py-1.5 text-xs font-semibold rounded ${
            !hasDescription || loading
              ? "bg-slate-300 text-slate-600 cursor-not-allowed"
              : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          {loading ? "Reviewing…" : "Run review"}
        </button>
      </div>

      {!hasDescription && (
        <p className="mt-1 text-[11px] text-slate-600">
          Add a description above, then run the review.
        </p>
      )}

      {result && !result.error && (
        <div className="mt-3 space-y-3 text-xs text-slate-800">
          {/* Summary line */}
          <div className="flex items-center gap-3 flex-wrap">
            {quality && (
              <span className={`inline-flex items-center justify-center rounded-full text-[11px] px-3 py-1 font-semibold ${quality.cls}`}>
                {quality.label}
              </span>
            )}
            {result.summary && (
              <p className="text-[11px] text-slate-700 max-w-xl">
                {result.summary}
              </p>
            )}
          </div>

          {/* Strengths */}
          {Array.isArray(result.strengths) && result.strengths.length > 0 && (
            <div>
              <p className="font-semibold text-slate-900 mb-1">
                What is working well
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {result.strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Issues */}
          {Array.isArray(result.issues) && result.issues.length > 0 && (
            <div>
              <p className="font-semibold text-slate-900 mb-1">
                What may cause confusion
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {result.issues.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {Array.isArray(result.suggestions) && result.suggestions.length > 0 && (
            <div>
              <p className="font-semibold text-slate-900 mb-1">
                Suggested improvements
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {result.suggestions.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Intentionally hiding extracted terms to avoid "keyword theater" */}
        </div>
      )}

      {result && result.error && (
        <p className="mt-2 text-[11px] text-red-600">{result.error}</p>
      )}
    </div>
  );
}
