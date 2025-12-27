'use client';

// components/resume-form/CoachSuggestionsPanel.js

import React, { useEffect, useRef, useState } from 'react';
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
        position: 'fixed',
        right: 24,
        bottom: 80,
        width: 360,
        maxHeight: '70vh',
        background: '#FFF8E1',
        borderRadius: 16,
        border: '1px solid #FFCC80',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 11000,
        pointerEvents: 'auto',
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
          overflowY: 'auto',
          fontSize: 13,
          color: '#5D4037',
          flex: 1,
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
                marginTop: 8,
                padding: 8,
                background: '#FFF3E0',
                borderRadius: 10,
                border: '1px solid #FFE0B2',
                whiteSpace: 'pre-wrap',
              }}
            >
              {text}
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

  return createPortal(panel, portalEl);
}
