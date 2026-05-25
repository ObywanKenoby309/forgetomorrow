// components/foundry/FoundryTopBar.js
import { useState, useEffect, useRef } from 'react';

const S = {
  bar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '9px 16px', background: 'rgba(255,255,255,0.025)',
    borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
    fontFamily: "'DM Sans', sans-serif",
  },
  left: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 },
  chip: {
    background: 'rgba(255,112,67,0.15)', border: '1px solid rgba(255,112,67,0.3)',
    color: '#FF7043', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
    padding: '3px 8px', borderRadius: 5, textTransform: 'uppercase', flexShrink: 0,
  },
  title: {
    fontSize: 14, fontWeight: 600, color: '#f0f0f0',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 340,
  },
  meta: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  timer: { fontSize: 12, color: '#555', fontVariantNumeric: 'tabular-nums' },
  recPill: { display: 'flex', alignItems: 'center', gap: 4 },
  recDot: { width: 6, height: 6, background: '#c62828', borderRadius: '50%' },
  recTxt: { fontSize: 10, color: '#666' },
  encPill: { display: 'flex', alignItems: 'center', gap: 3, color: '#444', fontSize: 10 },
  right: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, position: 'relative' },
  viewBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    color: '#999', cursor: 'pointer', fontSize: 11, fontWeight: 500,
    padding: '5px 10px', borderRadius: 6, transition: 'all 0.15s',
    fontFamily: "'DM Sans', sans-serif",
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
    background: '#141720', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 9, padding: 5, minWidth: 190, zIndex: 200,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  dSection: {
    padding: '4px 8px 3px', fontSize: 9, color: '#3a3a3a',
    textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginTop: 2,
  },
  dItem: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
    borderRadius: 6, cursor: 'pointer', color: '#888', fontSize: 12,
    border: 'none', background: 'none', width: '100%', textAlign: 'left',
    fontFamily: "'DM Sans', sans-serif", transition: 'background 0.12s',
  },
  dDivider: { border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '4px 0' },
  settingsBtn: {
    background: 'none', border: 'none', color: '#555', cursor: 'pointer',
    fontSize: 15, padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center',
    transition: 'all 0.15s',
  },
};

const VIEW_OPTIONS = [
  { id: 'grid', label: 'Grid view', icon: '⊞' },
  { id: 'speaker', label: 'Speaker view', icon: '▣' },
  { id: 'focus', label: 'Focus view', icon: '⛶' },
  { id: 'presentation', label: 'Presentation view', icon: '▤' },
];

const INTERFACE_OPTIONS = [
  { id: 'sidebar', label: 'Hide sidebar', icon: '◫' },
  { id: 'compact', label: 'Compact view', icon: '⊟' },
];

export default function FoundryTopBar({
  sessionTitle, isRecording, startTime, activeView, onViewChange,
  sidebarHidden, onToggleSidebar, compact, onToggleCompact,
}) {
  const [open, setOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);

  // Live timer
  useEffect(() => {
    if (!startTime) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const timerStr = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;

  return (
    <div style={S.bar}>
      <div style={S.left}>
        <span style={S.chip}>Foundry</span>
        <span style={S.title}>{sessionTitle}</span>
      </div>

      <div style={S.meta}>
        {isRecording && (
          <div style={S.recPill}>
            <div style={{ ...S.recDot, animation: 'foundryPulse 1.4s ease-in-out infinite' }} />
            <span style={S.recTxt}>REC</span>
          </div>
        )}
        <span style={S.timer}>{timerStr}</span>
        <div style={S.encPill}>
          <svg width="10" height="11" viewBox="0 0 10 11" fill="none" aria-hidden="true">
            <rect x="1" y="5" width="8" height="6" rx="1" stroke="#444" strokeWidth="1"/>
            <path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke="#444" strokeWidth="1"/>
          </svg>
          <span>Encrypted</span>
        </div>
      </div>

      <div style={S.right} ref={ref}>
        <button
          style={S.viewBtn}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label="View options"
        >
          <span style={{ fontSize: 13 }}>⊞</span>
          <span>View</span>
          <span style={{ fontSize: 10, color: '#555', transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▾</span>
        </button>

        <button
          style={S.settingsBtn}
          aria-label="Foundry settings"
          title="Settings"
          onClick={() => {}}
        >
          ⚙
        </button>

        {open && (
          <div style={S.dropdown} role="menu">
            <div style={S.dSection}>Layout</div>
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                style={{
                  ...S.dItem,
                  color: activeView === opt.id ? '#FF7043' : '#888',
                  background: activeView === opt.id ? 'rgba(255,112,67,0.06)' : 'none',
                }}
                role="menuitem"
                onClick={() => { onViewChange(opt.id); setOpen(false); }}
              >
                <span style={{ width: 16, textAlign: 'center' }}>{opt.icon}</span>
                {opt.label}
                {activeView === opt.id && <span style={{ marginLeft: 'auto', color: '#FF7043', fontSize: 10 }}>✓</span>}
              </button>
            ))}
            <hr style={S.dDivider} />
            <div style={S.dSection}>Interface</div>
            <button
              style={{ ...S.dItem, color: sidebarHidden ? '#FF7043' : '#888' }}
              role="menuitem"
              onClick={() => { onToggleSidebar(); setOpen(false); }}
            >
              <span style={{ width: 16 }}>◫</span>
              {sidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
              {sidebarHidden && <span style={{ marginLeft: 'auto', color: '#FF7043', fontSize: 10 }}>✓</span>}
            </button>
            <button
              style={{ ...S.dItem, color: compact ? '#FF7043' : '#888' }}
              role="menuitem"
              onClick={() => { onToggleCompact(); setOpen(false); }}
            >
              <span style={{ width: 16 }}>⊟</span>
              Compact view
              {compact && <span style={{ marginLeft: 'auto', color: '#FF7043', fontSize: 10 }}>✓</span>}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes foundryPulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
      `}</style>
    </div>
  );
}
