// components/recruiter/candidate-center/ExternalCompareModule.js
import { useState, useEffect } from "react";

const ORANGE = "#FF7043";
const DARK = "#0D1B2A";

const MODULE_SURFACE = {
  border: "1px solid rgba(255,255,255,0.30)",
  background: "rgba(255,255,255,0.86)",
  borderRadius: 18,
  boxShadow: "0 8px 22px rgba(15,23,42,0.10)",
  boxSizing: "border-box",
};

const CARD = {
  border: "1px solid rgba(15,23,42,0.10)",
  background: "rgba(255,255,255,0.92)",
  borderRadius: 14,
  boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
  boxSizing: "border-box",
};

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}

function ScoreRing({ score, size = 72 }) {
  const color =
    score >= 75 ? "#16A34A" : score >= 50 ? ORANGE : "#DC2626";
  const label =
    score >= 75 ? "Strong" : score >= 50 ? "Moderate" : "Emerging";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        border: `3px solid ${color}`,
        background: `${color}12`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: size * 0.30, fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.13, fontWeight: 700, color }}>%</span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{label} Match</span>
    </div>
  );
}

function SignalChip({ text, type }) {
  const colors = {
    strength: { bg: "rgba(22,163,74,0.08)", border: "rgba(22,163,74,0.22)", text: "#15803D" },
    gap: { bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.18)", text: "#DC2626" },
    transfer: { bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.20)", text: "#D97706" },
  };
  const c = colors[type] || colors.strength;
  return (
    <div style={{
      padding: "4px 10px", borderRadius: 999,
      background: c.bg, border: `1px solid ${c.border}`,
      fontSize: 11, fontWeight: 600, color: c.text,
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      {type === "strength" ? "✓" : type === "gap" ? "✗" : "→"} {text}
    </div>
  );
}

function ResultPanel({ data, resumeText, explainRunId, onReset, onBuildProfile }) {
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildResult, setBuildResult] = useState(null);
  const [buildError, setBuildError] = useState(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [savingToVault, setSavingToVault] = useState(false);

  const score = data?.score ?? null;
  const summary = data?.summary || data?.match?.summary || "";
  const strengths = Array.isArray(data?.strengths) ? data.strengths : [];
  const gaps = Array.isArray(data?.gaps) ? data.gaps : [];
  const transferable = Array.isArray(data?.skills?.transferable)
    ? data.skills.transferable
    : [];
  const reasons = Array.isArray(data?.reasons) ? data.reasons : [];
  const signals = data?.signals || null;
  const interview = data?.interviewQuestions || null;
  const scoreColor =
    score >= 75 ? "#16A34A" : score >= 50 ? ORANGE : "#DC2626";

async function handleSaveToVault() {
  if (!explainRunId) {
    alert("Analysis ID not found.");
    return;
  }

  try {
    setSavingToVault(true);

    const res = await fetch(
      `/api/recruiter/explain/${encodeURIComponent(explainRunId)}/save`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(json?.error || "Could not save analysis");
    }

    alert("Resume vs Role Analysis saved to ForgeVault.");
  } catch (err) {
    alert(err?.message || "Could not save analysis.");
  } finally {
    setSavingToVault(false);
  }
}

  async function handleBuildProfile() {
    setBuildLoading(true);
    setBuildError(null);
    try {
      const res = await fetch("/api/recruiter/external-candidates/build-from-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, whyResult: data }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to build profile");
      setBuildResult(json);
    } catch (err) {
      setBuildError(err?.message || "Could not build external candidate profile.");
    } finally {
      setBuildLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Score header */}
      <div style={{
        ...CARD, padding: "20px 24px",
        background: `linear-gradient(135deg, ${DARK} 0%, #1E3A5F 100%)`,
        display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
      }}>
        {score !== null && <ScoreRing score={score} size={80} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.50)", letterSpacing: 1.5, marginBottom: 6 }}>
            FORGETOMORROW ALIGNMENT REVIEW
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "white", lineHeight: 1.5 }}>
            {summary || "Analysis complete."}
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
            {signals?.matched?.length > 0 && (
              <div style={{ fontSize: 11, color: "#16A34A", fontWeight: 700 }}>
                ✓ {signals.matched.length} signals matched
              </div>
            )}
            {signals?.not_yet_demonstrated?.length > 0 && (
              <div style={{ fontSize: 11, color: "#DC2626", fontWeight: 700 }}>
                ✗ {signals.not_yet_demonstrated.length} gaps identified
              </div>
            )}
            {transferable.length > 0 && (
              <div style={{ fontSize: 11, color: ORANGE, fontWeight: 700 }}>
                → {transferable.length} transferable signals
              </div>
            )}
          </div>

        </div>

        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleSaveToVault}
            disabled={savingToVault}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.20)",
              background: "rgba(255,112,67,0.22)",
              color: "white",
              fontSize: 12,
              fontWeight: 700,
              cursor: savingToVault ? "default" : "pointer",
            }}
          >
            {savingToVault ? "Saving..." : "Save to ForgeVault"}
          </button>

          <button
            type="button"
            onClick={onReset}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.20)",
              background: "rgba(255,255,255,0.10)",
              color: "rgba(255,255,255,0.70)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            New Analysis
          </button>
        </div>
      </div>

      {/* Strengths + Gaps */}
      {(strengths.length > 0 || gaps.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {strengths.length > 0 && (
            <div style={{ ...CARD, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#15803D", letterSpacing: 1, marginBottom: 10 }}>
                STRENGTHS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {strengths.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "#16A34A", fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {gaps.length > 0 && (
            <div style={{ ...CARD, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#DC2626", letterSpacing: 1, marginBottom: 10 }}>
                GAPS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {gaps.map((g, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "#DC2626", fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✗</span>
                    <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{g}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transferable signals */}
      {transferable.length > 0 && (
        <div style={{ ...CARD, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#D97706", letterSpacing: 1, marginBottom: 10 }}>
            TRANSFERABLE SIGNALS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {transferable.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: "#D97706", fontWeight: 900, flexShrink: 0, marginTop: 1 }}>→</span>
                <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signal breakdown */}
      {reasons.length > 0 && (
        <div style={{ ...CARD, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: DARK, letterSpacing: 1, marginBottom: 10 }}>
            SIGNAL BREAKDOWN
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reasons.slice(0, 6).map((r, i) => {
              const isMatched = signals?.matched?.some(s => s.label === r.requirement);
              const borderColor = isMatched ? "#16A34A" : "#DC2626";
              return (
                <div key={i} style={{
                  background: "#F9FAFB", borderRadius: 8,
                  padding: "10px 12px",
                  borderLeft: `3px solid ${borderColor}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 4 }}>
                    {r.requirement}
                  </div>
                  {Array.isArray(r.evidence) && r.evidence.slice(0, 2).map((ev, j) => (
                    <div key={j} style={{ fontSize: 10, color: "#6B7280", lineHeight: 1.4 }}>
                      • {ev?.text || ev}{ev?.source ? ` · ${ev.source}` : ""}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interview questions */}
      {interview && (
        <div style={{ ...CARD, padding: "14px 16px" }}>
          <button
            onClick={() => setShowQuestions(v => !v)}
            style={{
              width: "100%", background: "none", border: "none",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer", padding: 0,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: DARK, letterSpacing: 1 }}>
              SUGGESTED INTERVIEW QUESTIONS
            </div>
            <span style={{ fontSize: 14, color: "#6B7280" }}>{showQuestions ? "−" : "+"}</span>
          </button>
          {showQuestions && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {Array.isArray(interview.behavioral) && interview.behavioral.slice(0, 3).map((q, i) => (
                <div key={`b${i}`}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#9CA3AF", marginBottom: 3 }}>BEHAVIORAL</div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{q}</div>
                </div>
              ))}
              {Array.isArray(interview.occupational) && interview.occupational.slice(0, 3).map((q, i) => (
                <div key={`o${i}`}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#9CA3AF", marginBottom: 3 }}>ROLE-SPECIFIC</div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{q}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Build external candidate CTA */}
      {!buildResult && (
        <div style={{
          ...CARD, padding: "16px 20px",
          border: `1px solid rgba(255,112,67,0.22)`,
          background: "rgba(255,112,67,0.04)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: DARK, marginBottom: 4 }}>
            Build External Candidate Profile
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5, marginBottom: 12 }}>
            Create a candidate card from this resume for your talent pools or pipeline.
            ForgeTomorrow will extract key details automatically.
          </div>
          {buildError && (
            <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 10 }}>{buildError}</div>
          )}
          <button
            onClick={handleBuildProfile}
            disabled={buildLoading}
            style={{
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: buildLoading ? "#94A3B8" : ORANGE,
              color: "white", fontSize: 13, fontWeight: 800,
              cursor: buildLoading ? "default" : "pointer",
              boxShadow: buildLoading ? "none" : "0 4px 14px rgba(255,112,67,0.28)",
            }}
          >
            {buildLoading ? "Building profile…" : "⚡ Build External Candidate"}
          </button>
        </div>
      )}

      {/* Build success */}
      {buildResult && (
        <div style={{
          ...CARD, padding: "16px 20px",
          border: "1px solid rgba(22,163,74,0.22)",
          background: "rgba(22,163,74,0.04)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#15803D", marginBottom: 4 }}>
            ✓ External Candidate Profile Created
          </div>
          <div style={{ fontSize: 12, color: "#374151", marginBottom: 10 }}>
            <strong>{buildResult.candidate?.name || "Candidate"}</strong> has been added to your external candidate database.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            
              <button
              type="button"
              onClick={() => window.location.href = "/recruiter/candidate-center?module=pools"}
              style={{
                padding: "8px 14px", borderRadius: 8, border: "none",
                background: "#15803D", color: "white",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              Add to Talent Pool
            </button>
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center", paddingTop: 4 }}>
        ForgeTomorrow explainability is AI-assisted guidance for recruiter judgment. Not a hiring decision.
      </div>
    </div>
  );
}

export default function ExternalCompareModule() {
  const isMobile = useIsMobile(768);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [explainRunId, setExplainRunId] = useState(null);

  // ── Striker context injection ────────────────────────────────────────────────
  // Writes window.__FT_CONTEXT__ when an external compare result is available.
  // Striker sees the analysis output: score, summary, strengths, gaps, reasons.
  // When result is cleared (reset), context is cleared back to the surface only.
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (!result) {
        // No result yet — just surface awareness, no candidate or WHY data
        window.__FT_CONTEXT__ = {
          surface: "external_candidate_compare",
          activeCandidate: null,
          activeWhy: null,
          activeJob: jobDescription.trim()
            ? { title: null, company: null, description: jobDescription.slice(0, 400) }
            : null,
          activeSearch: null,
          activeTargetingFilters: null,
        };
        return;
      }

      // Result is available — give Striker the full analysis
      window.__FT_CONTEXT__ = {
        surface: "external_candidate_compare",

        activeCandidate: {
          id:    null, // external candidate — no platform ID yet
          name:  result?.candidate?.name  || result?.name  || null,
          title: result?.candidate?.title || result?.title || null,
          location:   null,
          workStatus: null,
          match:      typeof result?.score === "number" ? result.score : null,
          skills:     Array.isArray(result?.skills?.matched)
                        ? result.skills.matched.slice(0, 16)
                        : [],
          summary: result?.summary || result?.match?.summary || null,
          isExternal: true, // flag so Striker knows this is not an internal candidate
        },

        activeWhy: {
          score:              typeof result?.score === "number" ? result.score : null,
          summary:            result?.summary || result?.match?.summary || null,
          strongestAlignment: Array.isArray(result?.strengths) ? result.strengths[0] || null : null,
          biggestGap:         Array.isArray(result?.gaps)      ? result.gaps[0]      || null : null,
          reasons:            Array.isArray(result?.reasons)   ? result.reasons.slice(0, 6)  : [],
          skillsMatched:      Array.isArray(result?.skills?.matched)            ? result.skills.matched.slice(0, 10)            : [],
          skillsGaps:         Array.isArray(result?.gaps)                       ? result.gaps.slice(0, 10)                      : [],
          skillsTransferable: Array.isArray(result?.skills?.transferable)       ? result.skills.transferable.slice(0, 6)        : [],
          signalsMatched:     Array.isArray(result?.signals?.matched)           ? result.signals.matched.slice(0, 8)            : [],
          signalsNotDemonstrated: Array.isArray(result?.signals?.not_yet_demonstrated)
                                    ? result.signals.not_yet_demonstrated.slice(0, 8)
                                    : [],
          interviewQuestions: Array.isArray(result?.interviewQuestions)         ? result.interviewQuestions.slice(0, 5)         : [],
        },

        activeJob: jobDescription.trim()
          ? { title: null, company: null, description: jobDescription.slice(0, 400) }
          : null,

        activeSearch: null,
        activeTargetingFilters: null,
      };
    } catch {
      // Never crash the recruiter UI — Striker context is best-effort
    }
  }, [result, jobDescription]);

  async function handleAnalyze() {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError("Please provide both a resume and a job description.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recruiter/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Analysis failed");
      setResult(data);
	  setExplainRunId(data?.explainRunId || null);
    } catch (err) {
      console.error("[ExternalCompare]", err);
      setError(err?.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
	setExplainRunId(null);
    setResult(null);
    setError(null);
  }

  if (result) {
    return (
      <div style={{ ...MODULE_SURFACE, padding: isMobile ? 12 : 16, overflowY: "auto", maxHeight: isMobile ? "none" : "calc(100vh - 280px)", width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
        <ResultPanel
          data={result}
          resumeText={resumeText}
		  explainRunId={explainRunId}
          onReset={handleReset}
        />
      </div>
    );
  }

  return (
    <div style={{ ...MODULE_SURFACE, padding: isMobile ? 12 : 16, width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
      {/* Header — desktop only. Mobile already has the selected tool card above this module. */}
      {!isMobile && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: DARK, marginBottom: 4 }}>
            External Candidate Compare
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
            Paste a resume and job description. ForgeTomorrow will score alignment,
            identify strengths and gaps, and generate recruiter-grade explainability.
          </div>
        </div>
      )}

      {/* Input grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 14 }}>
        {/* JD */}
        <div style={{ ...CARD, padding: 14 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: DARK,
            letterSpacing: 1, marginBottom: 8,
          }}>
            JOB DESCRIPTION
          </div>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            style={{
              width: "100%", minHeight: 260,
              border: "1px solid rgba(0,0,0,0.10)",
              borderRadius: 10, padding: "10px 12px",
              fontSize: 12, color: DARK, lineHeight: 1.6,
              resize: "vertical", outline: "none",
              background: "rgba(255,255,255,0.90)",
              fontFamily: "inherit", boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = ORANGE}
            onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.10)"}
          />
          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 6 }}>
            {jobDescription.length > 0 ? `${jobDescription.length} characters` : "Include responsibilities, requirements, and any nice-to-haves"}
          </div>
        </div>

        {/* Resume */}
        <div style={{ ...CARD, padding: 14 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: DARK,
            letterSpacing: 1, marginBottom: 8,
          }}>
            RESUME
          </div>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste the candidate's resume here..."
            style={{
              width: "100%", minHeight: 260,
              border: "1px solid rgba(0,0,0,0.10)",
              borderRadius: 10, padding: "10px 12px",
              fontSize: 12, color: DARK, lineHeight: 1.6,
              resize: "vertical", outline: "none",
              background: "rgba(255,255,255,0.90)",
              fontFamily: "inherit", boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = ORANGE}
            onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.10)"}
          />
          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 6 }}>
            {resumeText.length > 0 ? `${resumeText.length} characters` : "Plain text works best — copy directly from a resume document"}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "10px 14px", borderRadius: 10, marginBottom: 12,
          background: "rgba(220,38,38,0.06)",
          border: "1px solid rgba(220,38,38,0.18)",
          fontSize: 12, color: "#DC2626", fontWeight: 600,
        }}>
          {error}
        </div>
      )}

      {/* Analyze button */}
      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          width: "100%", padding: "13px 20px",
          borderRadius: 12, border: "none",
          background: loading ? "#94A3B8" : ORANGE,
          color: "white", fontSize: 14, fontWeight: 900,
          cursor: loading ? "default" : "pointer",
          boxShadow: loading ? "none" : "0 6px 20px rgba(255,112,67,0.30)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "all 150ms ease",
        }}
      >
        {loading ? (
          <>
            <span style={{
              display: "inline-block", width: 16, height: 16,
              borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)",
              borderTopColor: "white", animation: "spin 0.7s linear infinite",
            }} />
            Analyzing alignment…
          </>
        ) : (
          <>⚡ Run Alignment Analysis</>
        )}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center", marginTop: 10 }}>
        Analysis uses ForgeTomorrow's WHY engine — the same intelligence that powers recruiter packets and candidate scoring.
      </div>
    </div>
  );
}