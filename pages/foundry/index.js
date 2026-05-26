// pages/foundry/index.js

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import FoundrySchedulerModal from '@/components/foundry/FoundrySchedulerModal';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

const ORANGE = '#FF7043';
const GREEN = '#16A34A';
const SLATE = '#334155';
const DARK = '#112033';

const CAN_HOST = ['COACH', 'RECRUITER', 'ADMIN', 'OWNER', 'SITE_ADMIN'];

const S = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: 18 },
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
    fontWeight: 700,
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
    fontWeight: 700,
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
    fontWeight: 500,
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
  devicePreview: {
    borderRadius: 14,
    background: '#0b0d11',
    border: '1px solid rgba(255,255,255,0.14)',
    minHeight: 220,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  deviceVideo: { width: '100%', height: '100%', minHeight: 220, objectFit: 'cover' },
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
  recentLabel: {
    fontSize: 11,
    color: SLATE,
    fontWeight: 800,
    letterSpacing: '0.01em',
    marginBottom: 10,
    display: 'block',
  },
  recentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 0',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
  },
  recentStatusDot: (status) => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
    background: status === 'ACTIVE' ? GREEN : status === 'SCHEDULED' ? ORANGE : '#CBD5E1',
  }),
  recentName: {
    flex: 1,
    fontSize: 12,
    color: SLATE,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  recentMeta: { fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', fontWeight: 600 },
  recentBtn: {
    background: 'rgba(255,112,67,0.09)',
    border: '1px solid rgba(255,112,67,0.25)',
    color: ORANGE,
    fontSize: 10,
    fontWeight: 800,
    padding: '3px 9px',
    borderRadius: 5,
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
};

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

function recentMetaLabel(room) {
  if (room.status === 'ACTIVE') return 'Live now';
  if (room.status === 'SCHEDULED' && room.scheduledAt) return formatFoundryTime(room.scheduledAt);
  return 'Ended';
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

function StartPanel({ title, setTitle, creating, error, onCreate }) {
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

      <button style={{ ...S.primaryBtn, opacity: creating ? 0.7 : 1 }} onClick={onCreate} disabled={creating}>
        {creating ? 'Opening Foundry…' : 'Open Foundry Now'}
      </button>
    </div>
  );
}

function SchedulePanel({ onOpenScheduler }) {
  return (
    <div style={S.card}>
      <div style={S.panelHeader}>
        <h2 style={S.panelTitle}>Schedule a Foundry</h2>
        <p style={S.panelSub}>
          Create a future session, invite ForgeTomorrow contacts, and send branded guest links to external participants.
        </p>
      </div>

      <div style={S.infoBox}>
        Scheduled Foundries appear in Today&apos;s Foundries when they are live or approaching their start time.
      </div>

      <button style={S.outlineBtn} onClick={onOpenScheduler}>📅 Open scheduler</button>
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

function DeviceTestPanel() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  const [testing, setTesting] = useState(false);
  const [level, setLevel] = useState(0);
  const [deviceError, setDeviceError] = useState('');

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

  const startTest = async () => {
    setDeviceError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

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

  const testScreenShare = async () => {
    setDeviceError('');

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setDeviceError(err?.message || 'Could not start screen share test.');
      }
    }
  };

  useEffect(() => {
    return () => stopTest();
  }, []);

  return (
    <div style={S.card}>
      <div style={S.panelHeader}>
        <h2 style={S.panelTitle}>Test audio and video</h2>
        <p style={S.panelSub}>Check your camera, microphone, and screen sharing before joining a Foundry.</p>
      </div>

      <div style={S.infoBox}>
        For the best screen and system audio sharing experience on PC, ForgeTomorrow currently recommends Microsoft Edge. Chrome may only share audio from browser tabs.
      </div>

      {deviceError && <div style={S.error}>{deviceError}</div>}

      <div style={S.devicePreview}>
        <video ref={videoRef} style={S.deviceVideo} autoPlay muted playsInline />
        {!testing && <div style={S.deviceEmpty}>Camera preview will appear here.</div>}
      </div>

      <label style={S.label}>Microphone level</label>
      <div style={S.meterOuter}>
        <div style={S.meterInner(level)} />
      </div>

      <div style={S.buttonRow}>
        <button style={S.primaryBtn} onClick={testing ? stopTest : startTest}>
          {testing ? 'Stop test' : 'Start camera/mic test'}
        </button>

        <button style={S.outlineBtn} onClick={testScreenShare}>Test screen share</button>
      </div>
    </div>
  );
}

export default function FoundryLobby() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const greeting = getTimeGreeting();

  const [activeMode, setActiveMode] = useState('join');
  const [title, setTitle] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [err, setErr] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [recentRooms, setRecentRooms] = useState([]);
  const [todayRooms, setTodayRooms] = useState([]);

  const userRole = String(session?.user?.role || '').toUpperCase();
  const canHost = CAN_HOST.includes(userRole);

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

  const refreshFoundryData = () => {
    fetch('/api/foundry/today')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.rooms)) setTodayRooms(data.rooms);
      })
      .catch(() => {});

    if (canHost) {
      fetch('/api/foundry/recent')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.rooms)) setRecentRooms(data.rooms);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;

    setActiveMode(canHost ? 'start' : 'join');

    fetch('/api/foundry/today')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.rooms)) setTodayRooms(data.rooms);
      })
      .catch(() => {});

    if (!canHost) return;

    fetch('/api/contacts/list')
      .then((r) => r.json())
      .then((data) => {
        if (data.contacts) {
          setContacts(data.contacts.map((c) => ({
            id: c.contactUserId || c.id,
            name: c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unknown',
            avatarUrl: c.avatarUrl || null,
          })));
        }
      })
      .catch(() => {});

    fetch('/api/foundry/recent')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.rooms)) setRecentRooms(data.rooms);
      })
      .catch(() => {});
  }, [status, canHost]);

  if (status === 'loading') return null;

  if (status === 'unauthenticated') {
    router.replace('/login');
    return null;
  }

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
        body: JSON.stringify({ title: title.trim() }),
      });

      const data = await res.json();

      if (data.roomId) {
        router.push(`/foundry/${data.roomId}`);
      } else {
        setErr(data.error || 'Could not create Foundry.');
        setCreating(false);
      }
    } catch {
      setErr('Network error. Please try again.');
      setCreating(false);
    }
  };

  const handleJoin = () => {
    const raw = joinCode.trim();

    if (!raw) {
      setErr('Enter a Foundry code or link.');
      return;
    }

    setJoining(true);
    setErr('');

    const roomId = raw.includes('/foundry/')
      ? raw.split('/foundry/')[1].split('?')[0]
      : raw;

    router.push(`/foundry/${roomId}`);
  };

  const handleScheduled = () => {
    setShowScheduler(false);
    refreshFoundryData();
  };

  const renderPanel = () => {
    if (activeMode === 'start' && canHost) {
      return <StartPanel title={title} setTitle={setTitle} creating={creating} error={err} onCreate={handleCreate} />;
    }

    if (activeMode === 'schedule' && canHost) {
      return <SchedulePanel onOpenScheduler={() => setShowScheduler(true)} />;
    }

    if (activeMode === 'devices') {
      return <DeviceTestPanel />;
    }

    return <JoinPanel joinCode={joinCode} setJoinCode={setJoinCode} joining={joining} error={err} onJoin={handleJoin} />;
  };

  return (
    <>
      <Head>
        <title>Foundries | ForgeTomorrow</title>
      </Head>

      <SeekerLayout
        title="Foundries | ForgeTomorrow"
        activeNav="foundry"
        right={<RightRailPlacementManager />}
        rightVariant="light"
        header={
          <SeekerTitleCard
            greeting={greeting}
            title="Foundries"
            subtitle="A secure professional collaboration room — live video, coaching, document review, and direct messaging in one place."
          />
        }
      >
        <div style={S.wrapper}>
          <TodayFoundries
            rooms={todayRooms}
            onJoin={(roomId) => router.push(`/foundry/${roomId}`)}
            onRefresh={refreshFoundryData}
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

          {canHost && recentRooms.length > 0 && (
            <div style={S.card}>
              <span style={S.recentLabel}>Recent Foundries</span>

              {recentRooms.map((room) => (
                <div key={room.roomId} style={S.recentRow}>
                  <div style={S.recentStatusDot(room.status)} />
                  <span style={S.recentName}>{room.title}</span>
                  <span style={S.recentMeta}>{recentMetaLabel(room)}</span>

                  {room.status !== 'ENDED' && (
                    <button style={S.recentBtn} onClick={() => router.push(`/foundry/${room.roomId}`)}>
                      {room.status === 'ACTIVE' ? 'Rejoin' : 'Open'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SeekerLayout>

      {showScheduler && (
        <FoundrySchedulerModal
          dark={false}
          contacts={contacts}
          onClose={() => setShowScheduler(false)}
          onScheduled={handleScheduled}
        />
      )}
    </>
  );
}
