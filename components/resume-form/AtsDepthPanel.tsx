'use client';

// components/resume-form/AtsDepthPanel.tsx
// Unified Match panel – AI score first, keyword coverage as fallback.

import React, { useMemo, useRef, useState } from 'react';
import AIATSScorerClient from './AIATSScorerClient';
import CoachSuggestionsPanel from './CoachSuggestionsPanel';

type Experience = {
  title?: string;
  company?: string;
  bullets?: string[];
};

type Education = {
  school?: string;
  degree?: string;
  field?: string;
  notes?: string;
};

type Props = {
  jdText: string;
  summary: string;
  skills: string[];
  experiences: Experience[];
  education: Education[];
  onAddSkill?: (keyword: string) => void;
  onAddSummary?: (snippet: string) => void;
  onAddBullet?: (snippet: string) => void;
};

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'your',
  'you',
  'our',
  'are',
  'was',
  'were',
  'will',
  'shall',
  'would',
  'could',
  'should',
  'into',
  'about',
  'over',
  'under',
  'in',
  'on',
  'of',
  'to',
  'a',
  'an',
  'as',
  'by',
  'or',
  'at',
  'be',
  'is',
  'it',
  'we',
  'they',
  'them',
  'their',
  'there',
]);

function extractKeyTerms(text: string, max = 8): string[] {
  if (!text) return [];
  const cleaned = text.toLowerCase().replace(/[^a-z0-9+\s]/g, ' ');
  const tokens = cleaned
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  const counts = new Map<string, number>();

  for (const t of tokens) {
    counts.set(t, (counts.get(t) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

function countWords(text: string) {
  const t = (text || '').trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function jdPreview(text: string, maxChars = 170) {
  const n = (text || '').replace(/\s+/g, ' ').trim();
  if (!n) return '';
  return n.length > maxChars ? `${n.slice(0, maxChars)}…` : n;
}

/**
 * Best-effort role/title guess from JD text.
 * We DO NOT rely on this being present, but it restores the “job title” feel you had.
 */
function guessJobTitle(jdText: string) {
  const jd = (jdText || '').trim();
  if (!jd) return '';

  // Look for explicit markers
  const m1 = jd.match(/(?:^|\n)\s*(?:job\s*title|title|position)\s*[:\-]\s*([^\n]{3,120})/i);
  if (m1 && m1[1]) return m1[1].trim();

  // Many JDs start with the title on the first line
  const firstLine = jd.split('\n').map((s) => s.trim()).filter(Boolean)[0] || '';
  if (firstLine && firstLine.length <= 90) {
    // Avoid “Company overview” type first lines
    if (!/overview|about\s+us|introduction|who\s+we\s+are/i.test(firstLine)) return firstLine;
  }

  return '';
}

export default function AtsDepthPanel({
  jdText,
  summary,
  skills,
  experiences,
  education,
  onAddSkill,
  onAddSummary,
  onAddBullet,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [aiScore, setAiScore] = useState<number | null>(null);

  // Coach overlay
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachContext, setCoachContext] = useState<{ section: string; keyword?: string | null }>({
    section: 'overview',
    keyword: null,
  });

  const aiScorerRef = useRef<HTMLDivElement | null>(null);

  if (!jdText?.trim()) return null;

  // ── Build a lightweight "resume text" blob for keyword matching
  const resumeText = useMemo(() => {
    const expBits = (experiences || [])
      .map((e) => `${e.title || ''} ${e.company || ''} ${(e.bullets || []).join(' ')}`)
      .join(' ');

    const eduBits = (education || [])
      .map((e) => `${e.degree || ''} ${e.field || ''} ${e.school || ''} ${e.notes || ''}`)
      .join(' ');

    return `${summary || ''} ${(skills || []).join(' ')} ${expBits} ${eduBits}`.toLowerCase();
  }, [summary, skills, experiences, education]);

  // ── Title/role keyword coverage (fallback engine)
  const titleKeywords = useMemo(() => extractKeyTerms(jdText, 8), [jdText]);

  const matchedTitleKeywords = useMemo(
    () => titleKeywords.filter((k) => resumeText.includes(k.toLowerCase())),
    [titleKeywords, resumeText],
  );

  const keywordCoverage =
    titleKeywords.length > 0
      ? Math.round((matchedTitleKeywords.length / titleKeywords.length) * 100)
      : 0;

  const primaryScore = aiScore !== null ? aiScore : keywordCoverage;

  // ── Status text + color based on unified score
  let statusText = '';
  let barColor = '#C62828';

  if (primaryScore >= 85) {
    statusText = 'Excellent — ready to apply.';
    barColor = '#2E7D32';
  } else if (primaryScore >= 70) {
    statusText = 'Good — tighten keywords & metrics to push higher.';
    barColor = '#F59E0B';
  } else if (primaryScore >= 50) {
    statusText = 'Fair — add more high-impact terms before applying.';
    barColor = '#EF6C00';
  } else {
    statusText = 'Low — add more high-impact terms (aim ≥85).';
    barColor = '#C62828';
  }

  const buckets = [
    {
      key: 'title',
      label: 'Title/Role',
      matched: matchedTitleKeywords.length,
      total: titleKeywords.length,
      points: keywordCoverage,
    },
    { key: 'hard', label: 'Hard skills', matched: 0, total: 0, points: 0 },
    { key: 'tools', label: 'Tools', matched: 0, total: 0, points: 0 },
    { key: 'edu', label: 'Education', matched: 0, total: 0, points: 0 },
    { key: 'soft', label: 'Soft skills', matched: 0, total: 0, points: 0 },
  ];

  const missingTitleKeywords = titleKeywords.filter((k) => !matchedTitleKeywords.includes(k));

  // Data passed down to AI component + coach
  const resumeData = useMemo(
    () => ({
      summary,
      skills,
      experiences,
      education,
    }),
    [summary, skills, experiences, education],
  );

  const guessedTitle = useMemo(() => guessJobTitle(jdText), [jdText]);
  const words = useMemo(() => countWords(jdText), [jdText]);
  const preview = useMemo(() => jdPreview(jdText), [jdText]);

  function openCoachOverview() {
    setCoachContext({ section: 'overview', keyword: null });
    setCoachOpen(true);
  }

  function scrollToAiScorer() {
    if (!expanded) setExpanded(true);
    setTimeout(() => {
      const el = aiScorerRef.current;
      if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid #ECEFF1',
          padding: 20,
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#263238' }}>
              Resume Match (Unified)
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#607D8B' }}>
              One score that blends AI analysis with keyword coverage for this job.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 13,
              color: '#607D8B',
              cursor: 'pointer',
            }}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {/* JD acknowledgement (restores the “what JD is loaded?” UX) */}
        <div
          style={{
            marginTop: 14,
            background: '#E3F2FD',
            border: '1px solid #BBDEFB',
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div style={{ fontWeight: 800, color: '#0D47A1', fontSize: 13 }}>
            Loaded job
          </div>
          <div style={{ marginTop: 4, color: '#0B2A4A', fontSize: 13, lineHeight: 1.35 }}>
            <strong>{guessedTitle || 'Job description'}</strong>
            <span style={{ color: '#607D8B' }}> · {words} words</span>
          </div>
          {preview ? (
            <div style={{ marginTop: 6, fontSize: 12, color: '#1E3A5F' }}>
              <span style={{ fontWeight: 700, color: '#1565C0' }}>Preview: </span>
              {preview}
            </div>
          ) : null}
        </div>

        {/* Main score row – always visible */}
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: barColor }}>
              {Number.isFinite(primaryScore) ? primaryScore : 0}
              <span style={{ fontSize: 20, color: '#B0BEC5', marginLeft: 3 }}>/100</span>
            </span>
            <span style={{ fontSize: 13, color: '#546E7A' }}>{statusText}</span>
          </div>

          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: '#ECEFF1',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(100, primaryScore))}%`,
                height: '100%',
                background: barColor,
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 4 }}>
            Keyword coverage (title/role terms): <strong>{keywordCoverage}%</strong>
            {aiScore === null && ' — run an AI scan to unlock full scoring.'}
          </div>
        </div>

        {/* The two action cards (restores the UX from your screenshot) */}
        <div
          style={{
            marginTop: 16,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          <div
            style={{
              background: '#FFF8E1',
              borderRadius: 16,
              border: '1px solid #FFE0B2',
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 170,
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#F97316', marginBottom: 6 }}>
                Match Score
              </div>
              <div style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.4 }}>
                Run an AI scan to generate a stronger, job-aware score and guidance.
              </div>
              <div
                style={{
                  marginTop: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 12,
                  color: '#607D8B',
                }}
              >
                <span
                  style={{
                    width: 44,
                    height: 4,
                    borderRadius: 999,
                    background: '#CFD8DC',
                    display: 'inline-block',
                  }}
                />
                <span>Uses AI + keyword coverage.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={scrollToAiScorer}
              style={{
                marginTop: 14,
                width: '100%',
                padding: '12px 16px',
                borderRadius: 999,
                border: 'none',
                background: '#FF7043',
                color: 'white',
                fontWeight: 900,
                fontSize: 15,
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
              }}
            >
              Run AI Scan
            </button>
          </div>

          <div
            style={{
              background: '#FFF8E1',
              borderRadius: 16,
              border: '1px solid #FFE0B2',
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 170,
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#F97316', marginBottom: 6 }}>
                Resume Coach
              </div>
              <div style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.4 }}>
                Get paste-ready wording suggestions to align your summary, skills, and bullets to this job.
              </div>
            </div>

            <button
              type="button"
              onClick={openCoachOverview}
              style={{
                marginTop: 14,
                width: '100%',
                padding: '12px 16px',
                borderRadius: 999,
                border: 'none',
                background: '#FF7043',
                color: 'white',
                fontWeight: 900,
                fontSize: 15,
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
              }}
            >
              Ask the Coach
            </button>
          </div>
        </div>

        {!expanded ? null : (
          <>
            {/* AI scoring card */}
            <div ref={aiScorerRef} style={{ marginTop: 18 }}>
              <AIATSScorerClient jdText={jdText} resumeData={resumeData} onScoreChange={setAiScore} />
            </div>

            {/* Bucket mini-cards */}
            <div
              style={{
                marginTop: 20,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 8,
              }}
            >
              {buckets.map((b) => (
                <div
                  key={b.key}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: '1px solid #ECEFF1',
                    background: '#FAFAFA',
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#37474F', marginBottom: 2 }}>
                    {b.label}
                  </div>
                  <div style={{ color: '#607D8B' }}>
                    {b.total > 0 ? (
                      <>
                        {b.matched}/{b.total} matched
                      </>
                    ) : (
                      '0/0 matched'
                    )}
                  </div>
                  <div style={{ marginTop: 2, fontWeight: 600, color: '#455A64' }}>
                    {b.points} pts
                  </div>
                </div>
              ))}
            </div>

            {/* Keyword breakdown */}
            <div style={{ marginTop: 18, borderTop: '1px solid #ECEFF1', paddingTop: 14 }}>
              <details>
                <summary
                  style={{
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#37474F',
                    listStyle: 'none',
                  }}
                >
                  View keyword breakdown
                </summary>

                <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                  {/* Title / Role details */}
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: '1px solid #ECEFF1',
                      background: '#FFFFFF',
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 4, color: '#263238' }}>
                      High-impact title / role terms
                    </div>
                    {titleKeywords.length === 0 ? (
                      <p style={{ margin: 0, fontSize: 13, color: '#388E3C' }}>
                        No missing keywords here — nice!
                      </p>
                    ) : missingTitleKeywords.length === 0 ? (
                      <p style={{ margin: 0, fontSize: 13, color: '#388E3C' }}>
                        No missing title/role keywords — strong alignment.
                      </p>
                    ) : (
                      <>
                        <p style={{ margin: 0, fontSize: 13, color: '#546E7A' }}>
                          Consider weaving in these terms somewhere in your summary, skills, or experience section:
                        </p>
                        <ul
                          style={{
                            margin: '8px 0 0',
                            paddingLeft: 18,
                            fontSize: 13,
                            color: '#37474F',
                          }}
                        >
                          {missingTitleKeywords.map((kw) => (
                            <li key={kw}>{kw}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  {/* Placeholder “all good” buckets for MVP */}
                  {['High-impact hard skills', 'Tools / Platforms', 'Education', 'Soft skills'].map((label) => (
                    <div
                      key={label}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        border: '1px solid #ECEFF1',
                        background: '#FFFFFF',
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 4, color: '#263238' }}>
                        {label}
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#388E3C' }}>
                        No missing keywords here — nice!
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </>
        )}
      </div>

      {/* Coach overlay (this is what makes the button work) */}
      <CoachSuggestionsPanel
        open={coachOpen}
        onClose={() => setCoachOpen(false)}
        context={coachContext}
        jdText={jdText}
        resumeData={resumeData}
        missing={{
          high: [],
          tools: [],
          edu: [],
          soft: missingTitleKeywords,
        }}
        onAddSkill={onAddSkill}
        onAddSummary={onAddSummary}
        onAddBullet={onAddBullet}
      />
    </div>
  );
}
