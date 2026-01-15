// pages/recruiter/explain.js
import { useState } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";

import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import WHYScoreInfo from "@/components/ai/WHYScoreInfo";

// IMPORTANT:
// This MUST reuse the SAME explainability logic used in recruiter candidate view.
// Adjust the import path ONLY if the function lives elsewhere.
import { explainCandidateAlignment } from "@/lib/ai/explainCandidate";

export default function RecruiterExplainPage() {
  const { data: session, status } = useSession();

  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
      const analysis = await explainCandidateAlignment({
        resumeText,
        jobDescription,
      });

      setResult(analysis);
    } catch (err) {
      console.error("[RecruiterExplain] analysis error", err);
      setError("We were unable to run the analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <RecruiterLayout>
      <Head>
        <title>Resume & JD Explainability | ForgeTomorrow</title>
      </Head>

      <section style={{ maxWidth: 960, margin: "0 auto", padding: "24px" }}>
        <h1 style={{ marginBottom: 12 }}>
          Resume & Job Match Explainability
        </h1>

        <p style={{ marginBottom: 24 }}>
          Paste or upload a resume and a job description to receive transparent,
          explainable alignment insights and interview guidance.
        </p>

        {/* Resume Input */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Resume (paste text)
          </label>
          <textarea
            rows={8}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste resume text here…"
            style={{ width: "100%" }}
          />
        </div>

        {/* Job Description Input */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Job Description
          </label>
          <textarea
            rows={8}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job description here…"
            style={{ width: "100%" }}
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            padding: "10px 16px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Analyzing…" : "Run WHY Explainability"}
        </button>

        {error && (
          <p style={{ color: "red", marginTop: 16 }}>{error}</p>
        )}

        {/* Results */}
        {result && (
          <div style={{ marginTop: 32 }}>
            {/* Alignment Summary Header */}
            <h2
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Alignment Summary
              <WHYScoreInfo />
            </h2>

            <p style={{ marginTop: 8 }}>{result.summary}</p>

            {/* Strengths */}
            <h3 style={{ marginTop: 24 }}>Strengths</h3>
            <ul>
              {result.strengths?.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>

            {/* Gaps */}
            <h3 style={{ marginTop: 24 }}>Gaps</h3>
            <ul>
              {result.gaps?.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>

            {/* Interview Questions */}
            <h3 style={{ marginTop: 24 }}>Interview Questions</h3>

            <h4 style={{ marginTop: 12 }}>
              Behavioral / Personality
            </h4>
            <ul>
              {result.interviewQuestions?.behavioral?.map(
                (q, idx) => (
                  <li key={idx}>{q}</li>
                )
              )}
            </ul>

            <h4 style={{ marginTop: 12 }}>
              Occupational / Role-Specific
            </h4>
            <ul>
              {result.interviewQuestions?.occupational?.map(
                (q, idx) => (
                  <li key={idx}>{q}</li>
                )
              )}
            </ul>
          </div>
        )}
      </section>
    </RecruiterLayout>
  );
}
