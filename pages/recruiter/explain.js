// pages/recruiter/explain.js
import { useState } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";

import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import RightRailPlacementManager from "@/components/ads/RightRailPlacementManager";
import WHYScoreInfo from "@/components/ai/WHYScoreInfo";
import RecruiterTitleCard from "@/components/recruiter/RecruiterTitleCard";
import { getTimeGreeting } from "@/lib/dashboardGreeting";

// ✅ NEW: use the same drawer UX as Candidates
import WhyCandidateDrawer from "../../components/recruiter/WhyCandidateDrawer";

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

export default function RecruiterExplainPage() {
  const { data: session, status } = useSession();

  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showWhyPanel, setShowWhyPanel] = useState(false);

  // ✅ NEW: drawer state (like Candidates)
  const [whyOpen, setWhyOpen] = useState(false);
  const [whyData, setWhyData] = useState(null);

  const greeting = getTimeGreeting();

  const HeaderBox = (
    <RecruiterTitleCard
      greeting={greeting}
      title="Resume & Job Match Explainability"
      subtitle="Paste a job description and a resume to generate explainable alignment insights. This tool supports recruiter judgment by mapping evidence, highlighting strengths and gaps, and guiding interviews. It does not make hiring decisions."
      compact
    />
  );

  const hasResult = !!result;
  const showPanel = showWhyPanel && hasResult; // kept (no behavior change required elsewhere)

  // Minimal auth gate (consistent with other recruiter pages)
  if (status === "loading") return null;
  if (!session) return null;

  async function handleAnalyze() {
    if (!resumeText || !jobDescription) {
      setError("Please provide both a resume and a job description.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/recruiter/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Explainability request failed");
      }

      const data = await res.json();

      // keep storing result for later wiring
      setResult(data);

      // ✅ CHANGE: open the RIGHT-SIDE overlay drawer (like Candidates)
      setWhyData(data);
      setWhyOpen(true);

      // keep existing flag behavior (even though we no longer render the inline panel)
      setShowWhyPanel(true);
    } catch (err) {
      console.error("[RecruiterExplain] error", err);
      setError("We were unable to run the analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClosePanel() {
    setShowWhyPanel(false);
    setWhyOpen(false); // ✅ ensure Close behavior still closes the overlay
  }

  function handleClearJD() {
    setJobDescription("");
  }

  function handleClearResume() {
    setResumeText("");
  }

  return (
    <RecruiterLayout
      title="Applicant Explain — ForgeTomorrow"
      header={HeaderBox}
      headerCard={false}
      right={<RightRailPlacementManager surfaceId="applicant_explain" />}
      rightVariant="light"
      activeNav="applicant-explain"
    >
      <Head>
        <title>Resume &amp; JD Explainability | ForgeTomorrow</title>
      </Head>

      {/* Align like Candidates: let layout control the left gap; no centering container */}
      <section style={{ width: "100%", padding: "0 14px 18px" }}>
        {/* Workspace fills the main column (ads live in layout right rail) */}
        <div style={{ ...GLASS_WORKSPACE, padding: 16, width: "100%" }}>
          <div
            style={{
              display: "grid",
              // ✅ CHANGE: never allocate a right column; drawer overlays instead
              gridTemplateColumns: "1fr",
              gap: 14,
              alignItems: "start",
            }}
          >
            {/* Inputs column */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              {/* Job Description Card (left) */}
              <div style={{ ...CARD, padding: 14, minHeight: 460, position: "relative" }}>
                <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>
                  Job Description
                </div>

                <textarea
                  rows={16}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description here…"
                  style={{
                    width: "100%",
                    resize: "vertical",
                    borderRadius: 12,
                    border: "1px solid rgba(15,23,42,0.12)",
                    padding: 12,
                    fontSize: 13,
                    lineHeight: 1.45,
                    background: "rgba(255,255,255,0.88)",
                    minHeight: 360,
                    marginBottom: 64,
                    boxSizing: "border-box",
                  }}
                />

                {/* Clear bottom-right */}
                <div style={{ position: "absolute", right: 14, bottom: 14 }}>
                  <button
                    type="button"
                    onClick={handleClearJD}
                    style={{
                      border: "1px solid rgba(15,23,42,0.18)",
                      background: "rgba(255,255,255,0.70)",
                      padding: "10px 12px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                    title="Clear job description"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Resume Card (right) */}
              <div style={{ ...CARD, padding: 14, minHeight: 460, position: "relative" }}>
                <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>Resume</div>

                <textarea
                  rows={16}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste resume text here…"
                  style={{
                    width: "100%",
                    resize: "vertical",
                    borderRadius: 12,
                    border: "1px solid rgba(15,23,42,0.12)",
                    padding: 12,
                    fontSize: 13,
                    lineHeight: 1.45,
                    background: "rgba(255,255,255,0.88)",
                    minHeight: 360,
                    marginBottom: 64,
                    boxSizing: "border-box",
                  }}
                />

                {/* Bottom-right actions: Clear + Result */}
                <div
                  style={{
                    position: "absolute",
                    right: 14,
                    bottom: 14,
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleClearResume}
                    style={{
                      border: "1px solid rgba(15,23,42,0.18)",
                      background: "rgba(255,255,255,0.70)",
                      padding: "10px 12px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                    title="Clear resume"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={loading}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,112,67,0.45)",
                      background: "rgba(255,112,67,0.20)",
                      color: "rgba(15,23,42,0.85)",
                      fontWeight: 900,
                      fontSize: 13,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Analyzing…" : "Result"}
                  </button>
                </div>
              </div>

              {/* Error message (spans two cards) */}
              {error && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <p style={{ color: "red", margin: "6px 0 0" }}>{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ✅ NEW: Right-side overlay drawer (same UX as Candidates) */}
      <WhyCandidateDrawer
        open={whyOpen}
        onClose={() => {
          setWhyOpen(false);
          setShowWhyPanel(false);
        }}
        explain={whyData}
        mode="full"
        onViewCandidate={() => {
          // no-op for now (Explain page doesn't have a candidate entity yet)
          setWhyOpen(false);
          setShowWhyPanel(false);
        }}
      />
    </RecruiterLayout>
  );
}