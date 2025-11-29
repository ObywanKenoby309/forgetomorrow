// components/resume-form/AtsDepthPanel.tsx
// Unified ATS panel – AI score first, keyword coverage as fallback.

import { useMemo, useState } from 'react';
import AIATSScorerClient from './AIATSScorerClient';

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
  const tokens = cleaned.split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  const counts = new Map<string, number>();

  for (const t of tokens) {
    counts.set(t, (counts.get(t) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

export default function AtsDepthPanel({
  jdText,
  summary,
  skills,
  experiences,
  education,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [aiScore, setAiScore] = useState<number | null>(null);

  if (!jdText?.trim()) return null;

  // ── Build a lightweight "resume text" blob for keyword matching
  const resumeText = useMemo(() => {
    const expBits = (experiences || [])
      .map(
        (e) =>
          `${e.title || ''} ${e.company || ''} ${(e.bullets || []).join(' ')}`,
      )
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
    {
      key: 'hard',
      label: 'Hard skills',
      matched: 0,
      total: 0,
      points: 0,
    },
    {
      key: 'tools',
      label: 'Tools',
      matched: 0,
      total: 0,
      points: 0,
    },
    {
      key: 'edu',
      label: 'Education',
      matched: 0,
      total: 0,
      points: 0,
    },
    {
      key: 'soft',
      label: 'Soft skills',
      matched: 0,
      total: 0,
      points: 0,
    },
  ];

  const missingTitleKeywords = titleKeywords.filter(
    (k) => !matchedTitleKeywords.includes(k),
  );

  // Data passed down to AI component
  const resumeData = {
    summary,
    skills,
    experiences,
    education,
  };

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
            <div
              style={{
                fontWeight: 800,
                fontSize: 16,
                color: '#263238',
              }}
            >
              AI ATS Match (Unified)
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: '#607D8B',
              }}
            >
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

        {/* Main score row – *always* visible */}
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: barColor,
              }}
            >
              {Number.isFinite(primaryScore) ? primaryScore : 0}
              <span
                style={{
                  fontSize: 20,
                  color: '#B0BEC5',
                  marginLeft: 3,
                }}
              >
                /100
              </span>
            </span>
            <span
              style={{
                fontSize: 13,
                color: '#546E7A',
              }}
            >
              {statusText}
            </span>
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

          <div
            style={{
              fontSize: 12,
              color: '#90A4AE',
              marginTop: 4,
            }}
          >
            Keyword coverage (title/role terms):{' '}
            <strong>{keywordCoverage}%</strong>
            {aiScore === null && ' — run an AI scan to unlock full scoring.'}
          </div>
        </div>

        {!expanded ? null : (
          <>
            {/* AI scoring card */}
            <AIATSScorerClient
              jdText={jdText}
              resumeData={resumeData}
              onScoreChange={setAiScore}
            />

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
                  <div
                    style={{
                      fontWeight: 700,
                      color: '#37474F',
                      marginBottom: 2,
                    }}
                  >
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
                  <div
                    style={{
                      marginTop: 2,
                      fontWeight: 600,
                      color: '#455A64',
                    }}
                  >
                    {b.points} pts
                  </div>
                </div>
              ))}
            </div>

            {/* Keyword breakdown */}
            <div
              style={{
                marginTop: 18,
                borderTop: '1px solid #ECEFF1',
                paddingTop: 14,
              }}
            >
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
                    <div
                      style={{
                        fontWeight: 700,
                        marginBottom: 4,
                        color: '#263238',
                      }}
                    >
                      High-impact title / role terms
                    </div>
                    {titleKeywords.length === 0 ? (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: '#388E3C',
                        }}
                      >
                        No missing keywords here — nice!
                      </p>
                    ) : missingTitleKeywords.length === 0 ? (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: '#388E3C',
                        }}
                      >
                        No missing title/role keywords — strong alignment.
                      </p>
                    ) : (
                      <>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: '#546E7A',
                          }}
                        >
                          Consider weaving in these terms somewhere in your
                          summary, skills, or experience section:
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
                  {['High-impact hard skills', 'Tools / Platforms', 'Education', 'Soft skills'].map(
                    (label) => (
                      <div
                        key={label}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          border: '1px solid #ECEFF1',
                          background: '#FFFFFF',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            marginBottom: 4,
                            color: '#263238',
                          }}
                        >
                          {label}
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: '#388E3C',
                          }}
                        >
                          No missing keywords here — nice!
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </details>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
