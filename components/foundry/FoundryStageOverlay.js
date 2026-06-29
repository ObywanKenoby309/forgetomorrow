// components/foundry/FoundryStageOverlay.js
// Premium Stage mode overlay for solo commercial recording.
// Mounts over FoundryVideoGrid when stageMode && canManage.
//
// Features:
//   - Branded cinematic frame around the video tile
//   - Lower-third name/title tag (editable)
//   - ForgeTomorrow logo watermark (top-right)
//   - Corner vignette
//   - Teleprompter scroll rail with speed control + mirror
//   - MediaRecorder local capture → downloads WebM to device
//   - Script editor drawer
//
// EXPANSION PATH (co-presenter): pass a `coPresenter` prop and
// render a second VideoTile beside the teleprompter rail.

import { useState, useEffect, useRef, useCallback } from 'react';

const ORANGE = '#FF7043';

// ─── Speed configs (px/sec scroll rate) ─────────────────────────────────────
const SPEEDS = [
  { id: 'slow',   label: 'Slow',   pxPerSec: 28 },
  { id: 'medium', label: 'Med',    pxPerSec: 52 },
  { id: 'fast',   label: 'Fast',   pxPerSec: 86 },
  { id: 'custom', label: 'Custom', pxPerSec: null },
];

const PROMPTER_HEIGHT = 180;

const S = {
  root: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 50,
    pointerEvents: 'none',
    fontFamily: "'DM Sans', sans-serif",
  },

  // ── Branded cinematic frame ────────────────────────────────────────────────
  // Inset border that frames the video like a produced shot
  frame: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 1,
    // Letterbox bars top + bottom (cinematic 2.35:1 feel without cropping)
    boxShadow: `
      inset 0 0 0 3px rgba(255,112,67,0.18),
      inset 0 0 60px rgba(0,0,0,0.45)
    `,
    borderRadius: 'inherit',
  },

  // Corner vignette — four absolute pseudo-gradients via box-shadow
  vignette: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 1,
    background: `
      radial-gradient(ellipse at top left,    rgba(0,0,0,0.55) 0%, transparent 55%),
      radial-gradient(ellipse at top right,   rgba(0,0,0,0.55) 0%, transparent 55%),
      radial-gradient(ellipse at bottom left, rgba(0,0,0,0.45) 0%, transparent 55%),
      radial-gradient(ellipse at bottom right,rgba(0,0,0,0.45) 0%, transparent 55%)
    `,
    borderRadius: 'inherit',
  },

  // ── FT logo watermark ─────────────────────────────────────────────────────
  watermark: {
    position: 'absolute',
    top: 18,
    right: 20,
    zIndex: 10,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    opacity: 0.72,
  },
  watermarkDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: ORANGE, flexShrink: 0,
  },
  watermarkText: {
    fontSize: 11, fontWeight: 800, color: '#fff',
    letterSpacing: '0.09em', textTransform: 'uppercase',
    textShadow: '0 1px 4px rgba(0,0,0,0.7)',
  },

  // ── Lower-third ───────────────────────────────────────────────────────────
  lowerThird: {
    position: 'absolute',
    bottom: PROMPTER_HEIGHT + 58, // sits just above the controls bar
    left: 28,
    zIndex: 10,
    pointerEvents: 'none',
  },
  lowerThirdInner: {
    display: 'inline-flex',
    flexDirection: 'column',
    gap: 2,
  },
  lowerAccent: {
    width: 3, position: 'absolute', left: -10, top: 0, bottom: 0,
    background: ORANGE, borderRadius: 2,
  },
  lowerName: {
    fontSize: 20, fontWeight: 800, color: '#fff',
    textShadow: '0 2px 8px rgba(0,0,0,0.8)',
    letterSpacing: '0.01em',
    lineHeight: 1.2,
  },
  lowerTitle: {
    fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.75)',
    textShadow: '0 1px 4px rgba(0,0,0,0.7)',
    letterSpacing: '0.02em',
  },

  // ── Top HUD ───────────────────────────────────────────────────────────────
  hud: {
    pointerEvents: 'all',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 18px',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, transparent 100%)',
    flexShrink: 0,
    zIndex: 20,
    position: 'relative',
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
  recTimer: { fontSize: 10, color: '#ef9a9a', fontVariantNumeric: 'tabular-nums' },
  hudRight: { display: 'flex', alignItems: 'center', gap: 8 },

  recBtn: (active) => ({
    pointerEvents: 'all',
    display: 'flex', alignItems: 'center', gap: 6,
    background: active ? 'rgba(198,40,40,0.22)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${active ? 'rgba(198,40,40,0.5)' : 'rgba(255,255,255,0.1)'}`,
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
  brandingBtn: {
    pointerEvents: 'all',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#777', cursor: 'pointer', borderRadius: 7,
    padding: '6px 11px', fontSize: 11, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
  },

  spacer: { flex: 1, zIndex: 2, position: 'relative' },

  // ── Teleprompter ──────────────────────────────────────────────────────────
  prompterWrap: {
    pointerEvents: 'all',
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 20,
    background: 'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.60) 70%, transparent 100%)',
  },
  prompterTopFade: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 48,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.60) 0%, transparent 100%)',
    pointerEvents: 'none', zIndex: 2,
  },
  prompterText: {
    fontSize: 26, lineHeight: 1.65, color: '#F0F0F0',
    fontWeight: 500, letterSpacing: '0.01em',
    userSelect: 'none', textAlign: 'center',
    paddingBottom: 60,
  },

  // ── Controls bar ──────────────────────────────────────────────────────────
  controls: {
    pointerEvents: 'all',
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 18px 14px',
    background: 'rgba(0,0,0,0.88)',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0, flexWrap: 'wrap',
    zIndex: 20, position: 'relative',
  },
  ctrlGroup: { display: 'flex', alignItems: 'center', gap: 6 },
  ctrlLabel: {
    fontSize: 10, color: '#555', fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 2,
  },
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
    fontFamily: "'DM Sans', sans-serif",
  },
  divider: { width: 1, height: 20, background: 'rgba(255,255,255,0.07)', margin: '0 2px' },
  customSpeedInput: {
    background: '#0d0f15',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#ddd', borderRadius: 6, padding: '5px 8px',
    fontSize: 11, width: 54, fontFamily: "'DM Sans', sans-serif",
  },
  scriptToggle: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#777', cursor: 'pointer', borderRadius: 6,
    padding: '5px 11px', fontSize: 11, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
  },

  // ── Script / Branding drawer ───────────────────────────────────────────────
  drawer: {
    pointerEvents: 'all',
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    background: '#0d0f15',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px 16px 0 0',
    padding: '18px 20px 20px',
    boxShadow: '0 -16px 48px rgba(0,0,0,0.65)',
    display: 'flex', flexDirection: 'column', gap: 12,
    zIndex: 60,
    maxHeight: '70vh', overflowY: 'auto',
  },
  drawerHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  drawerTitle: { fontSize: 13, fontWeight: 700, color: '#ddd' },
  drawerClose: {
    background: 'none', border: 'none', color: '#666',
    cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1,
  },
  drawerHint: { fontSize: 11, color: '#555', lineHeight: 1.5 },
  fieldLabel: {
    fontSize: 10, color: '#666', fontWeight: 700,
    letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4,
    display: 'block',
  },
  fieldInput: {
    background: '#090b11', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, color: '#ddd', fontSize: 13,
    padding: '9px 12px', width: '100%', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
  },
  scriptTextarea: {
    background: '#090b11', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#ddd', fontSize: 13, lineHeight: 1.7,
    padding: '12px 14px', resize: 'none', height: 180,
    fontFamily: "'DM Sans', sans-serif", outline: 'none', width: '100%',
    boxSizing: 'border-box',
  },
  drawerFoot: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  primaryBtn: {
    background: ORANGE, border: 'none', color: '#111',
    borderRadius: 8, padding: '9px 16px', cursor: 'pointer',
    fontSize: 12, fontWeight: 800, fontFamily: "'DM Sans', sans-serif",
  },
  secondaryBtn: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#ddd', borderRadius: 8, padding: '9px 14px',
    cursor: 'pointer', fontSize: 12, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
  },

  // ── Download toast ────────────────────────────────────────────────────────
  toast: {
    position: 'absolute', bottom: 80, left: '50%',
    transform: 'translateX(-50%)',
    background: '#141720', border: '1px solid rgba(255,112,67,0.3)',
    borderRadius: 10, padding: '12px 20px',
    fontSize: 12, color: '#ddd', zIndex: 80,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    pointerEvents: 'none', whiteSpace: 'nowrap',
    fontFamily: "'DM Sans', sans-serif",
  },
};

// ─── Recording timer helper ──────────────────────────────────────────────────
function useRecTimer(active) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);
  useEffect(() => {
    if (active) {
      startRef.current = Date.now() - elapsed * 1000;
      const id = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
      return () => clearInterval(id);
    } else {
      setElapsed(0);
    }
  }, [active]);
  const pad = (n) => String(n).padStart(2, '0');
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return `${pad(m)}:${pad(s)}`;
}

export default function FoundryStageOverlay({
  callObject,
  presenterName = 'Eric James',
  presenterTitle = 'Founder & CEO, ForgeTomorrow',
  onExitStage,
}) {
  // ── Branding ──────────────────────────────────────────────────────────────
  const [showLowerThird, setShowLowerThird] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [nameVal, setNameVal] = useState(presenterName);
  const [titleVal, setTitleVal] = useState(presenterTitle);

  // ── Local recording (MediaRecorder) ───────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recError, setRecError] = useState('');
  const [toast, setToast] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recTimer = useRecTimer(isRecording);

  const showToast = useCallback((msg, durationMs = 3500) => {
    setToast(msg);
    setTimeout(() => setToast(''), durationMs);
  }, []);

  const startLocalRecording = useCallback(async () => {
    setRecError('');
    try {
      // Grab the video track directly from Daily's call object
      let stream = null;

      if (callObject) {
        const localParticipant = callObject.participants?.()?.local;
        const videoTrack =
          localParticipant?.tracks?.video?.persistentTrack ||
          localParticipant?.videoTrack ||
          null;
        const audioTrack =
          localParticipant?.tracks?.audio?.persistentTrack ||
          localParticipant?.audioTrack ||
          null;

        if (videoTrack || audioTrack) {
          const tracks = [videoTrack, audioTrack].filter(Boolean);
          stream = new MediaStream(tracks);
        }
      }

      // Fallback: getUserMedia directly
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }

      // Pick best supported format
      const mimeType = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ].find(t => MediaRecorder.isTypeSupported(t)) || '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        anchor.href = url;
        anchor.download = `ForgeTomorrow-Stage-${timestamp}.webm`;
        anchor.click();
        URL.revokeObjectURL(url);
        showToast('✅ Recording saved to your Downloads folder');
        chunksRef.current = [];
      };

      recorder.onerror = (e) => {
        setRecError(e?.error?.message || 'Recording error');
        setIsRecording(false);
      };

      recorder.start(1000); // collect chunks every 1s
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      showToast('⏺ Recording started — camera + mic captured locally');
    } catch (err) {
      setRecError(err?.message || 'Could not start recording');
    }
  }, [callObject, showToast]);

  const stopLocalRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    setIsRecording(false);
  }, []);

  const handleRecordToggle = useCallback(() => {
    if (isRecording) {
      stopLocalRecording();
    } else {
      startLocalRecording();
    }
  }, [isRecording, startLocalRecording, stopLocalRecording]);

  // Stop recording if overlay unmounts
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop();
      }
    };
  }, []);

  // ── Teleprompter ──────────────────────────────────────────────────────────
  const [scriptDraft, setScriptDraft] = useState('');
  const [scriptLines, setScriptLines] = useState([]);
  const [rolling, setRolling] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [speedId, setSpeedId] = useState('medium');
  const [customPx, setCustomPx] = useState(52);
  const [mirrored, setMirrored] = useState(false);

  const scrollRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const scrollYRef = useRef(0);

  const activePxPerSec = speedId === 'custom'
    ? (Number(customPx) || 52)
    : (SPEEDS.find(sp => sp.id === speedId)?.pxPerSec ?? 52);

  // ── Drawer mode: 'none' | 'script' | 'branding' ──────────────────────────
  const [drawer, setDrawer] = useState('script'); // open on mount

  const loadScript = useCallback(() => {
    const lines = scriptDraft.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    setScriptLines(lines);
    setScrollY(0);
    scrollYRef.current = 0;
    setRolling(false);
    setDrawer('none');
  }, [scriptDraft]);

  useEffect(() => {
    if (!rolling) {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }
    const tick = (timestamp) => {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      const el = scrollRef.current;
      const maxScroll = el ? el.scrollHeight - PROMPTER_HEIGHT : 0;
      scrollYRef.current = Math.min(scrollYRef.current + activePxPerSec * delta, maxScroll);
      setScrollY(scrollYRef.current);
      if (scrollYRef.current >= maxScroll) { setRolling(false); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [rolling, activePxPerSec]);

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

      {/* ── Branded frame + vignette (pointer-events: none, purely visual) ── */}
      <div style={S.frame} />
      <div style={S.vignette} />

      {/* ── FT watermark ── */}
      {showWatermark && (
        <div style={S.watermark}>
          <div style={S.watermarkDot} />
          <span style={S.watermarkText}>ForgeTomorrow</span>
        </div>
      )}

      {/* ── Lower-third ── */}
      {showLowerThird && (nameVal || titleVal) && (
        <div style={{ ...S.lowerThird, bottom: hasScript ? PROMPTER_HEIGHT + 58 : 70 }}>
          <div style={{ position: 'relative', paddingLeft: 14 }}>
            <div style={S.lowerAccent} />
            <div style={S.lowerThirdInner}>
              {nameVal && <span style={S.lowerName}>{nameVal}</span>}
              {titleVal && <span style={S.lowerTitle}>{titleVal}</span>}
            </div>
          </div>
        </div>
      )}

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
              <span style={S.recTimer}>{recTimer}</span>
            </>
          )}
          {recError && (
            <span style={{ fontSize: 10, color: '#ef5350' }}>{recError}</span>
          )}
        </div>

        <div style={S.hudRight}>
          <button
            style={S.brandingBtn}
            onClick={() => setDrawer(d => d === 'branding' ? 'none' : 'branding')}
            aria-label="Edit branding"
            title="Edit lower-third and watermark"
          >
            🎨 Branding
          </button>
          <button
            style={S.recBtn(isRecording)}
            onClick={handleRecordToggle}
            aria-pressed={isRecording}
            aria-label={isRecording ? 'Stop recording' : 'Start local recording'}
          >
            <span>{isRecording ? '⏹' : '⏺'}</span>
            {isRecording ? `Stop · ${recTimer}` : 'Record'}
          </button>
          <button style={S.exitBtn} onClick={onExitStage} aria-label="Exit Stage mode">
            ✕ Exit Stage
          </button>
        </div>
      </div>

      {/* ── Video area spacer ── */}
      <div style={S.spacer} />

      {/* ── Teleprompter rail ── */}
      {hasScript && (
        <div style={{ ...S.prompterWrap, height: PROMPTER_HEIGHT }}>
          <div style={S.prompterTopFade} />
          <div
            ref={scrollRef}
            style={{
              overflowY: 'hidden',
              padding: '12px 80px 0',
              height: PROMPTER_HEIGHT,
              transform: mirrored ? 'scaleX(-1)' : 'none',
            }}
          >
            <div style={S.prompterText}>
              {scriptLines.map((line, idx) => (
                <div key={idx} style={{ marginBottom: 6 }}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Controls bar ── */}
      <div style={S.controls}>
        <button
          style={S.playBtn(rolling)}
          onClick={() => setRolling(v => !v)}
          disabled={!hasScript}
          aria-label={rolling ? 'Pause teleprompter' : 'Start teleprompter'}
        >
          {rolling ? '⏸ Pause' : '▶ Roll'}
        </button>

        <button style={S.resetBtn} onClick={handleReset} disabled={!hasScript}>
          ↩ Reset
        </button>

        <div style={S.divider} />

        <div style={S.ctrlGroup}>
          <span style={S.ctrlLabel}>Speed</span>
          {SPEEDS.filter(sp => sp.id !== 'custom').map(sp => (
            <button key={sp.id} style={S.ctrlBtn(speedId === sp.id)} onClick={() => setSpeedId(sp.id)}>
              {sp.label}
            </button>
          ))}
          <button style={S.ctrlBtn(speedId === 'custom')} onClick={() => setSpeedId('custom')}>Custom</button>
          {speedId === 'custom' && (
            <input
              type="number"
              style={S.customSpeedInput}
              value={customPx}
              min={8} max={200}
              onChange={e => setCustomPx(Number(e.target.value))}
              title="px / sec"
            />
          )}
        </div>

        <div style={S.divider} />

        <button style={S.ctrlBtn(mirrored)} onClick={() => setMirrored(v => !v)} title="Mirror text for teleprompter glass">
          ⇄ Mirror
        </button>

        <button
          style={{ ...S.scriptToggle, marginLeft: 'auto' }}
          onClick={() => setDrawer(d => d === 'script' ? 'none' : 'script')}
        >
          ✏ {hasScript ? 'Edit Script' : 'Load Script'}
        </button>
      </div>

      {/* ── Script drawer ── */}
      {drawer === 'script' && (
        <div style={S.drawer}>
          <div style={S.drawerHead}>
            <span style={S.drawerTitle}>Script Editor</span>
            <button style={S.drawerClose} onClick={() => setDrawer('none')}>×</button>
          </div>
          <p style={S.drawerHint}>
            Paste your script. Each line becomes a separate cue. Blank lines are ignored.
          </p>
          <textarea
            style={S.scriptTextarea}
            value={scriptDraft}
            onChange={e => setScriptDraft(e.target.value)}
            placeholder={"Paste your script here…\n\nEach line becomes a cue.\nBlank lines are skipped."}
            spellCheck={false}
          />
          <div style={S.drawerFoot}>
            <button style={S.secondaryBtn} onClick={() => setDrawer('none')}>Cancel</button>
            <button style={S.primaryBtn} onClick={loadScript} disabled={!scriptDraft.trim()}>
              Load to Prompter
            </button>
          </div>
        </div>
      )}

      {/* ── Branding drawer ── */}
      {drawer === 'branding' && (
        <div style={S.drawer}>
          <div style={S.drawerHead}>
            <span style={S.drawerTitle}>Stage Branding</span>
            <button style={S.drawerClose} onClick={() => setDrawer('none')}>×</button>
          </div>
          <p style={S.drawerHint}>
            Customize the lower-third and watermark that appear on your recording.
          </p>

          <div>
            <label style={S.fieldLabel}>Name (lower-third)</label>
            <input style={S.fieldInput} value={nameVal} onChange={e => setNameVal(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label style={S.fieldLabel}>Title (lower-third)</label>
            <input style={S.fieldInput} value={titleVal} onChange={e => setTitleVal(e.target.value)} placeholder="Your title or company" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12, color: '#ccc' }}>
              <input
                type="checkbox"
                checked={showLowerThird}
                onChange={e => setShowLowerThird(e.target.checked)}
                style={{ accentColor: ORANGE, width: 14, height: 14 }}
              />
              Show lower-third name tag
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12, color: '#ccc' }}>
              <input
                type="checkbox"
                checked={showWatermark}
                onChange={e => setShowWatermark(e.target.checked)}
                style={{ accentColor: ORANGE, width: 14, height: 14 }}
              />
              Show ForgeTomorrow watermark
            </label>
          </div>

          <div style={S.drawerFoot}>
            <button style={S.primaryBtn} onClick={() => setDrawer('none')}>Done</button>
          </div>
        </div>
      )}

      {/* ── Download toast ── */}
      {toast && <div style={S.toast}>{toast}</div>}

      <style>{`
        @keyframes stagePulse { 0%,100%{opacity:1} 50%{opacity:0.15} }
      `}</style>
    </div>
  );
}