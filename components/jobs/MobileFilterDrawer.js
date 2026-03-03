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
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 51,
          background: 'rgba(244,246,248,0.98)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '20px 20px 0 0',
          padding: '0 20px 40px',
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.20)',
          border: '1px solid rgba(255,255,255,0.30)',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 16px' }}>
          <div style={{
            width: 40, height: 4, borderRadius: 999,
            background: 'rgba(0,0,0,0.18)',
          }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 20,
        }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#112033' }}>
            Filter Jobs
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.07)',
              border: 'none',
              borderRadius: 999,
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 18, color: '#546E7A',
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