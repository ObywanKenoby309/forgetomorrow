// components/recruiter/candidate-center/ExternalCompareModule.js
import { useState } from "react";

import WhyCandidateDrawer from "@/components/recruiter/WhyCandidateDrawer";

const GLASS_WORKSPACE = {
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderRadius: 18,
  boxShadow: "0 14px 44px rgba(0,0,0,0.22)",
};

const CARD = {
  border: "1px solid rgba(15,23,42,0.10)",
  background: "rgba(255,255,255,0.78)",
  borderRadius: 16,
  boxShadow: "0 10px 26px rgba(0,0,0,0.10)",
};

export default function ExternalCompareModule() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [whyOpen, setWhyOpen] = useState(false);
  const [whyData, setWhyData] = useState(null);

  async function handleAnalyze() {
    if (!resumeText || !jobDescription) {
      setError("Please provide both a resume and a job description.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/recruiter/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Explain failed");
      }

      setWhyData(data);
      setWhyOpen(true);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ ...GLASS_WORKSPACE, padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* JD */}
        <div style={{ ...CARD, padding: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>
            Job Description
          </div>

          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job description..."
            style={{ width: "100%", minHeight: 300 }}
          />
        </div>

        {/* Resume */}
        <div style={{ ...CARD, padding: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>
            Resume
          </div>

          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste resume..."
            style={{ width: "100%", minHeight: 300 }}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 12 }}>
        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "Run Explainability"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 10, color: "red" }}>{error}</div>
      )}

      <WhyCandidateDrawer
        open={whyOpen}
        onClose={() => setWhyOpen(false)}
        explain={whyData}
        mode="full"
      />
    </div>
  );
}