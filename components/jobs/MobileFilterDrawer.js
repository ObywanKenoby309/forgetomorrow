// components/jobs/MobileFilterDrawer.js
import React, { useEffect } from 'react';
import JobFilterPanel from './JobFilterPanel';

export default function MobileFilterDrawer({
  open,
  onClose,
  filterProps,
}) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(13,27,42,0.42)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 10,
          right: 10,
          zIndex: 51,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,247,243,0.96))',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderRadius: '26px 26px 0 0',
          padding: '0 18px calc(env(safe-area-inset-bottom, 18px) + 22px)',
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: '0 -18px 55px rgba(13,27,42,0.28)',
          border: '1px solid rgba(255,255,255,0.58)',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '13px 0 16px' }}>
          <div style={{
            width: 42,
            height: 5,
            borderRadius: 999,
            background: 'rgba(15,23,42,0.18)',
          }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
          gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: '#FF7043',
              marginBottom: 4,
            }}>
              Refine opportunities
            </div>
            <div style={{ fontWeight: 900, fontSize: 20, color: '#112033', letterSpacing: '-0.35px' }}>
              Filter Jobs
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            style={{
              background: 'rgba(15,23,42,0.07)',
              border: '1px solid rgba(15,23,42,0.08)',
              borderRadius: 999,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 20,
              color: '#546E7A',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <JobFilterPanel
          {...filterProps}
          mode="drawer"
          onApply={onClose}
        />
      </div>
    </>
  );
}
