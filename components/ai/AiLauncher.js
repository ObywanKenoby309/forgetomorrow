// components/ai/AiLauncher.js
import React, { useMemo, useState } from 'react';

const LABELS = {
  seeker: 'Seeker Buddy',
  coach: 'Coach Buddy',
  recruiter: 'Recruiter Buddy',
};

export default function AiLauncher({ allowedModes = [], onOpenMode, openCount = 0 }) {
  const [open, setOpen] = useState(false);

  const modes = useMemo(() => {
    const list = (allowedModes || []).map((m) => String(m || '').toLowerCase().trim());
    return list.filter(Boolean);
  }, [allowedModes]);

  if (!modes.length) return null;

  return (
    <div style={{ position: 'fixed', right: 18, bottom: 92, zIndex: 99998 }}>
      {open ? (
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 58,
            width: 210,
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
          <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.92)', marginBottom: 8 }}>
            AI Partners
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {modes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  onOpenMode?.(mode);
                  setOpen(false);
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
                  fontWeight: 800,
                }}
              >
                {LABELS[mode] || 'AI Buddy'}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="AI Partners"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 48,
          height: 48,
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.24)',
          background: 'rgba(17, 32, 51, 0.86)',
          color: '#fff',
          fontWeight: 900,
          fontSize: 14,
          cursor: 'pointer',
          position: 'relative',
          boxShadow: '0 12px 26px rgba(0,0,0,0.28)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        AI
        {openCount > 0 ? (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
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
            }}
          >
            {Math.min(openCount, 9)}
          </span>
        ) : null}
      </button>
    </div>
  );
}