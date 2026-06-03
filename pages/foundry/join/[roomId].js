// pages/foundry/join/[roomId].js
// Public guest join page — no ForgeTomorrow account required.
// Handles three pre-join states:
//   ROOM_NOT_OPEN_YET  — too early, shows countdown
//   WAITING_FOR_HOST   — in lobby window, polls until host joins
//   Ready              — issues token, routes to guest room

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const ORANGE = '#FF7043';
const POLL_INTERVAL_MS = 12000; // poll every 12 seconds

const S = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#0b0d11', fontFamily: "'DM Sans', sans-serif", padding: 20,
  },
  card: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 'clamp(20px, 5vw, 36px) clamp(16px, 5vw, 32px)',
    maxWidth: 420, width: '100%', boxSizing: 'border-box',
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
  btnDisabled: {
    width: '100%', background: 'rgba(255,112,67,0.3)', border: 'none', color: 'rgba(255,255,255,0.5)',
    borderRadius: 8, padding: '11px 14px', fontSize: 13, fontWeight: 700,
    cursor: 'not-allowed', fontFamily: 'inherit',
  },
  error: { color: '#ef5350', fontSize: 11, marginBottom: 10 },
  divider: { borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' },
  signupPrompt: { fontSize: 11, color: '#555', textAlign: 'center', lineHeight: 1.6 },
  signupLink: { color: ORANGE, textDecoration: 'none' },
  waitingCard: {
    background: 'rgba(255,112,67,0.05)', border: '1px solid rgba(255,112,67,0.15)',
    borderRadius: 10, padding: '16px 18px', marginBottom: 18, textAlign: 'center',
  },
  waitingIcon: { fontSize: 28, marginBottom: 8 },
  waitingTitle: { fontSize: 14, fontWeight: 700, color: '#ddd', marginBottom: 4 },
  waitingMsg: { fontSize: 11, color: '#666', lineHeight: 1.6 },
  pollDot: {
    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
    background: ORANGE, margin: '0 2px',
    animation: 'foundryPulse 1.4s ease-in-out infinite',
  },
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
        durationMinutes: true,
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
        durationMinutes: room.durationMinutes || 60,
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
  roomId, title, hostName, status, scheduledAt, durationMinutes,
  timezone, guestCode, error,
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [blockedByWebView, setBlockedByWebView] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const isGmailIOS = /GSA[\\/\\s]/.test(ua);
    const isFB = /FBAN|FBAV/.test(ua);
    const isIG = /Instagram/.test(ua);
    const isAndroidWV = /Android/.test(ua) && /wv/.test(ua);
    const isAndroidRestricted = /Android/.test(ua) && typeof navigator.mediaDevices === 'undefined';
    const isIOSInApp = /iPhone|iPad/.test(ua) && !/Safari\//.test(ua) && !/CriOS/.test(ua);
    if (isGmailIOS || isFB || isIG || isAndroidWV || isAndroidRestricted || isIOSInApp) {
      setBlockedByWebView(true);
    }
  }, []);

  if (blockedByWebView) {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    return (
      <div style={{ minHeight: '100vh', background: '#0b0d11', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,112,67,0.3)', borderRadius: 16, padding: '32px 24px', maxWidth: 380, width: '100%', textAlign: 'center', boxSizing: 'border-box' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f0f0', marginBottom: 10 }}>Open in your browser</div>
          <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.7, marginBottom: 24 }}>
            Camera and microphone access is required for Foundry. Gmail's built-in browser blocks this — you need <strong style={{ color: '#fff' }}>Chrome</strong> or <strong style={{ color: '#fff' }}>Safari</strong>.
          </div>
          <a href={currentUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', background: '#FF7043', color: '#fff', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 800, textDecoration: 'none', marginBottom: 16 }}>
            Open in Chrome / Safari →
          </a>
          <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Or copy this link</div>
            <div style={{ fontSize: 11, color: '#666', wordBreak: 'break-all', lineHeight: 1.5 }}>{currentUrl}</div>
          </div>
        </div>
      </div>
    );
  }

  const isInAppBrowser = typeof navigator !== 'undefined' && (
    /GSA\//.test(navigator.userAgent) ||
    /\[FB/.test(navigator.userAgent) ||
    /Instagram/.test(navigator.userAgent) ||
    /FBAN|FBAV/.test(navigator.userAgent) ||
    (!/Chrome/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && /Mobile/.test(navigator.userAgent) && /AppleWebKit/.test(navigator.userAgent))
  );
  const [joining, setJoining] = useState(false);
  const [err, setErr] = useState(error || '');

  // Waiting room state
  const [waitState, setWaitState] = useState(null); // null | 'TOO_EARLY' | 'WAITING_FOR_HOST' | 'WAITING_FOR_ADMISSION'
  const [opensAt, setOpensAt] = useState(null);
  const pollRef = useRef(null);
  const nameRef = useRef('');

  useEffect(() => { nameRef.current = name; }, [name]);

  // Clear polling on unmount
  useEffect(() => () => clearInterval(pollRef.current), []);

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

  const startPolling = (currentName) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      await attemptJoin(currentName, false);
    }, POLL_INTERVAL_MS);
  };

  const attemptJoin = async (guestName, showErrors = true) => {
    if (!guestName?.trim()) return;
    try {
      const res = await fetch('/api/foundry/guest-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, guestCode, guestName: guestName.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        // Room is open — proceed
        clearInterval(pollRef.current);
        sessionStorage.setItem('foundry_guest_name', guestName.trim());
        sessionStorage.setItem('foundry_guest_token', data.token);
        sessionStorage.setItem('foundry_guest_room_url', data.roomUrl);
        sessionStorage.setItem('foundry_guest_room_id', roomId);
        sessionStorage.setItem('foundry_guest_code', guestCode || '');
        router.push(`/foundry/guest/${roomId}?code=${encodeURIComponent(guestCode || '')}`);
        return;
      }

      if (data.error === 'ROOM_NOT_OPEN_YET') {
        setWaitState('TOO_EARLY');
        if (data.opensAt) setOpensAt(data.opensAt);
        clearInterval(pollRef.current); // no point polling when it's too early
        if (showErrors) setErr('');
        return;
      }

      if (data.error === 'WAITING_FOR_HOST') {
        setWaitState('WAITING_FOR_HOST');
        if (showErrors) setErr('');
        startPolling(guestName);
        return;
      }
	  
	  if (data.error === 'WAITING_FOR_ADMISSION') {
		setWaitState('WAITING_FOR_ADMISSION');
		if (showErrors) setErr('');
		startPolling(guestName);
		return;
	  }

      if (data.error === 'ROOM_ENDED') {
        clearInterval(pollRef.current);
        setErr('This Foundry has ended.');
        setWaitState(null);
        return;
      }

      if (showErrors) setErr(data.error || 'Could not join Foundry.');
    } catch {
      if (showErrors) setErr('Network error. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) { setErr('Please enter your name.'); return; }
    setJoining(true);
    setErr('');
    await attemptJoin(name.trim(), true);
  };

  // Waiting room — too early
  if (waitState === 'TOO_EARLY') {
    const opensDate = opensAt ? new Intl.DateTimeFormat('en-US', {
      timeZone: timezone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    }).format(new Date(opensAt)) : '15 minutes before the scheduled start';

    return (
      <div style={S.page}>
        <style>{`@keyframes foundryPulse { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,112,67,0.15)', border: '1px solid rgba(255,112,67,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔨</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: ORANGE, letterSpacing: '0.04em' }}>ForgeTomorrow Foundry</span>
          </div>
          <div style={S.sessionCard}>
            <div style={S.sessionTitle}>{title}</div>
            <div style={S.sessionMeta}>Hosted by {hostName}{dateStr && <><br />{dateStr}</>}</div>
          </div>
          <div style={S.waitingCard}>
            <div style={S.waitingIcon}>🕐</div>
            <div style={S.waitingTitle}>Too early to join</div>
            <div style={S.waitingMsg}>
              This Foundry opens at <strong style={{ color: ORANGE }}>{opensDate}</strong>.
              <br />Check back 15 minutes before the scheduled start.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Waiting room — waiting for host
  if (waitState === 'WAITING_FOR_HOST') {
    return (
      <div style={S.page}>
        <style>{`@keyframes foundryPulse { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,112,67,0.15)', border: '1px solid rgba(255,112,67,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔨</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: ORANGE, letterSpacing: '0.04em' }}>ForgeTomorrow Foundry</span>
          </div>
          <div style={S.sessionCard}>
            <div style={S.sessionTitle}>{title}</div>
            <div style={S.sessionMeta}>Hosted by {hostName}{dateStr && <><br />{dateStr}</>}</div>
          </div>
          <div style={S.waitingCard}>
            <div style={S.waitingIcon}>⏳</div>
            <div style={S.waitingTitle}>Waiting for {hostName} to start</div>
            <div style={S.waitingMsg}>
              You'll be admitted automatically once the host opens the Foundry.
              <br /><br />
              <span style={S.pollDot} />
              <span style={{ ...S.pollDot, animationDelay: '0.2s' }} />
              <span style={{ ...S.pollDot, animationDelay: '0.4s' }} />
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#333', textAlign: 'center' }}>
            Checking every 12 seconds…
          </div>
        </div>
      </div>
    );
  }

  // Default — name entry form
  return (
    <>
      <Head>
        <title>{title} · ForgeTomorrow Foundry</title>
      </Head>
      <div style={S.page}>
        <div style={S.card}>
          {/* ForgeTomorrow branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,112,67,0.15)', border: '1px solid rgba(255,112,67,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔨</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: ORANGE, letterSpacing: '0.04em' }}>ForgeTomorrow Foundry</span>
          </div>
          <h1 style={S.heading}>You're invited</h1>
          <p style={S.sub}>{hostName} invited you to join a Foundry session.</p>

          {/* In-app browser warning — Gmail/Facebook/Instagram block camera access */}
          {isInAppBrowser && (
            <div style={{ background: 'rgba(255,112,67,0.08)', border: '1px solid rgba(255,112,67,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 11, color: '#FF7043', lineHeight: 1.6 }}>
              ⚠️ You're viewing this in an in-app browser. For camera and microphone access, open this link in Chrome or Safari.
              <br />
              <a href={typeof window !== 'undefined' ? window.location.href : ''} target="_blank" rel="noopener noreferrer" style={{ color: '#FF7043', fontWeight: 700 }}>
                Open in browser →
              </a>
            </div>
          )}

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
            style={joining ? S.btnDisabled : S.btn}
            onClick={handleJoin}
            disabled={joining}
          >
            {joining ? 'Checking…' : 'Join Foundry'}
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