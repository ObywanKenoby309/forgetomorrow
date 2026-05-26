// pages/foundry/index.js

import { useState, useEffect } from 'react';
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

const S = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  card: {
    background: 'rgba(255,255,255,0.58)',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 18,
    padding: '24px 24px',
    width: '100%',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 14px 36px rgba(0,0,0,0.12)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255,112,67,0.12)',
    border: '1px solid rgba(255,112,67,0.3)',
    color: ORANGE,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    padding: '3px 9px',
    borderRadius: 5,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 800,
    color: '#112033',
    marginBottom: 6,
    lineHeight: 1.2,
  },
  sectionSub: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 22,
    lineHeight: 1.7,
    fontWeight: 500,
  },
  label: {
    fontSize: 11,
    color: '#334155',
    marginBottom: 6,
    display: 'block',
    fontWeight: 700,
    letterSpacing: '0.01em',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.82)',
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: 10,
    padding: '10px 12px',
    color: '#112033',
    fontSize: 13,
    outline: 'none',
    marginBottom: 10,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  primaryBtn: {
    width: '100%',
    background: ORANGE,
    border: 'none',
    color: '#fff',
    borderRadius: 10,
    padding: '11px 14px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 8,
    fontFamily: 'inherit',
    transition: 'background 0.15s',
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
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    letterSpacing: '0.01em',
  },
  scheduleBtn: {
    width: '100%',
    background: 'none',
    border: '1px solid rgba(255,112,67,0.35)',
    color: ORANGE,
    borderRadius: 10,
    padding: '11px 14px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    letterSpacing: '0.01em',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '18px 0',
  },
  divLine: {
    flex: 1,
    height: 1,
    background: 'rgba(0,0,0,0.10)',
  },
  divTxt: {
    fontSize: 11,
    color: '#475569',
    fontWeight: 600,
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
  // Recent foundries
  recentLabel: {
    fontSize: 11,
    color: '#334155',
    fontWeight: 700,
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
    background: status === 'ACTIVE' ? '#16A34A' : status === 'SCHEDULED' ? ORANGE : '#CBD5E1',
  }),
  recentName: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  recentMeta: {
    fontSize: 11,
    color: '#94A3B8',
    whiteSpace: 'nowrap',
  },
  recentBtn: {
    background: 'rgba(255,112,67,0.09)',
    border: '1px solid rgba(255,112,67,0.25)',
    color: ORANGE,
    fontSize: 10,
    fontWeight: 700,
    padding: '3px 9px',
    borderRadius: 5,
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
};

const CAN_HOST = ['COACH', 'RECRUITER', 'ADMIN', 'OWNER', 'SITE_ADMIN'];

export default function FoundryLobby() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const greeting = getTimeGreeting();

  const [title, setTitle] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [err, setErr] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [recentRooms, setRecentRooms] = useState([]);

  if (status === 'loading') return null;
  if (status === 'unauthenticated') {
    router.replace('/login');
    return null;
  }

  const userRole = String(session?.user?.role || '').toUpperCase();
  const canHost = CAN_HOST.includes(userRole);

  // Load contacts + recent rooms for hosts
  useEffect(() => {
    if (!canHost) return;

    fetch('/api/contacts/list')
      .then(r => r.json())
      .then(data => {
        if (data.contacts) {
          setContacts(data.contacts.map(c => ({
            id: c.contactUserId || c.id,
            name: c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unknown',
            avatarUrl: c.avatarUrl || null,
          })));
        }
      })
      .catch(() => {});

    fetch('/api/foundry/recent')
      .then(r => r.json())
      .then(data => { if (data.rooms) setRecentRooms(data.rooms); })
      .catch(() => {});
  }, [canHost]);

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
    fetch('/api/foundry/recent')
      .then(r => r.json())
      .then(data => { if (data.rooms) setRecentRooms(data.rooms); })
      .catch(() => {});
  };

  function recentMetaLabel(room) {
    if (room.status === 'ACTIVE') return 'Live now';
    if (room.status === 'SCHEDULED' && room.scheduledAt) {
      return new Date(room.scheduledAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      });
    }
    return 'Ended';
  }

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
          <div style={S.card}>
            <div style={S.badge}>🔨 Foundry</div>

            <h2 style={S.sectionHeading}>
              {canHost ? 'Start or join a Foundry' : 'Join a Foundry'}
            </h2>

            <p style={S.sectionSub}>
              {canHost
                ? 'Launch a secure collaboration session for interviews, coaching, portfolio reviews, and professional strategy conversations.'
                : 'Your coach or recruiter will send you a Foundry invite link or code. Enter it below to join the session.'}
            </p>

            {err && <div style={S.error}>{err}</div>}

            {canHost && (
              <>
                <label style={S.label}>Session title</label>
                <input
                  style={S.input}
                  placeholder="e.g. Career Strategy Session — Q4 Review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  aria-label="Session title"
                />
                <button
                  style={{ ...S.primaryBtn, opacity: creating ? 0.7 : 1 }}
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? 'Opening Foundry…' : 'Open a Foundry Now'}
                </button>

                <button
                  style={S.scheduleBtn}
                  onClick={() => setShowScheduler(true)}
                >
                  📅 Schedule a Foundry
                </button>

                <div style={S.divider}>
                  <div style={S.divLine} />
                  <span style={S.divTxt}>or join an existing Foundry</span>
                  <div style={S.divLine} />
                </div>
              </>
            )}

            <label style={S.label}>Foundry code or link</label>
            <input
              style={S.input}
              placeholder="Paste a Foundry code or invite link"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              aria-label="Foundry code"
            />
            <button
              style={{ ...S.secondaryBtn, opacity: joining ? 0.7 : 1 }}
              onClick={handleJoin}
              disabled={joining}
            >
              {joining ? 'Joining…' : 'Join Foundry'}
            </button>
          </div>

          {/* Recent Foundries — hosts only */}
          {canHost && recentRooms.length > 0 && (
            <div style={S.card}>
              <span style={S.recentLabel}>Recent Foundries</span>
              {recentRooms.map((room) => (
                <div key={room.roomId} style={S.recentRow}>
                  <div style={S.recentStatusDot(room.status)} />
                  <span style={S.recentName}>{room.title}</span>
                  <span style={S.recentMeta}>{recentMetaLabel(room)}</span>
                  {room.status !== 'ENDED' && (
                    <button
                      style={S.recentBtn}
                      onClick={() => router.push(`/foundry/${room.roomId}`)}
                    >
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