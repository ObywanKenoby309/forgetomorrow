'use client';

// components/resume-form/CoachSuggestionsPanel.js

import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * @typedef {Object} CoachContext
 * @property {'overview'|'summary'|'skills'|'experience'|'education'} section
 * @property {string|null} [keyword]
 */

/**
 * @typedef {Object} MissingBuckets
 * @property {string[]} high
 * @property {string[]} tools
 * @property {string[]} edu
 * @property {string[]} soft
 */

/**
 * @typedef {Object} Props
 * @property {boolean} open
 * @property {() => void} onClose
 * @property {CoachContext} [context]
 * @property {string} jdText
 * @property {*} resumeData
 * @property {MissingBuckets} missing
 * @property {(keyword: string) => void} [onAddSkill]
 * @property {(snippet: string) => void} [onAddSummary]
 * @property {(snippet: string) => void} [onAddBullet]
 * @property {boolean} [embedded]
 */

/** @type {React.CSSProperties} */
const chipStyle = {
  borderRadius: 999,
  border: '1px solid #FFCC80',
  background: 'white',
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 800,
  cursor: 'pointer',
};

/** @type {React.CSSProperties} */
const coachCardStyle = {
  marginTop: 8,
  padding: 10,
  background: '#FFF3E0',
  borderRadius: 10,
  border: '1px solid #FFE0B2',
  lineHeight: 1.45,
};

/** @type {React.CSSProperties} */
const signalCardStyle = {
  padding: 10,
  background: '#FFFFFF',
  borderRadius: 12,
  border: '1px solid #FFE0B2',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
};

const sectionColors = {
  summary:    { bg: '#E8EAF6', border: '#C5CAE9', text: '#283593', label: 'Summary' },
  skills:     { bg: '#E0F2F1', border: '#B2DFDB', text: '#00695C', label: 'Skills' },
  experience: { bg: '#FFF3E0', border: '#FFE0B2', text: '#E65100', label: 'Experience' },
  education:  { bg: '#F3E5F5', border: '#E1BEE7', text: '#6A1B9A', label: 'Education' },
};

const sectionLabelMap = {
  overview:   'overall alignment',
  summary:    'summary section',
  skills:     'skills section',
  experience: 'experience bullets',
  education:  'education section',
};

function buildOneCallKey(jdText, resumeData, missing) {
  const summary = String(resumeData?.summary || '');
  const skills = Array.isArray(resumeData?.skills) ? resumeData.skills.join('|') : '';
  const expCount = Array.isArray(resumeData?.workExperiences)
    ? resumeData.workExperiences.length
    : Array.isArray(resumeData?.experiences) ? resumeData.experiences.length : 0;
  const eduCount = Array.isArray(resumeData?.educationList)
    ? resumeData.educationList.length
    : Array.isArray(resumeData?.education) ? resumeData.education.length : 0;
  const high = Array.isArray(missing?.high) ? missing.high.join('|') : '';

  return [
    String(jdText || '').slice(0, 500),
    summary.slice(0, 500),
    skills.slice(0, 500),
    expCount,
    eduCount,
    high.slice(0, 500),
  ].join('::');
}

// ─── ActionCard ───────────────────────────────────────────────────────────────

function ActionCard({ action, onAddSkill, onAddSummary, onAddBullet }) {
  const colors = sectionColors[action.section] || sectionColors.summary;

  return (
    <div style={signalCardStyle}>
      {/* Section badge */}
      <div style={{ marginBottom: 6 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: colors.text,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: 999,
            padding: '2px 8px',
          }}
        >
          {colors.label}
        </span>
      </div>

      {/* Required signal */}
      {action.requiredSignal && (
        <div style={{ fontSize: 13, fontWeight: 900, color: '#263238', lineHeight: 1.35, marginBottom: 6 }}>
          {action.requiredSignal}
        </div>
      )}

      {/* Decision question */}
      {action.decisionQuestion && (
        <div
          style={{
            marginTop: 4,
            padding: 8,
            borderRadius: 10,
            background: '#E3F2FD',
            border: '1px solid #BBDEFB',
            fontSize: 12,
            color: '#0D47A1',
            lineHeight: 1.42,
            marginBottom: 6,
          }}
        >
          <strong>What the employer is deciding:</strong> {action.decisionQuestion}
        </div>
      )}

      {/* Resume evidence */}
      {action.resumeEvidence && (
        <div style={{ marginTop: 4, fontSize: 12, color: '#6D4C41', lineHeight: 1.4, marginBottom: 6 }}>
          <strong>Resume evidence:</strong> {action.resumeEvidence}
        </div>
      )}

      {/* Hiring impact */}
      {action.hiringImpact && (
        <div style={{ marginTop: 4, fontSize: 12, color: '#455A64', lineHeight: 1.4, marginBottom: 6 }}>
          <strong>Hiring impact:</strong> {action.hiringImpact}
        </div>
      )}

      {/* If true */}
      {action.ifTrue && (
        <div
          style={{
            marginTop: 6,
            padding: 8,
            borderRadius: 10,
            background: '#E8F5E9',
            border: '1px solid #C8E6C9',
            fontSize: 12,
            color: '#1B5E20',
            lineHeight: 1.42,
          }}
        >
          <strong>If true:</strong> {action.ifTrue}
        </div>
      )}

      {/* If not true */}
      {action.ifNotTrue && (
        <div
          style={{
            marginTop: 6,
            padding: 8,
            borderRadius: 10,
            background: '#FFF8E1',
            border: '1px solid #FFE0B2',
            fontSize: 12,
            color: '#5D4037',
            lineHeight: 1.42,
          }}
        >
          <strong>If not true:</strong> {action.ifNotTrue}
        </div>
      )}

      {/* Future positioning */}
      {action.futurePositioning && (
        <div style={{ marginTop: 6, fontSize: 12, color: '#607D8B', lineHeight: 1.4 }}>
          <strong>Future positioning:</strong> {action.futurePositioning}
        </div>
      )}

      {/* Contextual quick-insert chips */}
      {(onAddSkill || onAddSummary || onAddBullet) && (action.ifTrue || action.requiredSignal) && (
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {action.section === 'summary' && onAddSummary && action.ifTrue && (
            <button type="button" onClick={() => onAddSummary(action.ifTrue)} style={chipStyle}>
              Use as summary guidance
            </button>
          )}
          {action.section === 'skills' && onAddSkill && action.requiredSignal && (
            <button type="button" onClick={() => onAddSkill(action.requiredSignal)} style={chipStyle}>
              Review skill signal
            </button>
          )}
          {action.section === 'experience' && onAddBullet && action.ifTrue && (
            <button type="button" onClick={() => onAddBullet(action.ifTrue)} style={chipStyle}>
              Use as bullet guidance
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TrajectoryCard ──────────────────────────────────────────────────────────

function TrajectoryCard({ trajectory, onClose }) {
  if (!trajectory?.triggered) return null;

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        background: 'linear-gradient(135deg, #FFF8E1, #FFF3E0)',
        border: '1px solid #FFCC80',
        boxShadow: '0 4px 16px rgba(255,112,67,0.12)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>🧭</span>
        <div style={{ fontWeight: 900, fontSize: 14, color: '#E65100' }}>
          Career Trajectory
        </div>
      </div>

      {/* Gap summary */}
      <div
        style={{
          padding: 10,
          borderRadius: 10,
          background: '#FFFFFF',
          border: '1px solid #FFE0B2',
          fontSize: 12,
          color: '#5D4037',
          lineHeight: 1.55,
          marginBottom: 12,
        }}
      >
        <strong>Honest assessment:</strong> {trajectory.gapSummary}
      </div>

      {/* Where they ARE competitive */}
      <div style={{ fontWeight: 900, fontSize: 12, color: '#BF360C', marginBottom: 8 }}>
        Where your resume is competitive right now:
      </div>

      <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
        {trajectory.suggestedRoles.map((item, i) => (
          <div
            key={i}
            style={{
              padding: 10,
              borderRadius: 10,
              background: '#E8F5E9',
              border: '1px solid #C8E6C9',
              fontSize: 12,
              color: '#1B5E20',
              lineHeight: 1.45,
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 3 }}>{item.role}</div>
            <div>{item.reason}</div>
          </div>
        ))}
      </div>

      {/* Coach message */}
      <div
        style={{
          padding: 10,
          borderRadius: 10,
          background: '#E3F2FD',
          border: '1px solid #BBDEFB',
          fontSize: 12,
          color: '#0D47A1',
          lineHeight: 1.55,
          marginBottom: 12,
        }}
      >
        <span style={{ fontWeight: 900 }}>A note from your career strategist: </span>
        {trajectory.coachMessage}
      </div>

      {/* CTA */}
      <a
        href="/the-hearth?module=mentorship"
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '10px 14px',
          borderRadius: 999,
          background: '#FF7043',
          color: 'white',
          fontWeight: 900,
          fontSize: 13,
          textDecoration: 'none',
          cursor: 'pointer',
        }}
      >
        Connect with a ForgeTomorrow Coach →
      </a>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * @param {Props} props
 */
export default function CoachSuggestionsPanel(props) {
  const {
    open,
    onClose,
    context = { section: 'overview', keyword: null },
    jdText,
    resumeData,
    missing,
    onAddSkill,
    onAddSummary,
    onAddBullet,
    embedded = false,
  } = props;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [structured, setStructured] = useState(null);
  const [trajectory, setTrajectory] = useState(null);  // TrajectoryData | null
  const [fallbackText, setFallbackText] = useState('');
  const [error, setError] = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(null); // 'up' | 'down' | null

  // Track the last request key (JD+resume snapshot) to avoid redundant API calls
  const lastRequestKeyRef = useRef('');
  const attemptCountRef = useRef(0);
  const seenKeysRef = useRef(new Set());
  const trajectoryLockedRef = useRef(false);  // prevents handleAsk from firing while trajectory is showing

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedSection = context?.section || 'overview';
  const humanSection = sectionLabelMap[selectedSection] || 'this part of your resume';
  const keywordHint = context?.keyword
    ? `Focus especially on including the keyword "${context.keyword}" in a natural way.`
    : '';

  // The request key is based on JD+resume content only — NOT section.
  // One API call per JD+resume snapshot. Section changes only filter locally.
  const requestKey = useMemo(
    () => buildOneCallKey(jdText, resumeData, missing),
    [jdText, resumeData, missing]
  );

  // Filter improvement actions to the selected section
  const filteredActions = useMemo(() => {
    if (!structured?.improvementActions?.length) return [];
    if (selectedSection === 'overview') return structured.improvementActions;
    return structured.improvementActions.filter((a) => a.section === selectedSection);
  }, [structured, selectedSection]);

  const hasParsedContent = Boolean(
    structured?.matchAssessment ||
    structured?.improvementActions?.length > 0 ||
    trajectory?.triggered ||
    fallbackText
  );

  const sendFeedback = async (score, feedbackType = null, feedbackComment = null) => {
    try {
      await fetch('/api/tools/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: 'forge-hammer-coach',
          feedbackScore: score,
          feedbackType: feedbackType || null,
          feedbackComment: feedbackComment || null,
          inputSnapshot: jdText ? jdText.slice(0, 500) : null,
          outputSnapshot: structured?.matchAssessment || null,
        }),
      });
    } catch (e) {
      console.error('Feedback error', e);
    }
  };

  const handleFeedbackUp = async () => {
    await sendFeedback('up');
    setFeedbackSent('up');
  };

  const handleFeedbackDown = async () => {
    const feedbackType = window.prompt('What was wrong?\n- wrong_signals\n- too_generic\n- missed_evidence\n- other');
    if (!feedbackType) return;
    const feedbackComment = window.prompt('Optional: what should it have said?');
    await sendFeedback('down', feedbackType, feedbackComment || null);
    setFeedbackSent('down');
  };

  const handleAsk = async () => {
    setLoading(true);
    setError(null);

    try {
      // Track attempt count — increments each time a new unique resume snapshot is sent
      if (!seenKeysRef.current.has(requestKey)) {
        seenKeysRef.current.add(requestKey);
        attemptCountRef.current = seenKeysRef.current.size;
      }

      const resp = await fetch('/api/ats-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jdText,
          resumeData,
          context: { section: 'overview', keyword: null },
          missing,
          attemptCount: attemptCountRef.current,
        }),
      });

      const raw = await resp.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }

      if (!resp.ok) {
        const msg = data?.error || `Coach request failed (${resp.status}).${resp.status === 404 ? ' Route /api/ats-coach not found.' : ''}`;
        throw new Error(msg);
      }

      const out = String(data?.text || '').trim();
      const lower = out.toLowerCase();

      if (data?.upgrade || lower.includes('too many requests') || lower.includes('rate limit')) {
        setError(out || 'Coach is busy right now. Try again in a few seconds.');
        lastRequestKeyRef.current = '';
        return;
      }

      // Primary path: structured JSON
      if (data?.structured && Array.isArray(data.structured.improvementActions)) {
        setStructured(data.structured);
        setFallbackText('');
        setError(null);
        // Handle trajectory if triggered
        if (data?.trajectory?.triggered) {
          setTrajectory(data.trajectory);
          trajectoryLockedRef.current = true;
        } else {
          setTrajectory(null);
          trajectoryLockedRef.current = false;
        }
        lastRequestKeyRef.current = requestKey;
        return;
      }

      // Fallback: plain text
      if (!out) {
        setError('Coach returned an empty response. Check /api/ats-coach.');
        lastRequestKeyRef.current = '';
        return;
      }

      setFallbackText(out);
      setStructured(null);
      setError(null);
      lastRequestKeyRef.current = requestKey;
    } catch (e) {
      console.error('CoachSuggestionsPanel error', e);
      setError(e?.message || 'Coach could not load suggestions. Try again.');
      lastRequestKeyRef.current = '';
    } finally {
      setLoading(false);
    }
  };

  // Fire when panel opens or JD/resume snapshot changes.
  // Does NOT re-fire when selectedSection changes — section changes filter locally.
  // Reset state when panel closes
  useEffect(() => {
    if (!open) {
      setLoading(false);
      setTrajectory(null);
      trajectoryLockedRef.current = false;
    }
  }, [open]);

  // When JD+resume snapshot changes, clear stale results so the user
  // knows they need to run the coach again — but do NOT auto-fire.
  useEffect(() => {
    if (!open) return;
    if (lastRequestKeyRef.current && lastRequestKeyRef.current !== requestKey) {
      setStructured(null);
      setFallbackText('');
      setError(null);
      setTrajectory(null);
      trajectoryLockedRef.current = false;
      lastRequestKeyRef.current = '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const handleQuickInsert = (type) => {
    if (!structured && !fallbackText) return;
    if (type === 'summary' && onAddSummary) {
      const text = structured?.summaryFix?.improved || fallbackText;
      if (text) onAddSummary(text);
    }
    if (type === 'skill' && onAddSkill && fallbackText) {
      fallbackText.split('\n').map((l) => l.replace(/^[-•]+\s*/, '').trim()).filter(Boolean).slice(0, 5).forEach((s) => onAddSkill(s));
    }
    if (type === 'bullet' && onAddBullet && fallbackText) {
      fallbackText.split('\n').filter((l) => l.trim()).slice(0, 3).forEach((line) => {
        onAddBullet(line.startsWith('•') ? line : `• ${line.trim()}`);
      });
    }
  };

  if (!mounted || !open) return null;

  const showReview = !loading && hasParsedContent;
  const isOverview = selectedSection === 'overview';
  const showSectionActions = showReview && !isOverview && filteredActions.length > 0;
  const showEmptySection = showReview && !isOverview && filteredActions.length === 0 && !fallbackText;

  const panel = (
    <div
      style={{
        width: '100%',
        background: embedded ? 'transparent' : '#FFF8E1',
        borderRadius: embedded ? 0 : 16,
        border: embedded ? 'none' : '1px solid #FFCC80',
        boxShadow: embedded ? 'none' : '0 10px 30px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header — modal mode only */}
      {!embedded && (
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid #FFE0B2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 15, color: '#E65100' }}>Writing Coach</div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 900, color: '#BF360C', fontSize: 18, lineHeight: 1 }}
            aria-label="Close coach"
          >
            ×
          </button>
        </div>
      )}

      <div style={{ padding: embedded ? 0 : '10px 14px', fontSize: 13, color: '#5D4037' }}>

        {/* Modal controls */}
        {!embedded && (
          <>
            <p style={{ marginBottom: 8 }}>
              You&apos;re editing your <strong>{humanSection}</strong>. I&apos;ll suggest wording you can paste directly into your resume. {keywordHint}
            </p>
            {!jdText?.trim() && (
              <p style={{ marginBottom: 8, fontStyle: 'italic', color: '#8D6E63' }}>
                Tip: You&apos;ll get the best results once a job description is loaded.
              </p>
            )}
            <button
              type="button"
              onClick={handleAsk}
              disabled={loading || !jdText?.trim()}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: 'none',
                background: '#FF7043',
                color: 'white',
                fontWeight: 800,
                cursor: loading || !jdText?.trim() ? 'not-allowed' : 'pointer',
                marginBottom: 10,
                opacity: loading || !jdText?.trim() ? 0.7 : 1,
              }}
            >
              {loading ? 'Thinking…' : 'Ask the Coach'}
            </button>
          </>
        )}

        {/* Embedded header */}
        {embedded && (
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#BF360C' }}>
              Reviewing {humanSection}
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ border: '1px solid #FFE0B2', background: '#FFFFFF', color: '#BF360C', borderRadius: 999, padding: '4px 8px', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ padding: 10, borderRadius: 10, background: '#FFFFFF', border: '1px solid #FFE0B2', fontSize: 12, color: '#6D4C41', lineHeight: 1.45 }}>
            Thinking…
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: 4, color: '#C62828', fontSize: 12, fontWeight: 700 }}>{error}</div>
        )}

        {/* ── Review content ─────────────────────────────────────────────── */}
        {showReview && (
          <>
            <div style={{ ...coachCardStyle, maxHeight: embedded ? 460 : 380, overflowY: 'auto' }}>

              {/* ── OVERVIEW: synopsis only — details live in individual sections ── */}
              {isOverview && (
                <>
                  {/* Trajectory card — shown on 2nd attempt if core gaps persist */}
                  {trajectory?.triggered && (
                    <div style={{ marginBottom: 12 }}>
                      <TrajectoryCard trajectory={trajectory} onClose={() => setTrajectory(null)} />
                    </div>
                  )}

                  {/* Standard recruiter assessment — shown when no trajectory or alongside it */}
                  {!trajectory?.triggered && structured?.matchAssessment && (
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        background: '#FFFFFF',
                        border: '1px solid #FFE0B2',
                        fontSize: 12,
                        color: '#5D4037',
                        lineHeight: 1.55,
                      }}
                    >
                      <div style={{ fontWeight: 900, color: '#BF360C', marginBottom: 6, fontSize: 13 }}>
                        Recruiter assessment
                      </div>
                      <div>{structured.matchAssessment}</div>
                      {structured.environment && (
                        <div style={{ marginTop: 8, fontSize: 11, color: '#90A4AE', fontWeight: 700 }}>
                          Detected environment: {structured.environment}
                        </div>
                      )}
                      <div style={{ marginTop: 10, fontSize: 11, color: '#78909C', lineHeight: 1.4 }}>
                        Open Summary, Skills, Experience, or Education below for targeted section feedback.
                      </div>
                    </div>
                  )}

                  {/* Fallback plain text */}
                  {!structured && fallbackText && (
                    <div style={{ fontSize: 12, color: '#5D4037', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {fallbackText}
                    </div>
                  )}
                </>
              )}

              {/* ── SINGLE SECTION: filtered action cards ──────────────── */}
              {showSectionActions && (
                <div style={{ display: 'grid', gap: 10 }}>
                  {filteredActions.map((action, index) => (
                    <ActionCard
                      key={`${action.section}-${action.requiredSignal}-${index}`}
                      action={action}
                      onAddSkill={onAddSkill}
                      onAddSummary={onAddSummary}
                      onAddBullet={onAddBullet}
                    />
                  ))}
                </div>
              )}

              {/* Empty section state */}
              {showEmptySection && (
				<div style={{ padding: 10, borderRadius: 10, background: '#FFFFFF', border: '1px solid #FFE0B2', fontSize: 12, color: '#6D4C41', lineHeight: 1.45 }}>
					No targeted feedback was returned for this section. If relevant education, certifications, or training are present, they may still support recruiter credibility even when the JD does not list them as a hard requirement.
				</div>
			  )}
            </div>
          </>
        )}
        {/* Feedback row — shown after results load */}
        {showReview && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,224,178,0.6)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {feedbackSent ? (
              <span style={{ fontSize: 11, color: '#90A4AE' }}>
                {feedbackSent === 'up' ? 'Thanks for the feedback 👍' : 'Feedback noted 👎'}
              </span>
            ) : (
              <>
                <span style={{ fontSize: 11, color: '#90A4AE', marginRight: 2 }}>Was this useful?</span>
                <button
                  type="button"
                  onClick={handleFeedbackUp}
                  style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.10)', background: 'white', fontSize: 12, cursor: 'pointer', color: '#37474F' }}
                >
                  👍 Useful
                </button>
                <button
                  type="button"
                  onClick={handleFeedbackDown}
                  style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.10)', background: 'white', fontSize: 12, cursor: 'pointer', color: '#37474F' }}
                >
                  👎 Needs Work
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return panel;
}