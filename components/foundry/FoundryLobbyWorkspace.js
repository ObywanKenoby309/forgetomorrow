// components/foundry/FoundryLobbyWorkspace.js

import { useState, useEffect, useRef } from 'react';
import FoundrySchedulePanel from './FoundrySchedulePanel';
import FoundryBrowserHelp from './FoundryBrowserHelp';

const ORANGE = '#FF7043';
const GREEN = '#16A34A';
const SLATE = '#334155';
const DARK = '#112033';

const S = {
  card: {
    background: 'rgba(255,255,255,0.58)',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 18,
    padding: '22px 24px',
    width: '100%',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 14px 36px rgba(0,0,0,0.12)',
    boxSizing: 'border-box',
  },
  todayHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  todayTitle: { fontSize: 16, fontWeight: 800, color: DARK, margin: 0 },
  todaySub: { fontSize: 12, color: '#475569', lineHeight: 1.5, margin: 0, fontWeight: 500 },
  refreshBtn: {
    background: 'rgba(255,255,255,0.62)',
    border: '1px solid rgba(0,0,0,0.10)',
    color: SLATE,
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  todayList: { display: 'grid', gap: 8 },
  todayRow: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: 10,
    padding: '11px 12px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.54)',
    border: '1px solid rgba(0,0,0,0.07)',
  },
  statusDot: (state) => ({
    width: 9,
    height: 9,
    borderRadius: '50%',
    background: state === 'LIVE' ? GREEN : state === 'JOIN_SOON' ? ORANGE : '#94A3B8',
    boxShadow:
      state === 'LIVE'
        ? '0 0 0 4px rgba(22,163,74,0.12)'
        : state === 'JOIN_SOON'
          ? '0 0 0 4px rgba(255,112,67,0.13)'
          : 'none',
  }),
  todayName: {
    fontSize: 13,
    fontWeight: 800,
    color: DARK,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  todayMeta: { fontSize: 11, color: '#475569', fontWeight: 600, marginTop: 2 },
  joinNowBtn: {
    background: ORANGE,
    border: 'none',
    color: '#fff',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  disabledPill: {
    background: 'rgba(15,23,42,0.06)',
    border: '1px solid rgba(15,23,42,0.08)',
    color: '#64748B',
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  emptyToday: {
    borderRadius: 12,
    background: 'rgba(255,255,255,0.38)',
    border: '1px dashed rgba(0,0,0,0.12)',
    color: '#475569',
    fontSize: 12,
    lineHeight: 1.6,
    padding: '14px 14px',
    fontWeight: 600,
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 10,
  },
  actionCard: (active) => ({
    textAlign: 'left',
    borderRadius: 14,
    padding: '14px 14px',
    minHeight: 96,
    cursor: 'pointer',
    fontFamily: 'inherit',
    background: active ? 'rgba(255,112,67,0.13)' : 'rgba(255,255,255,0.46)',
    border: active ? '1px solid rgba(255,112,67,0.42)' : '1px solid rgba(255,255,255,0.22)',
    boxShadow: active ? '0 12px 26px rgba(255,112,67,0.14)' : '0 10px 24px rgba(0,0,0,0.08)',
    transition: 'all 0.15s ease',
  }),
  actionIcon: { fontSize: 20, lineHeight: 1, marginBottom: 8 },
  actionTitle: { fontSize: 13, fontWeight: 800, color: DARK, marginBottom: 4 },
  actionText: { fontSize: 11, lineHeight: 1.45, color: '#475569', fontWeight: 600 },
  panelHeader: { marginBottom: 16 },
  panelTitle: { fontSize: 18, fontWeight: 800, color: DARK, margin: '0 0 6px', lineHeight: 1.2 },
  panelSub: { fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.7, fontWeight: 500 },
  label: {
    fontSize: 11,
    color: SLATE,
    marginBottom: 6,
    display: 'block',
    fontWeight: 800,
    letterSpacing: '0.01em',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.82)',
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: 10,
    padding: '10px 12px',
    color: DARK,
    fontSize: 13,
    outline: 'none',
    marginBottom: 10,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    background: 'rgba(255,255,255,0.82)',
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: 10,
    padding: '10px 12px',
    color: DARK,
    fontSize: 13,
    outline: 'none',
    marginBottom: 10,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  primaryBtn: {
    width: '100%',
    background: ORANGE,
    border: 'none',
    color: '#fff',
    borderRadius: 10,
    padding: '11px 14px',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    marginBottom: 8,
    fontFamily: 'inherit',
    letterSpacing: '0.01em',
  },
  secondaryBtn: {
    width: '100%',
    background: GREEN,
    border: 'none',
    color: '#fff',
    borderRadius: 10,
    padding: '11px 14px',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.01em',
  },
  outlineBtn: {
    width: '100%',
    background: 'rgba(255,255,255,0.58)',
    border: '1px solid rgba(255,112,67,0.35)',
    color: ORANGE,
    borderRadius: 10,
    padding: '11px 14px',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.01em',
  },
  error: {
    color: '#c62828',
    fontSize: 11,
    marginBottom: 12,
    background: 'rgba(198,40,40,0.07)',
    border: '1px solid rgba(198,40,40,0.15)',
    borderRadius: 8,
    padding: '8px 10px',
  },
  infoBox: {
    borderRadius: 12,
    padding: '12px 14px',
    background: 'rgba(255,112,67,0.08)',
    border: '1px solid rgba(255,112,67,0.18)',
    color: SLATE,
    fontSize: 12,
    lineHeight: 1.6,
    fontWeight: 600,
    marginBottom: 14,
  },
  deviceGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(180px, 260px) 1fr',
    gap: 16,
    alignItems: 'start',
  },
  deviceGridMobile: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 16,
    alignItems: 'start',
  },
  devicePreview: {
    borderRadius: 14,
    background: '#0b0d11',
    border: '1px solid rgba(255,255,255,0.14)',
    aspectRatio: '1 / 1',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  deviceVideo: { width: '100%', height: '100%', objectFit: 'cover' },
  screenPreview: {
    borderRadius: 14,
    background: '#0b0d11',
    border: '1px solid rgba(255,255,255,0.14)',
    minHeight: 150,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  screenVideo: { width: '100%', height: '100%', minHeight: 150, objectFit: 'contain', background: '#000' },
  deviceEmpty: {
    position: 'absolute',
    inset: 0,
    color: 'rgba(255,255,255,0.56)',
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'center',
    padding: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meterOuter: {
    height: 9,
    background: 'rgba(15,23,42,0.08)',
    borderRadius: 999,
    overflow: 'hidden',
    margin: '8px 0 12px',
  },
  meterInner: (level) => ({
    width: `${Math.min(100, Math.max(0, level))}%`,
    height: '100%',
    background: 'linear-gradient(90deg, #16A34A, #FF7043)',
    borderRadius: 999,
    transition: 'width 80ms linear',
  }),
  buttonRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 },

};


function parseFoundryJoinInput(raw) {
  const input = String(raw || '').trim();

  try {
    if (/^https?:\/\//i.test(input)) {
      const url = new URL(input);
      const path = url.pathname || '';

      const joinMatch = path.match(/\/foundry\/join\/([^/]+)/);
      if (joinMatch?.[1]) {
        const code = url.searchParams.get('code') || '';
        return {
          roomId: decodeURIComponent(joinMatch[1]),
          code,
          guestJoinUrl: `/foundry/join/${decodeURIComponent(joinMatch[1])}${code ? `?code=${encodeURIComponent(code)}` : ''}`,
        };
      }

      const guestMatch = path.match(/\/foundry\/guest\/([^/]+)/);
      if (guestMatch?.[1]) {
        return { roomId: decodeURIComponent(guestMatch[1]), guestJoinUrl: path + (url.search || '') };
      }

      const roomMatch = path.match(/\/foundry\/([^/?#]+)/);
      if (roomMatch?.[1]) return { roomId: decodeURIComponent(roomMatch[1]) };
    }
  } catch {}

  const trimmed = input.replace(/^#+/, '').trim();
  if (trimmed.includes('/foundry/join/')) {
    const after = trimmed.split('/foundry/join/')[1] || '';
    const [roomPart, queryPart = ''] = after.split('?');
    const params = new URLSearchParams(queryPart);
    const code = params.get('code') || '';
    return {
      roomId: roomPart,
      code,
      guestJoinUrl: `/foundry/join/${roomPart}${code ? `?code=${encodeURIComponent(code)}` : ''}`,
    };
  }

  if (trimmed.includes('/foundry/')) {
    const roomId = trimmed.split('/foundry/')[1].split('?')[0].split('#')[0];
    if (roomId) return { roomId };
  }

  return { code: trimmed };
}

function formatFoundryTime(value) {
  if (!value) return 'Time not set';

  try {
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Time not set';
  }
}

function todayStatusText(room) {
  if (room.joinState === 'LIVE') return 'Live now';
  if (room.joinState === 'JOIN_SOON') return 'Starting soon';
  if (room.joinState === 'UPCOMING') return formatFoundryTime(room.scheduledAt);
  return 'Unavailable';
}

function TodayFoundries({ rooms, onJoin, onRefresh }) {
  return (
    <div style={S.card}>
      <div style={S.todayHeader}>
        <div>
          <h2 style={S.todayTitle}>Today&apos;s Foundries</h2>
          <p style={S.todaySub}>Live and upcoming sessions you can join today.</p>
        </div>

        <button style={S.refreshBtn} onClick={onRefresh}>Refresh</button>
      </div>

      {rooms.length === 0 ? (
        <div style={S.emptyToday}>
          No Foundries scheduled for today. If someone sends you an invite, it will appear here when it is ready to join.
        </div>
      ) : (
        <div style={S.todayList}>
          {rooms.map((room) => (
            <div key={room.roomId} style={S.todayRow}>
              <div style={S.statusDot(room.joinState)} />

              <div style={{ minWidth: 0 }}>
                <div style={S.todayName}>{room.title}</div>
                <div style={S.todayMeta}>
                  {todayStatusText(room)}
                  {room.hostName ? ` · Host: ${room.hostName}` : ''}
                  {room.userRelationship ? ` · ${room.userRelationship.toLowerCase()}` : ''}
                </div>
              </div>

              {room.canJoin ? (
                <button style={S.joinNowBtn} onClick={() => onJoin(room.roomId)}>Join</button>
              ) : (
                <span style={S.disabledPill}>Upcoming</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModeCard({ mode, active, onClick }) {
  return (
    <button style={S.actionCard(active)} onClick={() => onClick(mode.id)}>
      <div style={S.actionIcon}>{mode.icon}</div>
      <div style={S.actionTitle}>{mode.title}</div>
      <div style={S.actionText}>{mode.description}</div>
    </button>
  );
}

function StartPanel({ title, setTitle, duration, setDuration, creating, error, onCreate }) {
  return (
    <div style={S.card}>
      <div style={S.panelHeader}>
        <h2 style={S.panelTitle}>Start a Foundry now</h2>
        <p style={S.panelSub}>
          Open a live room immediately for interviews, coaching, document review, or professional collaboration.
        </p>
      </div>

      {error && <div style={S.error}>{error}</div>}

      <label style={S.label}>Session title</label>
      <input
        style={S.input}
        placeholder="e.g. Career Strategy Session — Q4 Review"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onCreate()}
        aria-label="Session title"
      />

      <label style={{ ...S.label, marginTop: 2 }}>Duration</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[{ label: '30 min', value: 30, note: 'Quick session' }, { label: '1 hour', value: 60, note: 'Full session' }].map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setDuration(opt.value)}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
              border: duration === opt.value ? '1.5px solid #FF7043' : '1px solid rgba(0,0,0,0.12)',
              background: duration === opt.value ? 'rgba(255,112,67,0.08)' : 'rgba(255,255,255,0.8)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 800, color: duration === opt.value ? '#FF7043' : '#334155' }}>{opt.label}</span>
            <span style={{ fontSize: 10, color: '#90A4AE' }}>{opt.note}</span>
          </button>
        ))}
      </div>

      <button style={{ ...S.primaryBtn, opacity: creating ? 0.7 : 1 }} onClick={onCreate} disabled={creating}>
        {creating ? 'Opening Foundry…' : 'Open Foundry Now'}
      </button>
    </div>
  );
}

function JoinPanel({ joinCode, setJoinCode, joining, error, onJoin }) {
  return (
    <div style={S.card}>
      <div style={S.panelHeader}>
        <h2 style={S.panelTitle}>Join a Foundry</h2>
        <p style={S.panelSub}>
          Paste a Foundry code or invite link. Invited sessions for today will also appear above when they are ready.
        </p>
      </div>

      {error && <div style={S.error}>{error}</div>}

      <label style={S.label}>Foundry code or link</label>
      <input
        style={S.input}
        placeholder="Paste a Foundry code or invite link"
        value={joinCode}
        onChange={(e) => setJoinCode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onJoin()}
        aria-label="Foundry code"
      />

      <button style={{ ...S.secondaryBtn, opacity: joining ? 0.7 : 1 }} onClick={onJoin} disabled={joining}>
        {joining ? 'Joining…' : 'Join Foundry'}
      </button>
    </div>
  );
}

function DeviceTestPanel({ isMobile = false }) {
  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  const [testing, setTesting] = useState(false);
  const [screenTesting, setScreenTesting] = useState(false);
  const [level, setLevel] = useState(0);
  const [deviceError, setDeviceError] = useState('');
  const [devices, setDevices] = useState([]);
  const [cameraId, setCameraId] = useState('');
  const [micId, setMicId] = useState('');
  const [speakerId, setSpeakerId] = useState('');

  const cameras = devices.filter((d) => d.kind === 'videoinput');
  const microphones = devices.filter((d) => d.kind === 'audioinput');
  const speakers = devices.filter((d) => d.kind === 'audiooutput');
  const mediaDevicesSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices;

  const cameraMicSupported =
    mediaDevicesSupported &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  const screenShareSupported =
    mediaDevicesSupported &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function';

  const stopScreenTest = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (screenRef.current) {
      screenRef.current.srcObject = null;
    }

    setScreenTesting(false);
  };

  const stopTest = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setTesting(false);
    setLevel(0);
  };

  const loadDevices = async () => {
    if (!mediaDevicesSupported || typeof navigator.mediaDevices.enumerateDevices !== 'function') {
      setDevices([]);
      setDeviceError('Camera and microphone device testing is not available in this mobile browser. Open Foundry in Chrome, Safari, Edge, or Firefox for the best experience.');
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
    } catch {}
  };

  const startTest = async () => {
    stopTest();
    setDeviceError('');

    if (!cameraMicSupported) {
      setDeviceError('Camera and microphone testing is not available in this mobile browser. Open Foundry in Chrome, Safari, Edge, or Firefox for the best experience.');
      setTesting(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: cameraId ? { deviceId: { exact: cameraId } } : true,
        audio: micId ? { deviceId: { exact: micId } } : true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      await loadDevices();

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(data);

        const avg = data.reduce((sum, value) => sum + value, 0) / data.length;
        setLevel(Math.round((avg / 160) * 100));

        rafRef.current = requestAnimationFrame(tick);
      };

      tick();
      setTesting(true);
    } catch (err) {
      setDeviceError(err?.message || 'Could not access camera or microphone.');
      setTesting(false);
    }
  };

  const startScreenTest = async () => {
    setDeviceError('');
    stopScreenTest();

    if (!screenShareSupported) {
      setDeviceError('Screen sharing is not supported by this mobile browser. You can still test camera, microphone, and speaker here. Screen sharing should be tested from a supported desktop browser.');
      setScreenTesting(false);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = screenStream;

      screenStream.getTracks().forEach((track) => {
        track.onended = () => stopScreenTest();
      });

      if (screenRef.current) {
        screenRef.current.srcObject = screenStream;
        screenRef.current.play().catch(() => {});
      }

      setScreenTesting(true);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setDeviceError(err?.message || 'Could not start screen share test.');
      }
      setScreenTesting(false);
    }
  };

  const testSpeaker = () => {
    const audio = new Audio('/notification.mp3');
    if (speakerId && typeof audio.setSinkId === 'function') {
      audio.setSinkId(speakerId).catch(() => {});
    }
    audio.play().catch(() => {});
  };

  useEffect(() => {
    loadDevices();

    return () => {
      stopTest();
      stopScreenTest();
    };
  }, []);

  useEffect(() => {
    if (!testing) return;
    startTest();
  }, [cameraId, micId]);

  return (
    <div style={S.card}>
      <div style={S.panelHeader}>
        <h2 style={S.panelTitle}>Test audio and video</h2>
        <p style={S.panelSub}>Check your camera, microphone, speaker, and screen sharing before joining a Foundry.</p>
      </div>

      <FoundryBrowserHelp isMobile={isMobile} />

      {deviceError && <div style={S.error}>{deviceError}</div>}

      <div style={isMobile ? S.deviceGridMobile : S.deviceGrid}>
        <div>
          <div style={S.devicePreview}>
            <video ref={videoRef} style={S.deviceVideo} autoPlay muted playsInline />
            {!testing && <div style={S.deviceEmpty}>Camera preview</div>}
          </div>

          <div style={S.screenPreview}>
            <video ref={screenRef} style={S.screenVideo} autoPlay muted playsInline />
            {!screenTesting && (
              <div style={S.deviceEmpty}>
                {screenShareSupported ? 'Screen share preview' : 'Screen sharing is not supported on this mobile browser.'}
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={S.label}>Camera</label>
          <select style={S.select} value={cameraId} onChange={(e) => setCameraId(e.target.value)}>
            {cameras.length === 0 ? <option value="">Default camera</option> : null}
            {cameras.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>

          <label style={S.label}>Microphone</label>
          <select style={S.select} value={micId} onChange={(e) => setMicId(e.target.value)}>
            {microphones.length === 0 ? <option value="">Default microphone</option> : null}
            {microphones.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${index + 1}`}
              </option>
            ))}
          </select>

          <label style={S.label}>Speaker / output</label>
          <select style={S.select} value={speakerId} onChange={(e) => setSpeakerId(e.target.value)}>
            {speakers.length === 0 ? <option value="">System default output</option> : null}
            {speakers.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Speaker ${index + 1}`}
              </option>
            ))}
          </select>

          <label style={S.label}>Microphone level</label>
          <div style={S.meterOuter}>
            <div style={S.meterInner(level)} />
          </div>

          <div style={S.buttonRow}>
            <button style={S.primaryBtn} onClick={testing ? stopTest : startTest}>
              {testing ? 'Stop camera/mic test' : 'Start camera/mic test'}
            </button>

            <button style={S.outlineBtn} onClick={testSpeaker}>
              Test speaker
            </button>

            <button
              style={{
                ...S.outlineBtn,
                opacity: screenShareSupported ? 1 : 0.65,
                cursor: 'pointer',
              }}
              onClick={screenTesting ? stopScreenTest : startScreenTest}
              title={screenShareSupported ? 'Test screen share' : 'Screen sharing is not supported on this mobile browser.'}
            >
              {screenTesting ? 'Stop screen test' : screenShareSupported ? 'Test screen share' : 'Screen share unavailable'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FoundryLobbyWorkspace({
  canHost = false,
  contacts = [],
  todayRooms = [],
  onRefresh,
  onJoinRoom,
  isMobile = false,
}) {
  const [activeMode, setActiveMode] = useState(canHost ? 'start' : 'join');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    setActiveMode(canHost ? 'start' : 'join');
  }, [canHost]);

  const modes = canHost
    ? [
        { id: 'start', icon: '⚡', title: 'Start Now', description: 'Open a live room immediately.' },
        { id: 'schedule', icon: '📅', title: 'Schedule', description: 'Create a future session with invites.' },
        { id: 'join', icon: '🔗', title: 'Join', description: 'Enter a code or invite link.' },
        { id: 'devices', icon: '🎙', title: 'Test Devices', description: 'Check camera, mic, and screen share.' },
      ]
    : [
        { id: 'join', icon: '🔗', title: 'Join', description: 'Enter a code or invite link.' },
        { id: 'devices', icon: '🎙', title: 'Test Devices', description: 'Check camera, mic, and screen share.' },
      ];

  const handleCreate = async () => {
    if (!title.trim()) {
      setErr('Please give this Foundry a title.');
      return;
    }

    setCreating(true);
    setErr('');

    try {
      const res = await fetch('/api/foundry/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), durationMinutes: duration }),
      });

      const data = await res.json();

      if (data.roomId) {
        onJoinRoom?.(data.roomId);
      } else {
        setErr(data.error || 'Could not create Foundry.');
        setCreating(false);
      }
    } catch {
      setErr('Network error. Please try again.');
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    const raw = joinCode.trim();

    if (!raw) {
      setErr('Enter a Foundry code or link.');
      return;
    }

    setJoining(true);
    setErr('');

    try {
      const parsed = parseFoundryJoinInput(raw);

      if (parsed.guestJoinUrl) {
        window.location.href = parsed.guestJoinUrl;
        return;
      }

      if (parsed.roomId) {
        onJoinRoom?.(parsed.roomId);
        return;
      }

      const res = await fetch('/api/foundry/resolve-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: parsed.code || raw }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.roomId) {
        setErr(data.error || 'Could not find a Foundry for that code.');
        setJoining(false);
        return;
      }

      if (data.guestCode) {
        window.location.href = `/foundry/join/${data.roomId}?code=${encodeURIComponent(data.guestCode)}`;
        return;
      }

      onJoinRoom?.(data.roomId);
    } catch (err) {
      console.error('Foundry join lookup failed:', err);
      setErr('Could not join Foundry. Please check the code or link.');
      setJoining(false);
    }
  };

  const handleScheduled = () => {
    onRefresh?.();
    setActiveMode('join');
  };

  const renderPanel = () => {
    if (activeMode === 'start' && canHost) {
      return <StartPanel title={title} setTitle={setTitle} duration={duration} setDuration={setDuration} creating={creating} error={err} onCreate={handleCreate} />;
    }

    if (activeMode === 'schedule' && canHost) {
      return (
        <div style={S.card}>
          <div style={S.panelHeader}>
            <h2 style={S.panelTitle}>Schedule a Foundry</h2>
            <p style={S.panelSub}>
              Create a future session, invite ForgeTomorrow contacts, and send branded guest links to external participants.
            </p>
          </div>

          <FoundrySchedulePanel contacts={contacts} onScheduled={handleScheduled} />
        </div>
      );
    }

    if (activeMode === 'devices') {
      return <DeviceTestPanel isMobile={isMobile} />;
    }

    return <JoinPanel joinCode={joinCode} setJoinCode={setJoinCode} joining={joining} error={err} onJoin={handleJoin} />;
  };

  return (
    <>
      <TodayFoundries
        rooms={todayRooms}
        onJoin={(roomId) => onJoinRoom?.(roomId)}
        onRefresh={onRefresh}
      />

      <div style={S.card}>
        <div style={S.todayHeader}>
          <div>
            <h2 style={S.todayTitle}>Foundry Actions</h2>
            <p style={S.todaySub}>Choose how you want to enter or prepare for a session.</p>
          </div>
        </div>

        <div style={S.actionGrid}>
          {modes.map((mode) => (
            <ModeCard
              key={mode.id}
              mode={mode}
              active={activeMode === mode.id}
              onClick={setActiveMode}
            />
          ))}
        </div>
      </div>

      {renderPanel()}
    </>
  );
}