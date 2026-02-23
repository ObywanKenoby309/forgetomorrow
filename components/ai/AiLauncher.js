// components/ai/AiLauncher.js
import React, { useMemo, useState } from 'react';

const LABELS = {
  seeker: 'Seeker Striker',
  coach: 'Coaching Striker',
  recruiter: 'Recruiting Striker',
};

// public/icons/*
const ICONS = {
  launcher: '/icons/the-striker.png',
  seeker: '/icons/seeker-ai.png',
  coach: '/icons/coach-ai.png',
  recruiter: '/icons/recruiter-ai.png',
};

export default function AiLauncher({ allowedModes = [], onOpenMode, badgeCount = 0 }) {
  const [open, setOpen] = useState(false);

  const modes = useMemo(() => {
    const list = (allowedModes || []).map((m) => String(m || '').toLowerCase().trim());
    return list.filter(Boolean);
  }, [allowedModes]);

  if (!modes.length) return null;

  const showBadge = Number(badgeCount || 0) > 0;
  const badgeText = Math.min(Number(badgeCount || 0), 99);

  // ✅ Position the Striker button DOWN + LEFT of SupportFloatingButton
  // SupportFloatingButton is bottom-4/right-4 (≈16px) and is 42x42.
  // Our launcher is 48x48, so we offset to the LEFT by (42 + gap).
  const SUPPORT_RIGHT = 16;
  const SUPPORT_BOTTOM = 16;
  const SUPPORT_SIZE = 42;
  const GAP = 10;

  const LAUNCHER_SIZE = 48;

  const launcherRight = SUPPORT_RIGHT + SUPPORT_SIZE + GAP; // moves left of support
  const launcherBottom = SUPPORT_BOTTOM; // aligns vertically with support

  return (
    <div style={{ position: 'fixed', right: launcherRight, bottom: launcherBottom, zIndex: 99998 }}>
      {open ? (
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: LAUNCHER_SIZE + 10,
            width: 240,
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.22)',
            background: 'rgba(17, 32, 51, 0.78)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 14px 34px rgba(0,0,0,0.28)',
            padding: 10,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.92)', marginBottom: 8 }}>
            Strikers
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {modes.map((mode) => {
              const iconSrc = ICONS[mode] || ICONS.launcher;

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    onOpenMode?.(mode);
                    setOpen(false); // ✅ closes menu after selection
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.10)',
                    color: 'rgba(255,255,255,0.92)',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <img
                    src={iconSrc}
                    alt=""
                    aria-hidden="true"
                    style={{
                      width: 26,
                      height: 26,
                      objectFit: 'contain',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.86)',
                      border: '1px solid rgba(255,255,255,0.22)',
                      boxShadow: '0 10px 22px rgba(0,0,0,0.20)',
                      padding: 4,
                      boxSizing: 'border-box',
                      flex: '0 0 auto',
                    }}
                  />

                  <span style={{ lineHeight: 1.1 }}>{LABELS[mode] || 'Striker'}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Strikers"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: LAUNCHER_SIZE,
          height: LAUNCHER_SIZE,
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.24)',
          background: 'rgba(17, 32, 51, 0.86)',
          cursor: 'pointer',
          position: 'relative',
          boxShadow: '0 12px 26px rgba(0,0,0,0.28)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
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
          }}
        />

        {showBadge ? (
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
        ) : null}
      </button>
    </div>
  );
}