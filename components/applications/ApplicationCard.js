// components/applications/ApplicationCard.js
import React, { useEffect, useMemo, useState } from 'react';
import { FaExchangeAlt } from 'react-icons/fa';

const STAGES = ['Pinned', 'Applied', 'Interviewing', 'Offers', 'Closed Out'];

// Stage accent colors — top border strip
const STAGE_ACCENT = {
  Pinned:       '#888780',
  Applied:      '#378ADD',
  Interviewing: '#1D9E75',
  Offers:       '#D4537E',
  'Closed Out': '#888780',
};

// Stage badge colors
const STAGE_BADGE = {
  Pinned:       { bg: '#F1EFE8', color: '#5F5E5A' },
  Applied:      { bg: '#E6F1FB', color: '#185FA5' },
  Interviewing: { bg: '#E1F5EE', color: '#0F6E56' },
  Offers:       { bg: '#FBEAF0', color: '#993556' },
  'Closed Out': { bg: '#F1EFE8', color: '#5F5E5A' },
};

// Shared icon button style — Option A: bordered, contained
function IconBtn({ onClick, title, label, danger = false, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={label || title}
      style={{
        width: 30,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '0.5px solid rgba(0,0,0,0.10)',
        borderRadius: 7,
        background: 'rgba(255,255,255,0.85)',
        cursor: 'pointer',
        color: danger ? '#E24B4A' : '#607D8B',
        fontSize: 14,
        padding: 0,
        transition: 'all 0.12s ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? '#FCEBEB' : '#F1F5F9';
        e.currentTarget.style.borderColor = danger ? '#F09595' : 'rgba(0,0,0,0.18)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.85)';
        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.10)';
      }}
    >
      {children}
    </button>
  );
}

export default function ApplicationCard({
  job,
  stage,
  onView,
  onEdit,
  onDelete,
  onMove,
  onOpenPrep,
  dragListeners,
  dragAttributes,
  locked = false,
}) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  const [showMoveSelect, setShowMoveSelect] = useState(false);

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  const moveOptions = useMemo(() => STAGES.filter((s) => s !== stage), [stage]);

  const handleMoveChange = (e) => {
    const nextStage = e.target.value;
    if (!nextStage) { setShowMoveSelect(false); return; }
    if (onMove) onMove(job.id, stage, nextStage, job.pinnedId || null);
    setShowMoveSelect(false);
  };

  const accent = STAGE_ACCENT[stage] || '#888780';
  const badge  = STAGE_BADGE[stage]  || { bg: '#F1EFE8', color: '#5F5E5A' };

  // Prep button: only for Interviewing stage on on-platform jobs
  const showPrep = stage === 'Interviewing' && Boolean(job.jobId);

  return (
    <div style={{
      border: '0.5px solid rgba(0,0,0,0.09)',
      borderRadius: 12,
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      marginBottom: 10,
      overflow: 'hidden',
      position: 'relative',
      minWidth: 0,
      boxSizing: 'border-box',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>

      {/* Stage accent strip */}
      <div style={{ height: 3, background: accent, flexShrink: 0 }} />

      {/* Card body */}
      <div style={{ padding: '10px 12px 12px' }}>

        {/* Stage badge */}
        <div style={{
          display: 'inline-block',
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 20,
          background: badge.bg,
          color: badge.color,
          marginBottom: 6,
          letterSpacing: '0.02em',
        }}>
          {stage}
        </div>

        {/* Title */}
        <div style={{
          fontWeight: 600,
          fontSize: 13,
          color: '#112033',
          minWidth: 0,
          overflowWrap: 'anywhere',
          lineHeight: 1.3,
          marginBottom: 3,
        }}>
          {job.title}
        </div>

        {/* Company + location */}
        <div style={{ color: '#546E7A', fontSize: 12, minWidth: 0, overflowWrap: 'anywhere', marginBottom: 2 }}>
          {job.company}{job.location ? ` · ${job.location}` : ''}
        </div>

        {/* Date */}
        <div style={{ fontSize: 11, color: '#90A4AE', marginBottom: 10 }}>
          Added: {job.dateAdded}
        </div>

        {/* Action row */}
        <div style={{
          borderTop: '0.5px solid rgba(0,0,0,0.07)',
          paddingTop: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
        }}>

          {/* Left: move + view + edit + delete */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {locked ? (
              <div
                title="Managed by the recruiter — moves automatically with the job pipeline"
                style={{
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#90A4AE',
                  background: 'rgba(0,0,0,0.03)',
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </div>
            ) : isMobile ? (
              <>
                <IconBtn
                  onClick={() => setShowMoveSelect(prev => !prev)}
                  title="Move to stage"
                >
                  <FaExchangeAlt size={13} color="#FF7043" />
                </IconBtn>
                {showMoveSelect && (
                  <select
                    defaultValue=""
                    onChange={handleMoveChange}
                    onBlur={() => setShowMoveSelect(false)}
                    autoFocus
                    style={{
                      height: 30,
                      border: '0.5px solid rgba(0,0,0,0.12)',
                      borderRadius: 7,
                      background: 'white',
                      color: '#546E7A',
                      fontSize: 12,
                      padding: '0 8px',
                      maxWidth: 130,
                    }}
                  >
                    <option value="" disabled>Move to...</option>
                    {moveOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
              </>
            ) : (
              <div
                {...dragAttributes}
                {...dragListeners}
                title="Drag to move"
                aria-label="Drag to move"
                style={{
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grab',
                  color: '#FF7043',
                  fontSize: 16,
                  userSelect: 'none',
                  flexShrink: 0,
                }}
              >
                ↔
              </div>
            )}

            {onView && (
              <IconBtn onClick={() => onView(job, stage)} title="View details">
                {/* Eye icon — inline SVG so we don't need the whole fa bundle for 1 icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </IconBtn>
            )}

            <IconBtn onClick={() => onEdit(job, stage)} title="Edit notes">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </IconBtn>

            <IconBtn onClick={() => onDelete(job, stage)} title="Delete application" danger>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </IconBtn>
          </div>

          {/* Right: Interview Prep CTA — only on Interviewing + on-platform */}
          {showPrep && (
            <button
              onClick={() => onOpenPrep?.(job, stage)}
              title="Interview prep"
              aria-label="Open interview prep"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                fontWeight: 700,
                padding: '5px 10px',
                borderRadius: 8,
                border: '1px solid #FF7043',
                color: '#993C1D',
                background: '#FAECE7',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F5C4B3'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FAECE7'; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              Prep
            </button>
          )}
        </div>
      </div>
    </div>
  );
}