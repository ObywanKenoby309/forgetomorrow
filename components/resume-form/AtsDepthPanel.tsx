'use client';

// components/resume-form/AtsDepthPanel.tsx
// Unified Match panel — coach-first flow, AI scan as confidence check.
// FIX: Strongly type coachContext to match CoachSuggestionsPanel's CoachContext union.

import React, { useMemo, useState } from 'react';
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

type JobMeta =
  | {
      title?: string;
      company?: string;
      location?: string;
    }
  | null;

type Props = {
  jdText: string;
  summary: string;
  skills: string[];
  experiences: Experience[];
  education: Education[];
  jobMeta?: JobMeta;
  onAddSkill?: (keyword: string) => void;
  onAddSummary?: (snippet: string) => void;
  onAddBullet?: (snippet: string) => void;
};

// ✅ matches CoachSuggestionsPanel.js JSDoc union
type CoachContext = {
  section: 'overview' | 'summary' | 'skills' | 'experience' | 'education';
  keyword?: string | null;
};

type ActivePanel = 'coach' | 'scan' | 'keywords';

const ORANGE = '#FF7043';

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
  for (const t of tokens) counts.set(t, (counts.get(t) || 0) + 1);

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

function jdPreview(text: string, maxChars = 120) {
  const n = (text || '').replace(/\s+/g, ' ').trim();
  if (!n) return '';
  return n.length > maxChars ? `${n.slice(0, maxChars)}…` : n;
}

/**
 * Best-effort role/title guess from JD text (fallback when no jobMeta)
 */
function guessJobTitle(jdText: string) {
  const jd = (jdText || '').trim();
  if (!jd) return '';

  const m1 = jd.match(
    /(?:^|\n)\s*(?:job\s*title|title|position)\s*[:\-]\s*([^\n]{3,120})/i
  );
  if (m1 && m1[1]) return m1[1].trim();

  const firstLine =
    jd
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)[0] || '';
  if (firstLine && firstLine.length <= 90) {
    if (!/overview|about\s+us|introduction|who\s+we\s+are/i.test(firstLine))
      return firstLine;
  }
  return '';
}

export default function AtsDepthPanel({
  jdText,
  summary,
  skills,
  experiences,
  education,
  jobMeta = null,
  onAddSkill,
  onAddSummary,
  onAddBullet,
}: Props) {
  const [activePanel, setActivePanel] = useState<ActivePanel>('coach');

  // unified scoring
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiUpgrade, setAiUpgrade] = useState(false);

  // Coach overlay
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachContext, setCoachContext] = useState<CoachContext>({
    section: 'overview',
    keyword: null,
  });

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
    [titleKeywords, resumeText]
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
    statusText = 'Excellent — ready for final check.';
    barColor = '#2E7D32';
  } else if (primaryScore >= 70) {
    statusText = 'Good — ask the coach to tighten wording.';
    barColor = '#F59E0B';
  } else if (primaryScore >= 50) {
    statusText = 'Fair — improve summary, skills, and bullets.';
    barColor = '#EF6C00';
  } else {
    statusText = 'Low — start with coach-guided improvements.';
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

  // ✅ send resume data in the API shape the backend expects
  const resumeData = useMemo(
    () => ({
      summary,
      skills,
      workExperiences: experiences,
      educationList: education,
    }),
    [summary, skills, experiences, education]
  );

  const guessedTitle = useMemo(() => guessJobTitle(jdText), [jdText]);
  const words = useMemo(() => countWords(jdText), [jdText]);
  const preview = useMemo(() => jdPreview(jdText), [jdText]);

  const loadedTitle = (jobMeta?.title || '').trim() || guessedTitle || 'Job description';
  const loadedCompany = (jobMeta?.company || '').trim();
  const loadedLocation = (jobMeta?.location || '').trim();

  function openCoach(section: CoachContext['section'] = 'overview', keyword: string | null = null) {
    setCoachContext({ section, keyword });
    setCoachOpen(true);
  }

  function openCoachOverview() {
    setActivePanel('coach');
    openCoach('overview', null);
  }

  async function runAiScan() {
    if (!jdText?.trim()) return;

    setActivePanel('scan');
    setAiLoading(true);
    setAiError(null);
    setAiUpgrade(false);

    try {
      const resp = await fetch('/api/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: jdText, resume: resumeData }),
      });

      const data = await resp.json();

      if (data?.upgrade) {
        setAiUpgrade(true);
        setAiScore(null);

        const nextTips: string[] = Array.isArray(data?.tips)
          ? data.tips
          : typeof data?.tips === 'string' && data.tips.trim()
          ? [data.tips.trim()]
          : [];

        setAiTips(nextTips);
        return;
      }

      const s =
        typeof data?.score === 'number'
          ? Math.max(0, Math.min(100, Math.round(data.score)))
          : null;

      const nextTips: string[] = Array.isArray(data?.tips)
        ? data.tips
        : typeof data?.tips === 'string' && data.tips.trim()
        ? [data.tips.trim()]
        : [];

      setAiScore(s);
      setAiTips(nextTips);
    } catch (e) {
      console.error('[AtsDepthPanel] AI scan failed', e);
      setAiError('AI scan failed — try again.');
      setAiScore(null);
    } finally {
      setAiLoading(false);
    }
  }

  const normalizedTips: string[] = Array.isArray(aiTips)
    ? aiTips.filter((t) => typeof t === 'string' && t.trim().length > 0)
    : [];

  const tabButton = (key: ActivePanel, label: string) => ({
    type: 'button' as const,
    onClick: () => setActivePanel(key),
    style: {
      border: activePanel === key ? `1px solid ${ORANGE}` : '1px solid #E2E8F0',
      background: activePanel === key ? 'rgba(255,112,67,0.10)' : '#FFFFFF',
      color: activePanel === key ? '#C2410C' : '#475569',
      borderRadius: 999,
      padding: '7px 11px',
      fontSize: 12,
      fontWeight: 900,
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
    },
    children: label,
  });

  return (
    <div style={{ marginTop: 0 }}>
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid #ECEFF1',
          padding: 14,
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div>
          <div style={{ fontWeight: 900, fontSize: 16, color: '#263238' }}>
            Forge Hammer
          </div>
          <div style={{ marginTop: 3, fontSize: 12, color: '#607D8B', lineHeight: 1.45 }}>
            Start with the coach. Run the scan once your updates feel ready.
          </div>
        </div>

        {/* Loaded job */}
        <div
          style={{
            marginTop: 12,
            background: '#E3F2FD',
            border: '1px solid #BBDEFB',
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div style={{ fontWeight: 900, color: '#0D47A1', fontSize: 12 }}>
            Loaded job
          </div>

          <div style={{ marginTop: 4, color: '#0B2A4A', fontSize: 13, lineHeight: 1.35 }}>
            <strong>{loadedTitle}</strong>
            {loadedCompany ? ` at ${loadedCompany}` : ''}
            {loadedLocation ? ` · ${loadedLocation}` : ''}
            <span style={{ color: '#607D8B' }}> · {words} words</span>
          </div>

          {preview ? (
            <div style={{ marginTop: 6, fontSize: 12, color: '#1E3A5F', lineHeight: 1.45 }}>
              <span style={{ fontWeight: 800, color: '#1565C0' }}>Preview: </span>
              {preview}
            </div>
          ) : null}
        </div>

        {/* Score anchor */}
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 14,
            border: '1px solid #ECEFF1',
            background: '#FAFAFA',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 32, fontWeight: 950, color: barColor, letterSpacing: -0.5 }}>
              {Number.isFinite(primaryScore) ? primaryScore : 0}
              <span style={{ fontSize: 18, color: '#B0BEC5', marginLeft: 3 }}>/100</span>
            </span>
            <span style={{ fontSize: 12, color: '#546E7A', lineHeight: 1.35 }}>{statusText}</span>
          </div>

          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: '#ECEFF1',
              overflow: 'hidden',
              marginTop: 8,
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

          <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 7, lineHeight: 1.4 }}>
            Current signal: <strong>{keywordCoverage}% keyword coverage</strong>
            {aiScore === null ? ' · AI scan not run yet.' : ' · AI scan included.'}
          </div>
        </div>

        {/* Primary action */}
{activePanel === 'coach' && (
  <div style={{ marginTop: 12, padding: 14, borderRadius: 16, border: '1px solid #FFE0B2', background: '#FFF8E1' }}>
    <div style={{ fontSize: 15, fontWeight: 950, color: '#F97316', marginBottom: 5 }}>
      Ask the Coach
    </div>
    <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.45 }}>
      Work section-by-section before spending a scan. Get paste-ready suggestions for the exact job.
    </div>
    <button type="button" onClick={openCoachOverview} style={{ marginTop: 12, width: '100%', padding: '12px 16px', borderRadius: 999, border: 'none', background: ORANGE, color: 'white', fontWeight: 950, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,0.16)' }}>
      Ask the Coach
    </button>
  </div>
)}

{activePanel === 'scan' && (
  <div style={{ marginTop: 12, padding: 14, borderRadius: 16, border: '1px solid #CBD5E1', background: '#F8FAFC' }}>
    <div style={{ fontSize: 15, fontWeight: 950, color: '#263238', marginBottom: 5 }}>
      AI Scan
    </div>
    <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.45 }}>
      Run this after you use the coach and feel confident in your updates.
    </div>
    <button type="button" onClick={runAiScan} disabled={aiLoading} style={{ marginTop: 12, width: '100%', padding: '12px 16px', borderRadius: 999, border: 'none', background: '#263238', color: 'white', fontWeight: 950, fontSize: 14, cursor: aiLoading ? 'not-allowed' : 'pointer', opacity: aiLoading ? 0.75 : 1 }}>
      {aiLoading ? 'Thinking…' : aiScore === null ? 'Run AI Scan' : 'Run Scan Again'}
    </button>
  </div>
)}

{activePanel === 'keywords' && (
  <div style={{ marginTop: 12, padding: 14, borderRadius: 16, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
    <div style={{ fontSize: 15, fontWeight: 950, color: '#263238', marginBottom: 5 }}>
      Keyword Breakdown
    </div>
    <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.45 }}>
      Use this as a supporting checklist after the coach helps tighten your wording.
    </div>
  </div>
)}

        {/* Module selector */}
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 2,
          }}
        >
          <button {...tabButton('coach', 'Coach')} />
          <button {...tabButton('scan', 'AI Scan')} />
          <button {...tabButton('keywords', 'Keywords')} />
        </div>

        {/* Active module */}
        <div style={{ marginTop: 10 }}>
          {activePanel === 'coach' && (
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 13, color: '#263238' }}>
                Choose where to improve first
              </div>
              <div style={{ marginTop: 5, fontSize: 12, color: '#607D8B', lineHeight: 1.45 }}>
                These open the coach with focused guidance instead of dumping everything at once.
              </div>

              <div style={{ marginTop: 10, display: 'grid', gap: 7 }}>
                {[
                  { label: 'Summary', section: 'summary' as const },
                  { label: 'Skills', section: 'skills' as const },
                  { label: 'Experience bullets', section: 'experience' as const },
                  { label: 'Education', section: 'education' as const },
                ].map((item) => (
                  <button
                    key={item.section}
                    type="button"
                    onClick={() => openCoach(item.section, null)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '9px 10px',
                      borderRadius: 12,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      color: '#334155',
                      fontWeight: 900,
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ color: ORANGE }}>Open</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activePanel === 'scan' && (
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 13, color: '#263238' }}>
                AI Scan
              </div>
              <div style={{ marginTop: 5, fontSize: 12, color: '#607D8B', lineHeight: 1.45 }}>
                Run this after you use the coach and feel confident in your updates.
              </div>

              {aiError && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#C62828', fontWeight: 800 }}>
                  {aiError}
                </div>
              )}

              {(aiUpgrade || (aiScore !== null && !aiLoading) || normalizedTips.length > 0) && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 12,
                    border: '1px solid #FFE0B2',
                    background: '#FFF3E0',
                  }}
                >
                  {aiUpgrade ? (
                    <>
                      <div style={{ fontWeight: 900, color: '#E65100', marginBottom: 8, fontSize: 13 }}>
                        You&apos;ve used your free AI scans for this month.
                      </div>
                      <button
                        type="button"
                        onClick={() => (window.location.href = '/pricing')}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 999,
                          border: 'none',
                          background: ORANGE,
                          color: 'white',
                          fontWeight: 900,
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        Upgrade to Pro
                      </button>
                    </>
                  ) : (
                    <>
                      {aiScore !== null && (
                        <div style={{ fontWeight: 950, fontSize: 16, color: '#263238' }}>
                          AI Score: {aiScore}/100
                        </div>
                      )}

                      {normalizedTips.length > 0 && (
                        <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12, color: '#37474F', lineHeight: 1.45 }}>
                          {normalizedTips.map((tip, i) => (
                            <li key={i} style={{ marginBottom: 6 }}>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activePanel === 'keywords' && (
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 13, color: '#263238' }}>
                Keyword coverage
              </div>
              <div style={{ marginTop: 5, fontSize: 12, color: '#607D8B', lineHeight: 1.45 }}>
                Use this as a supporting checklist. The coach should handle wording.
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
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
                    <div style={{ fontWeight: 900, color: '#37474F', marginBottom: 2 }}>
                      {b.label}
                    </div>
                    <div style={{ color: '#607D8B' }}>
                      {b.total > 0 ? `${b.matched}/${b.total} matched` : '0/0 matched'}
                    </div>
                    <div style={{ marginTop: 2, fontWeight: 800, color: '#455A64' }}>
                      {b.points} pts
                    </div>
                  </div>
                ))}
              </div>

              <details style={{ marginTop: 12 }}>
                <summary
                  style={{
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 900,
                    color: '#37474F',
                    listStyle: 'none',
                  }}
                >
                  View missing role terms
                </summary>

                <div
                  style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 10,
                    border: '1px solid #ECEFF1',
                    background: '#FFFFFF',
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 4, color: '#263238', fontSize: 12 }}>
                    High-impact title / role terms
                  </div>

                  {titleKeywords.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12, color: '#388E3C' }}>
                      No missing keywords here — nice!
                    </p>
                  ) : missingTitleKeywords.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12, color: '#388E3C' }}>
                      No missing title/role keywords — strong alignment.
                    </p>
                  ) : (
                    <>
                      <p style={{ margin: 0, fontSize: 12, color: '#546E7A', lineHeight: 1.45 }}>
                        Consider weaving these into your summary, skills, or experience section.
                      </p>
                      <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: '#37474F' }}>
                        {missingTitleKeywords.map((kw) => (
                          <li key={kw} style={{ marginBottom: 4 }}>
                            <button
                              type="button"
                              onClick={() => openCoach('skills', kw)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#37474F',
                                cursor: 'pointer',
                                padding: 0,
                                fontSize: 12,
                                fontWeight: 700,
                                textDecoration: 'underline',
                                textDecorationColor: 'rgba(255,112,67,0.55)',
                              }}
                            >
                              {kw}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>

      {/* Coach overlay */}
      <CoachSuggestionsPanel
        open={coachOpen}
        onClose={() => setCoachOpen(false)}
        context={coachContext}
        jdText={jdText}
        resumeData={resumeData}
        missing={{
          high: missingTitleKeywords,
          tools: [],
          edu: [],
          soft: [],
        }}
        onAddSkill={onAddSkill}
        onAddSummary={onAddSummary}
        onAddBullet={onAddBullet}
      />
    </div>
  );
}
