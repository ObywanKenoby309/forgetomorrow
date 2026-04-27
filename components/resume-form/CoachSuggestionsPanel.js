'use client';

// components/resume-form/CoachSuggestionsPanel.js

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  marginTop: 8,
  padding: 10,
  background: '#FFFFFF',
  borderRadius: 12,
  border: '1px solid #FFE0B2',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
};

function parseCoachText(value) {
  const raw = String(value || '').trim();
  if (!raw) return { title: '', matchAssessment: '', actions: [], fallbackText: '' };

  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let title = '';
  let matchAssessment = '';
  const actions = [];
  let current = null;
  const fallback = [];

  lines.forEach((line) => {
    if (!title && !line.startsWith('Match Assessment:') && !line.startsWith('Improvement Actions:')) {
      title = line;
      return;
    }

    if (line.startsWith('Match Assessment:')) {
      matchAssessment = line.replace('Match Assessment:', '').trim();
      return;
    }

    if (line.startsWith('Improvement Actions:')) return;

    const requiredMatch = line.match(/^•\s*Required signal:\s*(.*)$/i);
    if (requiredMatch) {
      current = {
        requiredSignal: requiredMatch[1]?.trim() || '',
        resumeEvidence: '',
        ifTrue: '',
        ifNotTrue: '',
        futurePositioning: '',
		section: '',
        other: [],
      };
      actions.push(current);
      return;
    }

    if (current) {
	  if (line.startsWith('Section:')) {
		current.section = line.replace('Section:', '').trim();
		return;
	  }
      if (line.startsWith('Resume evidence:')) {
        current.resumeEvidence = line.replace('Resume evidence:', '').trim();
        return;
      }
      if (line.startsWith('If true:')) {
        current.ifTrue = line.replace('If true:', '').trim();
        return;
      }
      if (line.startsWith('If not true:')) {
        current.ifNotTrue = line.replace('If not true:', '').trim();
        return;
      }
      if (line.startsWith('Future positioning:')) {
        current.futurePositioning = line.replace('Future positioning:', '').trim();
        return;
      }
      current.other.push(line);
      return;
    }

    fallback.push(line);
  });

  return {
    title,
    matchAssessment,
    actions,
    fallbackText: fallback.join('\n'),
  };
}

function mapSignalToSection(signal = '') {
  const s = signal.toLowerCase();

  if (s.includes('project') || s.includes('stakeholder') || s.includes('management') || s.includes('experience')) {
    return 'experience';
  }

  if (s.includes('tool') || s.includes('api') || s.includes('llm') || s.includes('skill')) {
    return 'skills';
  }

  if (s.includes('education') || s.includes('degree') || s.includes('certification')) {
    return 'education';
  }

  return 'summary';
}


/**
 * Writing coach suggestions panel.
 * IMPORTANT: JSDoc typing here prevents TS from inferring `context.keyword` as only `null`.
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
  } = props;

  const [portalEl, setPortalEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);

  const askedOnceRef = useRef(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const el = document.createElement('div');
    el.id = 'ft-coach-portal';
    document.body.appendChild(el);
    setPortalEl(el);

    return () => {
      try {
        document.body.removeChild(el);
      } catch {
        // ignore
      }
    };
  }, []);

  const sectionLabelMap = {
    overview: 'overall alignment',
    summary: 'summary section',
    skills: 'skills section',
    experience: 'experience bullets',
    education: 'education section',
  };

  const humanSection = sectionLabelMap[context?.section] || 'this part of your resume';

  const keywordHint = context?.keyword
    ? `Focus especially on including the keyword "${context.keyword}" in a natural way.`
    : '';

  const parsedCoach = useMemo(() => parseCoachText(text), [text]);
  const filteredActions = useMemo(() => {
  if (!parsedCoach.actions.length) return [];

  if (context?.section === 'overview') {
    return parsedCoach.actions;
  }

  return parsedCoach.actions.filter((action) => {
    const section = action.section || mapSignalToSection(action.requiredSignal);
	return section === context?.section;
  });
}, [parsedCoach.actions, context?.section]);

  const handleAsk = async () => {
    setLoading(true);
    setError(null);

    try {
      const resp = await fetch('/api/ats-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jdText,
          resumeData,
          context,
          missing,
        }),
      });

      const raw = await resp.text();
      let data = null;

      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!resp.ok) {
        const msg =
          data?.error ||
          `Coach request failed (${resp.status}). ${resp.status === 404 ? 'Route /api/ats-coach not found.' : ''}`;
        throw new Error(msg);
      }

      const out = (data?.text || '').toString().trim();
      if (!out) {
        setText('');
        setError('Coach returned an empty response. Check /api/ats-coach.');
        return;
      }

      setText(out);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('CoachSuggestionsPanel error', e);
      setError(e?.message || 'Coach could not load suggestions. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-ask ONCE whenever the panel is opened
  useEffect(() => {
    if (!open) {
      askedOnceRef.current = false;
      setText('');
      setError(null);
      setLoading(false);
      return;
    }

    if (open && jdText?.trim() && !askedOnceRef.current) {
      askedOnceRef.current = true;
      handleAsk();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleQuickInsert = (type) => {
    if (!text) return;

    if (type === 'summary' && onAddSummary) {
      onAddSummary(text);
    }

    if (type === 'skill' && onAddSkill) {
      text
        .split('\n')
        .map((l) => l.replace(/^[-•]+\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 5)
        .forEach((skill) => onAddSkill(skill));
    }

    if (type === 'bullet' && onAddBullet) {
      text
        .split('\n')
        .filter((l) => l.trim())
        .slice(0, 3)
        .forEach((line) => {
          const bullet = line.startsWith('•') ? line : `• ${line.trim()}`;
          onAddBullet(bullet);
        });
    }
  };

  if (!open || !portalEl) return null;

  const panel = (
    <div
      style={{
        width: '100%',
        background: '#FFF8E1',
        borderRadius: 16,
        border: '1px solid #FFCC80',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontWeight: 900,
            color: '#BF360C',
            fontSize: 18,
            lineHeight: 1,
          }}
          aria-label="Close coach"
          title="Close"
        >
          ×
        </button>
      </div>

      <div
        style={{
          padding: '10px 14px',
          fontSize: 13,
          color: '#5D4037',
        }}
      >
        <p style={{ marginBottom: 8 }}>
          You&apos;re editing your <strong>{humanSection}</strong>. I&apos;ll suggest wording you can paste directly
          into your resume. {keywordHint}
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

        {error && <div style={{ marginTop: 4, color: '#C62828', fontSize: 12, fontWeight: 700 }}>{error}</div>}

        {text && (
          <>
            <div
              style={{
                ...coachCardStyle,
                maxHeight: 360,
                overflowY: 'auto',
              }}
            >
              {parsedCoach.title && (
                <div style={{ fontSize: 14, fontWeight: 900, color: '#E65100', marginBottom: 8 }}>
                  {parsedCoach.title}
                </div>
              )}

              {context?.section === 'overview' && parsedCoach.matchAssessment && (
                <div
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: '1px solid #FFCC80',
                    background: '#FFF8E1',
                    color: '#5D4037',
                    fontSize: 12,
                    lineHeight: 1.45,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ fontWeight: 900, color: '#BF360C', marginBottom: 4 }}>Match Assessment</div>
                  <div>{parsedCoach.matchAssessment}</div>
                </div>
              )}

              {filteredActions.length > 0 ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {filteredActions.map((action, index) => (
                    <div key={`${action.requiredSignal}-${index}`} style={signalCardStyle}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: '#E65100', textTransform: 'uppercase' }}>
                        Required signal
                      </div>
                      <div style={{ marginTop: 3, fontSize: 13, fontWeight: 900, color: '#263238', lineHeight: 1.35 }}>
                        {action.requiredSignal || 'Missing signal'}
                      </div>

                      {action.resumeEvidence && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#6D4C41', lineHeight: 1.4 }}>
                          <strong>Resume evidence:</strong> {action.resumeEvidence}
                        </div>
                      )}

                      {action.ifTrue && (
                        <div
                          style={{
                            marginTop: 8,
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

                      {action.ifNotTrue && (
                        <div
                          style={{
                            marginTop: 8,
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

                      {action.futurePositioning && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#607D8B', lineHeight: 1.4 }}>
                          <strong>Future positioning:</strong> {action.futurePositioning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
  <div
    style={{
      padding: 10,
      borderRadius: 10,
      background: '#FFFFFF',
      border: '1px solid #FFE0B2',
      fontSize: 12,
      color: '#6D4C41',
      lineHeight: 1.45,
    }}
  >
    No section-specific coaching items were returned for this section.
  </div>
)}
            </div>

            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button type="button" onClick={() => handleQuickInsert('summary')} style={chipStyle}>
                Apply to summary
              </button>
              <button type="button" onClick={() => handleQuickInsert('skill')} style={chipStyle}>
                Add as skills
              </button>
              <button type="button" onClick={() => handleQuickInsert('bullet')} style={chipStyle}>
                Insert as bullets
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return panel;
}
