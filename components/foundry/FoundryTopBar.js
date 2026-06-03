// components/foundry/FoundryTopBar.js
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

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
    background: 'none', border: 'none', color: '#777', cursor: 'pointer',
    fontSize: 15, padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center',
    transition: 'all 0.15s',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', zIndex: 9998,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    fontFamily: "'DM Sans', sans-serif",
  },
  modal: {
    width: 'min(520px, 96vw)', background: '#11141c', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14, boxShadow: '0 18px 60px rgba(0,0,0,0.55)', overflow: 'hidden', color: '#eee',
  },
  modalHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  modalTitle: { fontSize: 15, fontWeight: 700, color: '#f3f3f3' },
  closeBtn: { background: 'none', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer' },
  modalBody: { padding: 16, display: 'grid', gap: 12 },
  label: { fontSize: 11, color: '#aaa', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' },
  select: {
    width: '100%', background: '#090b11', border: '1px solid rgba(255,255,255,0.12)',
    color: '#eee', borderRadius: 9, padding: '10px 11px', fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
  },
  note: {
    background: 'rgba(255,112,67,0.08)', border: '1px solid rgba(255,112,67,0.2)',
    borderRadius: 10, padding: 10, color: '#c9c9c9', fontSize: 12, lineHeight: 1.5,
  },
  checkboxRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    color: '#c9c9c9', fontSize: 12, lineHeight: 1.5,
  },
  checkbox: { width: 14, height: 14, accentColor: '#FF7043', cursor: 'pointer' },
  error: {
    background: 'rgba(198,40,40,0.12)', border: '1px solid rgba(198,40,40,0.28)',
    borderRadius: 9, padding: 10, color: '#ffcdd2', fontSize: 12,
  },
  modalFoot: {
    display: 'flex', justifyContent: 'flex-end', gap: 8,
    padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  secondaryBtn: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#ddd', borderRadius: 8, padding: '9px 12px', cursor: 'pointer',
    fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
  },
  primaryBtn: {
    background: '#FF7043', border: 'none', color: '#111', borderRadius: 8,
    padding: '9px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 800,
    fontFamily: "'DM Sans', sans-serif",
  },
};

const VIEW_OPTIONS = [
  { id: 'grid', label: 'Grid view', icon: '⊞' },
  { id: 'speaker', label: 'Speaker view', icon: '▣' },
  { id: 'focus', label: 'Focus view', icon: '⛶' },
  { id: 'presentation', label: 'Presentation view', icon: '▤' },
];


const FOUNDER_USER_ID = 'cmivpwcf90009bvz0xnck0acv';
const FOUNDER_EMAIL = 'eric.james@forgetomorrow.com';

const PUBLIC_BACKGROUND_OPTIONS = [
  { id: 'none', label: 'None', type: 'none' },
  { id: 'blur', label: 'Blur', type: 'blur' },
  { id: 'forge-office', label: 'Forge Office', type: 'image', src: '/backgrounds/foundry/forge-office.jpg' },
  { id: 'coaching-library', label: 'Coaching Library', type: 'image', src: '/backgrounds/foundry/coaching-library.jpg' },
  { id: 'coaching-strategy-room', label: 'Coaching Strategy Room', type: 'image', src: '/backgrounds/foundry/coaching-strategy-room.jpg' },
  { id: 'forge-floor', label: 'Forge Floor', type: 'image', src: '/backgrounds/foundry/forge-floor.jpg' },
  { id: 'neutral-professional', label: 'Neutral Professional', type: 'image', src: '/backgrounds/foundry/neutral-professional.jpg' },
];

const FOUNDER_BACKGROUND_OPTION = {
  id: 'founder-office',
  label: 'Founder Office',
  type: 'image',
  src: '/backgrounds/foundry/founder-office.jpg',
};

function isFounderSession(user) {
  return user?.id === FOUNDER_USER_ID || String(user?.email || '').toLowerCase() === FOUNDER_EMAIL;
}

function backgroundSource(path) {
  if (!path) return '';
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}

function backgroundOptionsFor(isFounder) {
  return isFounder ? [...PUBLIC_BACKGROUND_OPTIONS, FOUNDER_BACKGROUND_OPTION] : PUBLIC_BACKGROUND_OPTIONS;
}

async function applyFoundryBackground(callObject, backgroundId, options) {
  if (!callObject?.updateInputSettings) return;

  const background = options.find((opt) => opt.id === backgroundId) || PUBLIC_BACKGROUND_OPTIONS[0];

  if (background.type === 'blur') {
    await callObject.updateInputSettings({
      video: {
        processor: {
          type: 'background-blur',
          config: { strength: 1 },
        },
      },
    });
    return;
  }

  if (background.type === 'image' && background.src) {
    await callObject.updateInputSettings({
      video: {
        processor: {
          type: 'background-image',
          config: { source: backgroundSource(background.src) },
        },
      },
    });
    return;
  }

  await callObject.updateInputSettings({
    video: {
      processor: { type: 'none' },
    },
  });
}

export default function FoundryTopBar({
  sessionTitle, isRecording, startTime, activeView, onViewChange,
  sidebarHidden, onToggleSidebar, compact, onToggleCompact,
  callObject = null,
  selectedBackground = 'none',
  onBackgroundChange,
  isFounder = false,
}) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [devices, setDevices] = useState([]);
  const [cameraId, setCameraId] = useState('');
  const [micId, setMicId] = useState('');
  const [speakerId, setSpeakerId] = useState('');
  const [deviceError, setDeviceError] = useState('');
  const [savingDevices, setSavingDevices] = useState(false);
  const [backgroundError, setBackgroundError] = useState('');
  const [rememberBackground, setRememberBackground] = useState(false);
  const ref = useRef(null);

  const cameras = devices.filter((d) => d.kind === 'videoinput');
  const microphones = devices.filter((d) => d.kind === 'audioinput');
  const speakers = devices.filter((d) => d.kind === 'audiooutput');
  const availableBackgroundOptions = useMemo(() => backgroundOptionsFor(isFounder), [isFounder]);

  const loadDevices = useCallback(async () => {
    setDeviceError('');
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      setDeviceError('Device settings are not available in this browser.');
      return;
    }

    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list);

      const firstCamera = list.find((d) => d.kind === 'videoinput');
      const firstMic = list.find((d) => d.kind === 'audioinput');
      const firstSpeaker = list.find((d) => d.kind === 'audiooutput');

      setCameraId((prev) => prev || firstCamera?.deviceId || '');
      setMicId((prev) => prev || firstMic?.deviceId || '');
      setSpeakerId((prev) => prev || firstSpeaker?.deviceId || '');
    } catch (err) {
      setDeviceError(err?.message || 'Could not load camera and microphone devices.');
    }
  }, []);

  const openSettings = useCallback(() => {
    setOpen(false);
    setSettingsOpen(true);
    setBackgroundError('');
    loadDevices();
  }, [loadDevices]);


  const handleBackgroundSelect = useCallback((backgroundId) => {
    setBackgroundError('');
    const allowed = availableBackgroundOptions.some((opt) => opt.id === backgroundId);
    const safeBackground = allowed ? backgroundId : 'none';
    onBackgroundChange?.(safeBackground);
  }, [availableBackgroundOptions, onBackgroundChange]);

  const saveBackgroundPreference = useCallback(async (backgroundId) => {
    const res = await fetch('/api/foundry/background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ background: backgroundId }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not save background preference.');
    return data;
  }, []);

  useEffect(() => {
    if (!callObject) return;
    applyFoundryBackground(callObject, selectedBackground, availableBackgroundOptions).catch((err) => {
      console.error('[foundry] background apply failed:', err);
      setBackgroundError(err?.message || 'Could not apply background.');
    });
  }, [callObject, selectedBackground, availableBackgroundOptions]);

  const applyDeviceSettings = useCallback(async () => {
    setSavingDevices(true);
    setDeviceError('');

    try {
      if (!callObject) {
        throw new Error('Foundry video is still connecting. Try again in a moment.');
      }

      if (callObject.setInputDevicesAsync) {
        await callObject.setInputDevicesAsync({
          audioDeviceId: micId || undefined,
          videoDeviceId: cameraId || undefined,
        });
      } else if (callObject.setInputDevices) {
        await callObject.setInputDevices({
          audioDeviceId: micId || undefined,
          videoDeviceId: cameraId || undefined,
        });
      }

      if (speakerId && speakerId !== 'default') {
        const outputDevices = await navigator.mediaDevices.enumerateDevices();
        const validOutputDevice = outputDevices.some(
          (device) => device.kind === 'audiooutput' && device.deviceId === speakerId
        );

        if (validOutputDevice) {
          if (callObject.setOutputDeviceAsync) {
            await callObject.setOutputDeviceAsync(speakerId);
          } else if (callObject.setOutputDevice) {
            await callObject.setOutputDevice(speakerId);
          }
        }
      }

      await applyFoundryBackground(callObject, selectedBackground, availableBackgroundOptions);

      if (rememberBackground) {
        await saveBackgroundPreference(selectedBackground);
      }

      setSettingsOpen(false);
    } catch (err) {
      setDeviceError(err?.message || 'Could not apply device settings.');
    } finally {
      setSavingDevices(false);
    }
  }, [callObject, cameraId, micId, speakerId, selectedBackground, availableBackgroundOptions, rememberBackground, saveBackgroundPreference]);

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
          onClick={openSettings}
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

      {settingsOpen && (
        <div style={S.overlay} role="dialog" aria-modal="true" aria-label="Foundry device settings">
          <div style={S.modal}>
            <div style={S.modalHead}>
              <div style={S.modalTitle}>Foundry Settings</div>
              <button type="button" style={S.closeBtn} onClick={() => setSettingsOpen(false)} aria-label="Close settings">×</button>
            </div>

            <div style={S.modalBody}>
              {deviceError && <div style={S.error}>{deviceError}</div>}
              {backgroundError && <div style={S.error}>{backgroundError}</div>}

              <div>
                <div style={S.label}>Camera</div>
                <select style={S.select} value={cameraId} onChange={(e) => setCameraId(e.target.value)}>
                  {cameras.length === 0 ? <option value="">Default camera</option> : null}
                  {cameras.map((device, index) => (
                    <option key={device.deviceId || `camera-${index}`} value={device.deviceId}>
                      {device.label || `Camera ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={S.label}>Microphone</div>
                <select style={S.select} value={micId} onChange={(e) => setMicId(e.target.value)}>
                  {microphones.length === 0 ? <option value="">Default microphone</option> : null}
                  {microphones.map((device, index) => (
                    <option key={device.deviceId || `mic-${index}`} value={device.deviceId}>
                      {device.label || `Microphone ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={S.label}>Speaker</div>
                <select style={S.select} value={speakerId} onChange={(e) => setSpeakerId(e.target.value)}>
                  {speakers.length === 0 ? <option value="">Default speaker</option> : null}
                  {speakers.map((device, index) => (
                    <option key={device.deviceId || `speaker-${index}`} value={device.deviceId}>
                      {device.label || `Speaker ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={S.label}>Background</div>
                <select style={S.select} value={selectedBackground} onChange={(e) => handleBackgroundSelect(e.target.value)}>
                  {availableBackgroundOptions.map((background) => (
                    <option key={background.id} value={background.id}>{background.label}</option>
                  ))}
                </select>
              </div>

              <label style={S.checkboxRow}>
                <input
                  type="checkbox"
                  style={S.checkbox}
                  checked={rememberBackground}
                  onChange={(e) => setRememberBackground(e.target.checked)}
                />
                Remember this background for future Foundries
              </label>

              <div style={S.note}>
                Background effects apply to your local camera only. Blur and image replacement depend on Daily video processing support in the participant's browser.
              </div>
            </div>

            <div style={S.modalFoot}>
              <button type="button" style={S.secondaryBtn} onClick={loadDevices}>Refresh devices</button>
              <button type="button" style={S.primaryBtn} onClick={applyDeviceSettings} disabled={savingDevices}>
                {savingDevices ? 'Applying…' : 'Apply settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes foundryPulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
      `}</style>
    </div>
  );
}
