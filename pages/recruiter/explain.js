// pages/recruiter/explain.js
import { useState } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";

import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import WHYScoreInfo from "@/components/ai/WHYScoreInfo";

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

function HeaderOnly() {
  return (
    <section
      style={{
        background: "white",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        border: "1px solid #eee",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          margin: 0,
          color: "#FF7043", // ✅ orange title text
          fontSize: 24,
          fontWeight: 900,
        }}
      >
        Resume &amp; Job Match Explainability
      </h1>
      <p
        style={{
          margin: "6px auto 0",
          color: "#607D8B",
          maxWidth: 720,
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        Paste a job description and a resume to generate explainable alignment insights.
        <br />
        <span style={{ fontSize: 13 }}>
          This tool supports recruiter judgment by mapping evidence and highlighting strengths,
          gaps, and interview guidance. It does not make hiring decisions.
        </span>
      </p>
    </section>
  );
}

export default function RecruiterExplainPage() {
  const { data: session, status } = useSession();

  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showWhyPanel, setShowWhyPanel] = useState(false);

  const hasResult = !!result;
  const showPanel = showWhyPanel && hasResult;

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
        body: JSON.stringify({
          resumeText,
          jobDescription,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Explainability request failed");
      }

      const data = await res.json();
      setResult(data);
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
      header={<HeaderOnly />}
      right={null}
      activeNav="applicant-explain"
    >
      <Head>
        <title>Resume &amp; JD Explainability | ForgeTomorrow</title>
      </Head>

      {/* ✅ Align left like Candidates: no centered container */}
      <section style={{ width: "100%", padding: "0 14px 18px" }}>
        <div
		  style={{
		  ...GLASS_WORKSPACE,
		  padding: 16,
		  width: "100%",
		  maxWidth: 1120,      // ✅ narrower so right side has room
		  margin: 0,           // ✅ keep it hugging left
		  marginRight: 420,    // ✅ reserves space on the right for ads
			}}
		  >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: showPanel ? "1fr 420px" : "1fr",
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
                    marginBottom: 64, // ✅ ensures bottom buttons never sit on textarea edge/border
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
                    marginBottom: 64, // ✅ prevents obstruction from borders/lines
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

            {/* Right panel (after result) */}
            {showPanel && (
              <aside
                style={{
                  ...CARD,
                  padding: 0,
                  overflow: "hidden",
                  height: "calc(100vh - 220px)",
                  minHeight: 560,
                  position: "sticky",
                  top: 96,
                }}
              >
                {/* Panel header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 14px",
                    borderBottom: "1px solid rgba(15,23,42,0.10)",
                    background: "rgba(255,255,255,0.82)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 900 }}>Why this candidate</div>
                    <div style={{ fontSize: 12, color: "rgba(15,23,42,0.62)" }}>
                      Expand all &nbsp;·&nbsp; Collapse all
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClosePanel}
                    style={{
                      border: "1px solid rgba(15,23,42,0.16)",
                      background: "rgba(255,255,255,0.70)",
                      padding: "8px 10px",
                      borderRadius: 10,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>

                {/* Panel body */}
                <div
                  style={{
                    padding: 14,
                    overflowY: "auto",
                    maxHeight: "calc(100% - 124px)",
                  }}
                >
                  {/* Match Summary */}
                  <div style={{ ...CARD, padding: 12, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 900 }}>Match Summary</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontWeight: 900, color: "rgba(255,112,67,1)" }}>
                          {typeof result?.score === "number" ? `${result.score}%` : "—"}
                        </div>
                        <WHYScoreInfo />
                      </div>
                    </div>

                    <div style={{ marginTop: 8, fontSize: 12, color: "rgba(15,23,42,0.70)" }}>
                      {result?.summary ||
                        "AI-assisted candidate–job alignment summary will appear here."}
                    </div>
                  </div>

                  <CollapsibleRow title="Requirements matched — with evidence" />
                  <CollapsibleRow title="Skills alignment" />
                  <CollapsibleRow title="Career path" />
                  <CollapsibleRow title="Matched your filters" />
                </div>

                {/* Panel footer */}
                <div
                  style={{
                    borderTop: "1px solid rgba(15,23,42,0.10)",
                    padding: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    background: "rgba(255,255,255,0.82)",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleClosePanel}
                    style={{
                      border: "1px solid rgba(15,23,42,0.18)",
                      background: "rgba(255,255,255,0.70)",
                      padding: "10px 12px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() => {}}
                    style={{
                      border: "1px solid rgba(255,112,67,0.55)",
                      background: "rgba(255,112,67,0.85)",
                      color: "white",
                      padding: "10px 12px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                    title="Optional: wire to candidate view later"
                  >
                    View full candidate
                  </button>
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>
    </RecruiterLayout>
  );
}

function CollapsibleRow({ title }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        border: "1px solid rgba(15,23,42,0.10)",
        background: "rgba(255,255,255,0.80)",
        borderRadius: 14,
        marginBottom: 10,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "12px 12px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontWeight: 900,
          fontSize: 13,
          color: "rgba(15,23,42,0.85)",
        }}
      >
        <span>{title}</span>
        <span style={{ fontWeight: 800, color: "rgba(15,23,42,0.55)" }}>
          {open ? "Collapse" : "Expand"}
        </span>
      </button>

      {open && (
        <div style={{ padding: "0 12px 12px", fontSize: 12, color: "rgba(15,23,42,0.70)" }}>
          Placeholder content for layout. Wire to real explainability sections next.
        </div>
      )}
    </div>
  );
}
