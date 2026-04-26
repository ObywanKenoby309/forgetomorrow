'use client';

// components/resume-form/AtsDepthPanel.tsx
// Unified Match panel – AI score first, keyword coverage as fallback.
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
  jobMeta?: JobMeta; // ✅ optional meta passed from resume/create.js
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

function jdPreview(text: string, maxChars = 170) {
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
  openCoach('overview', null);
}

  async function runAiScan() {
    if (!jdText?.trim()) return;

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
      padding: '6px 10px',
      fontSize: 11,
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
          background: 'rgba(255,255,255,0.96)',
          borderRadius: 14,
          border: '1px solid rgba(226,232,240,0.95)',
          padding: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Compact header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 950, fontSize: 15, color: '#263238', lineHeight: 1.1 }}>
              Forge Hammer
            </div>
            <div style={{ marginTop: 3, fontSize: 11, color: '#607D8B', lineHeight: 1.35 }}>
              Coach first. Scan when ready.
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 950, color: barColor, letterSpacing: -0.5, lineHeight: 1 }}>
              {Number.isFinite(primaryScore) ? primaryScore : 0}
              <span style={{ fontSize: 13, color: '#B0BEC5', marginLeft: 2 }}>/100</span>
            </div>
            <div style={{ marginTop: 3, fontSize: 10, color: '#78909C', fontWeight: 800 }}>
              {aiScore === null ? 'Keyword signal' : 'AI scan included'}
            </div>
          </div>
        </div>

        {/* Score bar */}
        <div
          style={{
            height: 7,
            borderRadius: 999,
            background: '#ECEFF1',
            overflow: 'hidden',
            marginTop: 9,
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

        <div style={{ marginTop: 6, fontSize: 11, color: '#546E7A', lineHeight: 1.3 }}>
          {statusText}
        </div>

        {/* Loaded job - compact */}
        <details style={{ marginTop: 9 }}>
          <summary
            style={{
              cursor: 'pointer',
              listStyle: 'none',
              borderRadius: 12,
              border: '1px solid #BBDEFB',
              background: '#E3F2FD',
              padding: '9px 10px',
              color: '#0B2A4A',
              fontSize: 12,
              lineHeight: 1.35,
            }}
          >
            <div style={{ fontWeight: 950, color: '#0D47A1', fontSize: 12 }}>Loaded job</div>
            <div style={{ marginTop: 2 }}>
              <strong>{loadedTitle}</strong>
              {loadedCompany ? ` at ${loadedCompany}` : ''}
              {loadedLocation ? ` · ${loadedLocation}` : ''}
              <span style={{ color: '#607D8B' }}> · {words} words</span>
            </div>
          </summary>

          {preview ? (
            <div
              style={{
                marginTop: 6,
                borderRadius: 10,
                border: '1px solid #D7ECFF',
                background: '#F7FBFF',
                padding: 10,
                fontSize: 11,
                color: '#1E3A5F',
                lineHeight: 1.4,
              }}
            >
              <span style={{ fontWeight: 900, color: '#1565C0' }}>Preview: </span>
              {preview}
            </div>
          ) : null}
        </details>

        {/* Module selector */}
        <div
          style={{
            marginTop: 10,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 6,
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
                padding: 11,
                borderRadius: 14,
                border: '1px solid #FFE0B2',
                background: '#FFF8E1',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 950, color: '#F97316', marginBottom: 4 }}>
                Ask the Coach
              </div>
              <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.4 }}>
                Work one section at a time. Get paste-ready suggestions for this job.
              </div>

              <button
                type="button"
                onClick={openCoachOverview}
                style={{
                  marginTop: 10,
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 999,
                  border: 'none',
                  background: ORANGE,
                  color: 'white',
                  fontWeight: 950,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: '0 6px 14px rgba(0,0,0,0.14)',
                }}
              >
                Ask the Coach
              </button>

              <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
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
                      padding: '8px 9px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,112,67,0.18)',
                      background: 'rgba(255,255,255,0.82)',
                      color: '#334155',
                      fontWeight: 900,
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ color: ORANGE, fontSize: 11 }}>Open</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activePanel === 'scan' && (
            <div
              style={{
                padding: 11,
                borderRadius: 14,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 950, color: '#263238', marginBottom: 4 }}>
                AI Scan
              </div>
              <div style={{ fontSize: 12, color: '#607D8B', lineHeight: 1.4 }}>
                Use this after coaching edits to confirm the resume is ready.
              </div>

              <button
                type="button"
                onClick={runAiScan}
                disabled={aiLoading}
                style={{
                  marginTop: 10,
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 999,
                  border: 'none',
                  background: '#263238',
                  color: 'white',
                  fontWeight: 950,
                  fontSize: 13,
                  cursor: aiLoading ? 'not-allowed' : 'pointer',
                  opacity: aiLoading ? 0.75 : 1,
                }}
              >
                {aiLoading ? 'Thinking…' : aiScore === null ? 'Run AI Scan' : 'Run Scan Again'}
              </button>

              {aiError && (
                <div style={{ marginTop: 9, fontSize: 12, color: '#C62828', fontWeight: 800 }}>
                  {aiError}
                </div>
              )}

              {(aiUpgrade || (aiScore !== null && !aiLoading) || normalizedTips.length > 0) && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 11,
                    borderRadius: 12,
                    border: '1px solid #FFE0B2',
                    background: '#FFF8E1',
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
                        <div style={{ fontWeight: 950, fontSize: 15, color: '#263238' }}>
                          AI Score: {aiScore}/100
                        </div>
                      )}

                      {normalizedTips.length > 0 && (
                        <ul
                          style={{
                            margin: '8px 0 0',
                            paddingLeft: 18,
                            fontSize: 12,
                            color: '#37474F',
                            lineHeight: 1.42,
                          }}
                        >
                          {normalizedTips.slice(0, 4).map((tip, i) => (
                            <li key={i} style={{ marginBottom: 5 }}>
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
                padding: 11,
                borderRadius: 14,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 950, color: '#263238', marginBottom: 4 }}>
                Keyword Breakdown
              </div>
              <div style={{ fontSize: 12, color: '#607D8B', lineHeight: 1.4 }}>
                Use this as a checklist. Let the coach handle wording.
              </div>

              <div style={{ marginTop: 9, display: 'grid', gap: 6 }}>
                {buckets.map((b) => (
                  <div
                    key={b.key}
                    style={{
                      padding: 9,
                      borderRadius: 10,
                      border: '1px solid #ECEFF1',
                      background: '#FAFAFA',
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontWeight: 900, color: '#37474F' }}>{b.label}</div>
                      <div style={{ fontWeight: 900, color: b.points > 0 ? ORANGE : '#90A4AE' }}>
                        {b.points} pts
                      </div>
                    </div>
                    <div style={{ marginTop: 3, color: '#607D8B' }}>
                      {b.total > 0 ? `${b.matched}/${b.total} matched` : '0/0 matched'}
                    </div>
                  </div>
                ))}
              </div>

              <details style={{ marginTop: 10 }}>
                <summary
                  style={{
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 900,
                    color: '#37474F',
                    listStyle: 'none',
                    padding: '8px 9px',
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                  }}
                >
                  View missing role terms
                </summary>

                <div
                  style={{
                    marginTop: 8,
                    padding: 10,
                    borderRadius: 10,
                    border: '1px solid #ECEFF1',
                    background: '#FFFFFF',
                  }}
                >
                  {titleKeywords.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12, color: '#388E3C' }}>
                      No missing keywords here. Nice.
                    </p>
                  ) : missingTitleKeywords.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12, color: '#388E3C' }}>
                      No missing title/role keywords. Strong alignment.
                    </p>
                  ) : (
                    <>
                      <p style={{ margin: 0, fontSize: 12, color: '#546E7A', lineHeight: 1.4 }}>
                        Consider weaving these into your summary, skills, or experience section.
                      </p>
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {missingTitleKeywords.map((kw) => (
                          <button
                            key={kw}
                            type="button"
                            onClick={() => openCoach('skills', kw)}
                            style={{
                              border: '1px solid rgba(255,112,67,0.28)',
                              background: 'rgba(255,112,67,0.08)',
                              color: '#C2410C',
                              cursor: 'pointer',
                              padding: '5px 8px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 900,
                            }}
                          >
                            {kw}
                          </button>
                        ))}
                      </div>
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
