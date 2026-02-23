// components/ai/AiLauncher.js
import React, { useMemo, useState } from 'react';

const LABELS = {
  seeker: 'Seeker Striker',
  coach: 'Coaching Striker',
  recruiter: 'Recruiter Striker',
};

const SUBTITLES = {
  seeker: 'Job search guidance & tools',
  coach: 'Coaching organization & resources',
  recruiter: 'Hiring, posting & team workflow',
};

const ICONS = {
  launcher: '/icons/the-striker.png',
  seeker: '/icons/seeker-ai.png',
  coach: '/icons/coach-ai.png',
  recruiter: '/icons/recruiter-ai.png',
};

// Per-brain accent colors — ties into ForgeTomorrow brand
const ACCENTS = {
  seeker: { bg: 'rgba(255,112,67,0.10)', border: 'rgba(255,112,67,0.30)', icon: '#FF7043' },
  coach: { bg: 'rgba(66,165,245,0.10)', border: 'rgba(66,165,245,0.30)', icon: '#42A5F5' },
  recruiter: { bg: 'rgba(102,187,106,0.10)', border: 'rgba(102,187,106,0.30)', icon: '#66BB6A' },
};

export default function AiLauncher({ allowedModes = [], onOpenMode, badgeCount = 0 }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);

  const modes = useMemo(() => {
    return (allowedModes || [])
      .map((m) => String(m || '').toLowerCase().trim())
      .filter(Boolean);
  }, [allowedModes]);

  if (!modes.length) return null;

  const showBadge = Number(badgeCount || 0) > 0;
  const badgeText = Math.min(Number(badgeCount || 0), 99);

  // Position left of the support floating button
  const SUPPORT_RIGHT = 16;
  const SUPPORT_BOTTOM = 16;
  const SUPPORT_SIZE = 42;
  const GAP = 10;
  const LAUNCHER_SIZE = 48;

  const launcherRight = SUPPORT_RIGHT + SUPPORT_SIZE + GAP;
  const launcherBottom = SUPPORT_BOTTOM;

  return (
    <div style={{ position: 'fixed', right: launcherRight, bottom: launcherBottom, zIndex: 99998 }}>

      {/* ── Striker card menu ── */}
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: LAUNCHER_SIZE + 12,
            width: 230,
            borderRadius: 16,
            border: '1px solid rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
            padding: '10px 8px',
            boxSizing: 'border-box',
          }}
        >
          {/* Header label */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: '#90A4AE',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '0 6px 8px',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              marginBottom: 8,
            }}
          >
            Strikers
          </div>

          {/* Brain cards */}
          <div style={{ display: 'grid', gap: 6 }}>
            {modes.map((mode) => {
              const iconSrc = ICONS[mode] || ICONS.launcher;
              const accent = ACCENTS[mode] || ACCENTS.seeker;
              const isHovered = hovered === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    onOpenMode?.(mode);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setHovered(mode)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    borderRadius: 12,
                    border: `1px solid ${isHovered ? accent.border : 'rgba(0,0,0,0.07)'}`,
                    background: isHovered ? accent.bg : 'rgba(248,250,252,0.80)',
                    color: '#112033',
                    padding: '10px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.15s ease',
                    boxShadow: isHovered ? '0 2px 10px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {/* Icon bubble */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: isHovered ? accent.bg : 'rgba(255,255,255,0.9)',
                      border: `1.5px solid ${isHovered ? accent.border : 'rgba(0,0,0,0.08)'}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: '0 0 auto',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <img
                      src={iconSrc}
                      alt=""
                      aria-hidden="true"
                      style={{
                        width: 24,
                        height: 24,
                        objectFit: 'contain',
                        borderRadius: 6,
                      }}
                    />
                  </div>

                  {/* Label + subtitle */}
                  <div style={{ display: 'grid', gap: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: isHovered ? '#112033' : '#263238',
                        lineHeight: 1.1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {LABELS[mode] || 'Striker'}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: isHovered ? accent.icon : '#90A4AE',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        transition: 'color 0.15s ease',
                      }}
                    >
                      {SUBTITLES[mode] || ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Launcher button ── */}
      <button
        type="button"
        aria-label={open ? 'Close Strikers' : 'Open Strikers'}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: LAUNCHER_SIZE,
          height: LAUNCHER_SIZE,
          borderRadius: 999,
          border: open
            ? '1.5px solid rgba(255,112,67,0.50)'
            : '1px solid rgba(255,255,255,0.24)',
          background: open
            ? 'rgba(255,255,255,0.96)'
            : 'rgba(17, 32, 51, 0.86)',
          cursor: 'pointer',
          position: 'relative',
          boxShadow: open
            ? '0 4px 18px rgba(255,112,67,0.22)'
            : '0 12px 26px rgba(0,0,0,0.28)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          transition: 'all 0.18s ease',
        }}
      >
        <img
          src={ICONS.launcher}
          alt=""
          aria-hidden="true"
          style={{
            width: 34,
            height: 34,
            objectFit: 'contain',
            borderRadius: 999,
            // ✅ subtle invert when open so icon stays visible on light bg
            filter: open ? 'none' : 'none',
          }}
        />

        {/* Unread badge */}
        {showBadge && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              padding: '0 5px',
              borderRadius: 999,
              background: '#FF7043',
              color: '#fff',
              fontSize: 11,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(17, 32, 51, 0.86)',
              boxSizing: 'border-box',
              lineHeight: 1,
            }}
          >
            {badgeText}
          </span>
        )}
      </button>
    </div>
  );
}