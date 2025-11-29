'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - context: { section: 'overview'|'summary'|'skills'|'experience'|'education', keyword?: string }
 * - jdText, resumeData
 * - missing: { high: string[], tools: string[], edu: string[], soft: string[] }
 * - onAddSkill, onAddSummary, onAddBullet
 */
export default function CoachSuggestionsPanel({
  open,
  onClose,
  context = { section: 'overview' },
  jdText,
  resumeData,
  missing,
  onAddSkill,
  onAddSummary,
  onAddBullet,
}) {
  // 🔹 ALL hooks at the top, always in the same order
  const [portalEl, setPortalEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);

  // Create a portal container under <body> once on mount (client-only)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const el = document.createElement('div');
    el.id = 'ft-coach-portal';
    document.body.appendChild(el);
    setPortalEl(el);

    return () => {
      document.body.removeChild(el);
    };
  }, []);

  // After hooks are defined, we can early-return safely
  if (!open || !portalEl) return null;

  const sectionLabelMap = {
    overview: 'overall alignment',
    summary: 'summary section',
    skills: 'skills section',
    experience: 'experience bullets',
    education: 'education section',
  };

  const humanSection =
    sectionLabelMap[context.section] || 'this part of your resume';

  const keywordHint = context.keyword
    ? `Focus especially on how to include the keyword "${context.keyword}" in a natural way.`
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

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || 'Coach request failed');
      }

      setText(data.text || '');
    } catch (e) {
      console.error('CoachSuggestionsPanel error', e);
      setError('Coach could not load suggestions. Try again.');
    } finally {
      setLoading(false);
    }
  };

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
        zIndex: 11000, // top of the stack
        pointerEvents: 'auto',
      }}
    >
      {/* Header */}
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
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: '#E65100',
          }}
        >
          Writing Coach
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontWeight: 700,
            color: '#BF360C',
          }}
          aria-label="Close coach"
        >
          ×
        </button>
      </div>

      {/* Body */}
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
          You&apos;re editing your <strong>{humanSection}</strong>. I&apos;ll
          suggest wording you can paste directly into your resume. {keywordHint}
        </p>

        {!jdText?.trim() && (
          <p
            style={{
              marginBottom: 8,
              fontStyle: 'italic',
              color: '#8D6E63',
            }}
          >
            Tip: You&apos;ll get the best results once a job description is
            loaded above.
          </p>
        )}

        <button
          type="button"
          onClick={handleAsk}
          disabled={loading}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: 'none',
            background: '#FF7043',
            color: 'white',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 10,
          }}
        >
          {loading ? 'Thinking…' : 'Ask the Coach'}
        </button>

        {error && (
          <p
            style={{
              marginTop: 4,
              color: '#C62828',
              fontSize: 12,
            }}
          >
            {error}
          </p>
        )}

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

            <div
              style={{
                marginTop: 10,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              <button
                type="button"
                onClick={() => handleQuickInsert('summary')}
                style={chipStyle}
              >
                Apply to summary
              </button>
              <button
                type="button"
                onClick={() => handleQuickInsert('skill')}
                style={chipStyle}
              >
                Add as skills
              </button>
              <button
                type="button"
                onClick={() => handleQuickInsert('bullet')}
                style={chipStyle}
              >
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

const chipStyle = {
  borderRadius: 999,
  border: '1px solid #FFCC80',
  background: 'white',
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};
