// pages/foundry/join/[roomId].js
// Public guest join page — no ForgeTomorrow account required.
// Validates the guest token, collects the guest's name, issues a Daily token.

import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const ORANGE = '#FF7043';

const S = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#0b0d11', fontFamily: "'DM Sans', sans-serif", padding: 20,
  },
  card: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '36px 32px', maxWidth: 400, width: '100%',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,112,67,0.15)', border: '1px solid rgba(255,112,67,0.3)',
    color: ORANGE, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
    padding: '3px 9px', borderRadius: 5, marginBottom: 16, textTransform: 'uppercase',
  },
  heading: { fontSize: 20, fontWeight: 700, color: '#f0f0f0', marginBottom: 6 },
  sub: { fontSize: 12, color: '#666', marginBottom: 24, lineHeight: 1.6 },
  sessionCard: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8, padding: '14px 16px', marginBottom: 22,
  },
  sessionTitle: { fontSize: 14, fontWeight: 600, color: '#ddd', marginBottom: 4 },
  sessionMeta: { fontSize: 11, color: '#555' },
  label: { fontSize: 11, color: '#666', marginBottom: 4, display: 'block', fontWeight: 500 },
  input: {
    width: '100%', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '10px 12px', color: '#e0e0e0', fontSize: 13,
    outline: 'none', marginBottom: 10, fontFamily: 'inherit', boxSizing: 'border-box',
  },
  btn: {
    width: '100%', background: ORANGE, border: 'none', color: '#fff',
    borderRadius: 8, padding: '11px 14px', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
  },
  error: { color: '#ef5350', fontSize: 11, marginBottom: 10 },
  divider: { borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' },
  signupPrompt: { fontSize: 11, color: '#555', textAlign: 'center', lineHeight: 1.6 },
  signupLink: { color: ORANGE, textDecoration: 'none' },
};

export async function getServerSideProps({ params, query }) {
  const { roomId } = params;
  const { code } = query;

  if (!code) return { props: { error: 'Invalid invite link.' } };

  try {
    const { prisma } = await import('@/lib/prisma');
    const room = await prisma.foundryRoom.findUnique({
      where: { roomId },
      select: {
        id: true, roomId: true, title: true, status: true,
        guestToken: true, scheduledAt: true, timezone: true,
        host: { select: { firstName: true, lastName: true } },
      },
    });

    if (!room) return { props: { error: 'Foundry not found.' } };
    if (room.status === 'ENDED') return { props: { error: 'This Foundry has already ended.' } };
    if (room.guestToken !== code) return { props: { error: 'Invalid or expired invite link.' } };

    const hostName = [room.host?.firstName, room.host?.lastName].filter(Boolean).join(' ') || 'Your host';

    return {
      props: {
        roomId: room.roomId,
        title: room.title,
        hostName,
        status: room.status,
        scheduledAt: room.scheduledAt?.toISOString() || null,
        timezone: room.timezone || 'America/New_York',
        guestCode: code,
      },
    };
  } catch (err) {
    console.error('[foundry/join]', err);
    return { props: { error: 'Something went wrong. Please try again.' } };
  }
}

export default function GuestJoin({
  roomId, title, hostName, status, scheduledAt, timezone, guestCode, error,
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const [err, setErr] = useState(error || '');

  if (error) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.badge}>🔨 Foundry</div>
          <h1 style={S.heading}>Unable to join</h1>
          <p style={{ ...S.sub, color: '#ef5350' }}>{error}</p>
        </div>
      </div>
    );
  }

  const dateStr = scheduledAt
    ? new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
      }).format(new Date(scheduledAt))
    : null;

  const handleJoin = async () => {
    if (!name.trim()) { setErr('Please enter your name.'); return; }
    setJoining(true); setErr('');

    try {
      const res = await fetch('/api/foundry/guest-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, guestCode, guestName: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Could not join Foundry.'); setJoining(false); return; }

      // Store guest name + token in sessionStorage so the room page can pick it up
      sessionStorage.setItem('foundry_guest_name', name.trim());
      sessionStorage.setItem('foundry_guest_token', data.token);
      sessionStorage.setItem('foundry_guest_room_url', data.roomUrl);

      router.push(`/foundry/guest/${roomId}`);
    } catch {
      setErr('Network error. Please try again.');
      setJoining(false);
    }
  };

  return (
    <>
      <Head>
        <title>{title} · ForgeTomorrow Foundry</title>
      </Head>
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.badge}>🔨 Foundry</div>
          <h1 style={S.heading}>You're invited</h1>
          <p style={S.sub}>{hostName} invited you to join a Foundry session.</p>

          <div style={S.sessionCard}>
            <div style={S.sessionTitle}>{title}</div>
            <div style={S.sessionMeta}>
              Hosted by {hostName}
              {dateStr && <><br />{dateStr}</>}
            </div>
          </div>

          {err && <div style={S.error}>{err}</div>}

          <label style={S.label}>Your name</label>
          <input
            style={S.input}
            placeholder="Enter your full name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            autoFocus
            aria-label="Your name"
          />
          <button
            style={{ ...S.btn, opacity: joining ? 0.7 : 1 }}
            onClick={handleJoin}
            disabled={joining}
          >
            {joining ? 'Joining Foundry…' : 'Join Foundry'}
          </button>

          <div style={S.divider} />
          <p style={S.signupPrompt}>
            Want to keep your documents and track opportunities?{' '}
            <a href="/signup" style={S.signupLink}>Create a free ForgeTomorrow account</a>
          </p>
        </div>
      </div>
    </>
  );
}
