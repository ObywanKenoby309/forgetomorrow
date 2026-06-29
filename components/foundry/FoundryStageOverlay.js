// components/foundry/FoundryStageOverlay.js
// Premium Stage mode overlay for solo commercial recording.
// Mounts over FoundryVideoGrid when stageMode && canManage.
// Provides: script editor, teleprompter scroll rail, speed control,
// mirror toggle, REC indicator, and Exit Stage.
//
// EXPANSION PATH (co-presenter): pass a `coPresenter` prop and
// render a second VideoTile beside the teleprompter rail.

import { useState, useEffect, useRef, useCallback } from 'react';

const ORANGE = '#FF7043';
const DARK = '#0b0d11';

// ─── Speed configs (px/sec scroll rate) ─────────────────────────────────────
const SPEEDS = [
  { id: 'slow',   label: 'Slow',   pxPerSec: 28 },
  { id: 'medium', label: 'Med',    pxPerSec: 52 },
  { id: 'fast',   label: 'Fast',   pxPerSec: 86 },
  { id: 'custom', label: 'Custom', pxPerSec: null },
];

const S = {
  root: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 50,
    pointerEvents: 'none', // pass through to video by default
    fontFamily: "'DM Sans', sans-serif",
  },

  // ── Top HUD ────────────────────────────────────────────────────────────────
  hud: {
    pointerEvents: 'all',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 18px',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, transparent 100%)',
    flexShrink: 0,
  },
  hudLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  stagePill: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,112,67,0.12)',
    border: '1px solid rgba(255,112,67,0.35)',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 11, fontWeight: 800, letterSpacing: '0.07em',
    color: ORANGE, textTransform: 'uppercase',
  },
  recDot: {
    width: 7, height: 7, borderRadius: '50%', background: '#c62828',
    animation: 'stagePulse 1.4s ease-in-out infinite',
  },
  recLabel: { fontSize: 10, color: '#ef9a9a', fontWeight: 700, letterSpacing: '0.05em' },
  hudRight: { display: 'flex', alignItems: 'center', gap: 8 },
  recBtn: (active) => ({
    pointerEvents: 'all',
    display: 'flex', alignItems: 'center', gap: 6,
    background: active ? 'rgba(198,40,40,0.18)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${active ? 'rgba(198,40,40,0.45)' : 'rgba(255,255,255,0.1)'}`,
    color: active ? '#ef9a9a' : '#bbb',
    cursor: 'pointer', borderRadius: 7, padding: '6px 13px',
    fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s',
  }),
  exitBtn: {
    pointerEvents: 'all',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#bbb', cursor: 'pointer', borderRadius: 7,
    padding: '6px 13px', fontSize: 11, fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
  },

  // ── Spacer (video fills middle) ────────────────────────────────────────────
  spacer: { flex: 1 },

  // ── Teleprompter rail ──────────────────────────────────────────────────────
  prompterWrap: {
    pointerEvents: 'all',
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 70%, transparent 100%)',
  },
  // top fade so text appears to scroll up from below
  prompterTopFade: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 48,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
    pointerEvents: 'none', zIndex: 2,
  },
  prompterScroll: {
    overflowY: 'hidden',
    padding: '12px 80px 0',
    // height controlled dynamically
  },
  prompterText: {
    fontSize: 26,
    lineHeight: 1.65,
    color: '#F0F0F0',
    fontWeight: 500,
    letterSpacing: '0.01em',
    userSelect: 'none',
    textAlign: 'center',
    paddingBottom: 60, // extra room so last line scrolls past center
  },
  // highlight the "active" line at center
  activeLine: {
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: 28,
  },

  // ── Prompter controls bar ──────────────────────────────────────────────────
  controls: {
    pointerEvents: 'all',
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 18px 14px',
    background: 'rgba(0,0,0,0.82)',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  ctrlGroup: { display: 'flex', alignItems: 'center', gap: 6 },
  ctrlLabel: { fontSize: 10, color: '#555', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 2 },
  ctrlBtn: (active) => ({
    background: active ? 'rgba(255,112,67,0.14)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${active ? 'rgba(255,112,67,0.4)' : 'rgba(255,255,255,0.08)'}`,
    color: active ? ORANGE : '#888',
    cursor: 'pointer', borderRadius: 6, padding: '5px 11px',
    fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.12s',
  }),
  playBtn: (rolling) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    background: rolling ? 'rgba(198,40,40,0.14)' : 'rgba(255,112,67,0.14)',
    border: `1px solid ${rolling ? 'rgba(198,40,40,0.4)' : 'rgba(255,112,67,0.4)'}`,
    color: rolling ? '#ef9a9a' : ORANGE,
    cursor: 'pointer', borderRadius: 7, padding: '7px 16px',
    fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s', minWidth: 80, justifyContent: 'center',
  }),
  resetBtn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#666', cursor: 'pointer', borderRadius: 6,
    padding: '5px 11px', fontSize: 11, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.12s',
  },
  customSpeedInput: {
    background: '#0d0f15',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#ddd', borderRadius: 6, padding: '5px 8px',
    fontSize: 11, width: 54, fontFamily: "'DM Sans', sans-serif",
  },
  divider: { width: 1, height: 20, background: 'rgba(255,255,255,0.07)', margin: '0 2px' },
  mirrorHint: { fontSize: 10, color: '#444', marginLeft: 'auto' },
  scriptToggle: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#777', cursor: 'pointer', borderRadius: 6,
    padding: '5px 11px', fontSize: 11, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
  },

  // ── Script editor drawer ───────────────────────────────────────────────────
  editorDrawer: {
    pointerEvents: 'all',
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    background: '#0d0f15',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px 16px 0 0',
    padding: '18px 20px 20px',
    boxShadow: '0 -16px 48px rgba(0,0,0,0.6)',
    display: 'flex', flexDirection: 'column', gap: 12,
    zIndex: 60,
  },
  editorHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  editorTitle: { fontSize: 13, fontWeight: 700, color: '#ddd' },
  editorClose: {
    background: 'none', border: 'none', color: '#666',
    cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1,
  },
  editorHint: { fontSize: 11, color: '#555', lineHeight: 1.5 },
  scriptTextarea: {
    background: '#090b11',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#ddd', fontSize: 13, lineHeight: 1.7,
    padding: '12px 14px', resize: 'none', height: 200,
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
  },
  editorFoot: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  primaryBtn: {
    background: ORANGE, border: 'none', color: '#111',
    borderRadius: 8, padding: '9px 16px', cursor: 'pointer',
    fontSize: 12, fontWeight: 800, fontFamily: "'DM Sans', sans-serif",
  },
  secondaryBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#ddd', borderRadius: 8, padding: '9px 14px',
    cursor: 'pointer', fontSize: 12, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
  },
};

// ─── Prompter height in px ───────────────────────────────────────────────────
const PROMPTER_HEIGHT = 180;

export default function FoundryStageOverlay({
  isRecording,
  onRecordToggle,
  onExitStage,
}) {
  // Script state
  const [scriptDraft, setScriptDraft] = useState('');
  const [scriptLines, setScriptLines] = useState([]);
  const [editorOpen, setEditorOpen] = useState(true); // open on first mount so user can paste script

  // Prompter state
  const [rolling, setRolling] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [speedId, setSpeedId] = useState('medium');
  const [customPx, setCustomPx] = useState(52);
  const [mirrored, setMirrored] = useState(false);

  const scrollRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const scrollYRef = useRef(0);

  // ── Computed speed ─────────────────────────────────────────────────────────
  const activePxPerSec = speedId === 'custom'
    ? (Number(customPx) || 52)
    : (SPEEDS.find(s => s.id === speedId)?.pxPerSec ?? 52);

  // ── Load script ─────────────────────────────────────────────────────────────
  const loadScript = useCallback(() => {
    const lines = scriptDraft
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    setScriptLines(lines);
    setScrollY(0);
    scrollYRef.current = 0;
    setRolling(false);
    setEditorOpen(false);
  }, [scriptDraft]);

  // ── Scroll animation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!rolling) {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }

    const tick = (timestamp) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const delta = (timestamp - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = timestamp;

      const el = scrollRef.current;
      const maxScroll = el ? el.scrollHeight - PROMPTER_HEIGHT : 0;

      scrollYRef.current = Math.min(scrollYRef.current + activePxPerSec * delta, maxScroll);
      setScrollY(scrollYRef.current);

      if (scrollYRef.current >= maxScroll) {
        setRolling(false);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [rolling, activePxPerSec]);

  // ── Sync scroll position to DOM ─────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = scrollY;
  }, [scrollY]);

  const handleReset = useCallback(() => {
    setRolling(false);
    setScrollY(0);
    scrollYRef.current = 0;
    lastTimeRef.current = null;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  const hasScript = scriptLines.length > 0;

  return (
    <div style={S.root}>
      {/* ── Top HUD ── */}
      <div style={S.hud}>
        <div style={S.hudLeft}>
          <div style={S.stagePill}>
            <span style={{ fontSize: 13 }}>◆</span>
            Foundry Stage
          </div>
          {isRecording && (
            <>
              <div style={S.recDot} />
              <span style={S.recLabel}>REC</span>
            </>
          )}
        </div>

        <div style={S.hudRight}>
          <button
            style={S.recBtn(isRecording)}
            onClick={onRecordToggle}
            aria-pressed={isRecording}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <span>{isRecording ? '⏹' : '⏺'}</span>
            {isRecording ? 'Stop Rec' : 'Record'}
          </button>
          <button
            style={S.exitBtn}
            onClick={onExitStage}
            aria-label="Exit Stage mode"
          >
            ✕ Exit Stage
          </button>
        </div>
      </div>

      {/* ── Video area (transparent — VideoGrid renders beneath) ── */}
      <div style={S.spacer} />

      {/* ── Teleprompter rail ── */}
      {hasScript && (
        <div style={{ ...S.prompterWrap, height: PROMPTER_HEIGHT }}>
          <div style={S.prompterTopFade} />
          <div
            ref={scrollRef}
            style={{
              ...S.prompterScroll,
              height: PROMPTER_HEIGHT,
              overflowY: 'hidden',
              transform: mirrored ? 'scaleX(-1)' : 'none',
            }}
          >
            <div style={S.prompterText}>
              {scriptLines.map((line, idx) => (
                <div key={idx} style={{ marginBottom: 6 }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Controls bar ── */}
      <div style={S.controls}>
        {/* Play / Pause */}
        <button
          style={S.playBtn(rolling)}
          onClick={() => setRolling(v => !v)}
          disabled={!hasScript}
          aria-label={rolling ? 'Pause teleprompter' : 'Start teleprompter'}
        >
          {rolling ? '⏸ Pause' : '▶ Roll'}
        </button>

        <button style={S.resetBtn} onClick={handleReset} disabled={!hasScript} aria-label="Reset teleprompter">
          ↩ Reset
        </button>

        <div style={S.divider} />

        {/* Speed */}
        <div style={S.ctrlGroup}>
          <span style={S.ctrlLabel}>Speed</span>
          {SPEEDS.filter(sp => sp.id !== 'custom').map(sp => (
            <button
              key={sp.id}
              style={S.ctrlBtn(speedId === sp.id)}
              onClick={() => setSpeedId(sp.id)}
            >
              {sp.label}
            </button>
          ))}
          <button
            style={S.ctrlBtn(speedId === 'custom')}
            onClick={() => setSpeedId('custom')}
          >
            Custom
          </button>
          {speedId === 'custom' && (
            <input
              type="number"
              style={S.customSpeedInput}
              value={customPx}
              min={8}
              max={200}
              onChange={e => setCustomPx(Number(e.target.value))}
              aria-label="Custom scroll speed px/sec"
              title="px / sec"
            />
          )}
        </div>

        <div style={S.divider} />

        {/* Mirror */}
        <button
          style={S.ctrlBtn(mirrored)}
          onClick={() => setMirrored(v => !v)}
          aria-pressed={mirrored}
          title="Mirror text horizontally (for teleprompter glass)"
        >
          ⇄ Mirror
        </button>

        {/* Script editor toggle */}
        <button
          style={{ ...S.scriptToggle, marginLeft: 'auto' }}
          onClick={() => setEditorOpen(v => !v)}
          aria-label="Edit script"
        >
          ✏ {hasScript ? 'Edit Script' : 'Load Script'}
        </button>
      </div>

      {/* ── Script editor drawer ── */}
      {editorOpen && (
        <div style={S.editorDrawer}>
          <div style={S.editorHead}>
            <span style={S.editorTitle}>Script Editor</span>
            <button style={S.editorClose} onClick={() => setEditorOpen(false)} aria-label="Close editor">×</button>
          </div>
          <p style={S.editorHint}>
            Paste your script below. Each line will appear as a separate cue on the teleprompter. Blank lines are ignored.
          </p>
          <textarea
            style={S.scriptTextarea}
            value={scriptDraft}
            onChange={e => setScriptDraft(e.target.value)}
            placeholder="Paste your script here…&#10;&#10;Each line becomes a separate cue.&#10;Blank lines are skipped."
            spellCheck={false}
            aria-label="Script text"
          />
          <div style={S.editorFoot}>
            <button style={S.secondaryBtn} onClick={() => setEditorOpen(false)}>Cancel</button>
            <button
              style={S.primaryBtn}
              onClick={loadScript}
              disabled={!scriptDraft.trim()}
            >
              Load to Prompter
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes stagePulse { 0%,100%{opacity:1} 50%{opacity:0.15} }
      `}</style>
    </div>
  );
}