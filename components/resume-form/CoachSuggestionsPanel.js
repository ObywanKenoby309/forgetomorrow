'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type CoachContext = {
  section: 'overview' | 'summary' | 'skills' | 'experience' | 'education';
  keyword?: string | null;
};

type MissingBuckets = {
  high: string[];
  tools: string[];
  edu: string[];
  soft: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  context?: CoachContext;
  jdText: string;
  resumeData: any;
  missing: MissingBuckets;
  onAddSkill?: (keyword: string) => void;
  onAddSummary?: (snippet: string) => void;
  onAddBullet?: (snippet: string) => void;
};

function safePreview(raw: string, max = 180) {
  const t = (raw || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export default function CoachSuggestionsPanel({
  open,
  onClose,
  context = { section: 'overview', keyword: null },
  jdText,
  resumeData,
  missing,
  onAddSkill,
  onAddSummary,
  onAddBullet,
}: Props) {
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // used to auto-run once per "open session" (and once per context change)
  const askedKeyRef = useRef<string>('');
  const abortRef = useRef<AbortController | null>(null);

  const hasJD = !!jdText?.trim();

  // Create portal container once on mount
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

  // When closing, abort any in-flight request
  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      abortRef.current = null;
      askedKeyRef.current = '';
      setLoading(false);
      setError(null);
      setText('');
    }
  }, [open]);

  const sectionLabelMap: Record<string, string> = useMemo(
    () => ({
      overview: 'overall alignment',
      summary: 'summary section',
      skills: 'skills section',
      experience: 'experience bullets',
      education: 'education section',
    }),
    [],
  );

  const humanSection = sectionLabelMap[context.section] || 'this part of your resume';

  const keywordHint = context.keyword
    ? `Focus especially on including the keyword "${context.keyword}" in a natural way.`
    : '';

  const handleAsk = useCallback(async () => {
    if (!hasJD) {
      setError('Load a job description first.');
      return;
    }

    // Abort previous request if user clicks multiple times
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch('/api/ats-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ac.signal,
        body: JSON.stringify({
          jdText,
          resumeData,
          context,
          missing,
        }),
      });

      const raw = await resp.text();

      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!resp.ok) {
        const msg =
          data?.error ||
          `Coach request failed (${resp.status}). ${
            resp.status === 404 ? 'Route /api/ats-coach not found.' : ''
          }${raw ? ` Response: "${safePreview(raw)}"` : ''}`;
        throw new Error(msg);
      }

      const out = (data?.text || '').toString().trim();
      if (!out) {
        setText('');
        setError(
          `Coach returned an empty response. ${
            raw ? `Raw response: "${safePreview(raw)}"` : 'Check /api/ats-coach output.'
          }`,
        );
        return;
      }

      setText(out);
    } catch (e: any) {
      if (e?.name === 'AbortError') return; // user closed or retried
      console.error('CoachSuggestionsPanel error', e);
      setError(e?.message || 'Coach could not load suggestions. Try again.');
    } finally {
      // if a new request started, don't flip loading off for the old one
      if (abortRef.current === ac) {
        setLoading(false);
      }
    }
  }, [hasJD, jdText, resumeData, context, missing]);

  // Auto-ask ONCE per open + per context change while open
  useEffect(() => {
    if (!open) return;
    if (!hasJD) return;
    if (!portalEl) return;

    const key = `${context.section}|${context.keyword || ''}`;
    if (askedKeyRef.current === key) return;

    askedKeyRef.current = key;
    handleAsk();
  }, [open, hasJD, portalEl, context.section, context.keyword, handleAsk]);

  const handleQuickInsert = (type: 'summary' | 'skill' | 'bullet') => {
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
          You&apos;re editing your <strong>{humanSection}</strong>. I&apos;ll suggest wording you can paste directly
          into your resume. {keywordHint}
        </p>

        {!hasJD && (
          <p style={{ marginBottom: 8, fontStyle: 'italic', color: '#8D6E63' }}>
            Tip: You&apos;ll get the best results once a job description is loaded.
          </p>
        )}

        <button
          type="button"
          onClick={handleAsk}
          disabled={loading || !hasJD}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: 'none',
            background: '#FF7043',
            color: 'white',
            fontWeight: 800,
            cursor: loading || !hasJD ? 'not-allowed' : 'pointer',
            marginBottom: 10,
            opacity: loading || !hasJD ? 0.7 : 1,
          }}
        >
          {loading ? 'Thinking…' : 'Ask the Coach'}
        </button>

        {error && (
          <div style={{ marginTop: 4, color: '#C62828', fontSize: 12, fontWeight: 700 }}>{error}</div>
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

const chipStyle: React.CSSProperties = {
  borderRadius: 999,
  border: '1px solid #FFCC80',
  background: 'white',
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 800,
  cursor: 'pointer',
};
