// components/foundry/FoundryLobbyWaiting.js
// Shown to participants and guests while waiting for host admission.
// Polls every 5 seconds. When admitted, fires onAdmitted(token, roomUrl).

import { useState, useEffect, useRef } from 'react';

const ORANGE = '#FF7043';
const POLL_MS = 5000;

const S = {
  page: {
    position: 'fixed', inset: 0,
    background: '#0b0d11',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif", zIndex: 100,
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16, padding: '36px 32px',
    maxWidth: 400, width: '100%', textAlign: 'center',
  },
  icon: { fontSize: 40, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 700, color: '#f0f0f0', marginBottom: 8 },
  sub: { fontSize: 12, color: '#666', lineHeight: 1.7, marginBottom: 24 },
  sessionChip: {
    display: 'inline-block',
    background: 'rgba(255,112,67,0.1)', border: '1px solid rgba(255,112,67,0.2)',
    color: ORANGE, borderRadius: 20, padding: '4px 14px',
    fontSize: 11, fontWeight: 700, marginBottom: 20,
  },
  dots: { display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 },
  dot: (delay) => ({
    width: 8, height: 8, borderRadius: '50%', background: ORANGE,
    opacity: 0.7,
    animation: `foundryPulse 1.4s ease-in-out ${delay}s infinite`,
  }),
  pollNote: { fontSize: 10, color: '#333' },
  declined: {
    background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.2)',
    borderRadius: 10, padding: '14px 18px', marginBottom: 16,
    color: '#ef5350', fontSize: 12, lineHeight: 1.6,
  },
  btn: {
    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
    color: '#666', borderRadius: 8, padding: '9px 20px',
    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  },
};

export default function FoundryLobbyWaiting({
  roomId,
  lobbyId,
  sessionTitle,
  hostName,
  isGuest = false,
  guestCode,
  onAdmitted,   // (token, roomUrl, scheduledEndAt) => void
  onDeclined,   // () => void
  onLeave,      // () => void
}) {
  const [status, setStatus] = useState('WAITING'); // WAITING | DECLINED | POLLING_ERROR
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!lobbyId) return;

    const poll = async () => {
      try {
        const url = `/api/foundry/room/${roomId}/lobby?lobbyId=${encodeURIComponent(lobbyId)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'ADMITTED') {
          clearInterval(pollRef.current);
          onAdmitted?.(data.token, data.roomUrl, data.scheduledEndAt);
          return;
        }

        if (data.status === 'DECLINED') {
          clearInterval(pollRef.current);
          setStatus('DECLINED');
          onDeclined?.();
          return;
        }

        setPollCount(c => c + 1);
      } catch {
        // Network error — keep polling
        setPollCount(c => c + 1);
      }
    };

    // Poll immediately then every 5 seconds
    poll();
    pollRef.current = setInterval(poll, POLL_MS);

    return () => clearInterval(pollRef.current);
  }, [lobbyId, roomId, onAdmitted, onDeclined]);

  if (status === 'DECLINED') {
    return (
      <div style={S.page}>
        <style>{`@keyframes foundryPulse { 0%,100%{opacity:0.7} 50%{opacity:0.2} }`}</style>
        <div style={S.card}>
          <div style={S.icon}>🚫</div>
          <div style={S.title}>Unable to join</div>
          <div style={S.declined}>
            The host was unable to admit you to this Foundry session.
          </div>
          <button style={S.btn} onClick={onLeave}>Return to lobby</button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <style>{`@keyframes foundryPulse { 0%,100%{opacity:0.7} 50%{opacity:0.2} }`}</style>
      <div style={S.card}>
        <div style={S.icon}>⏳</div>
        {sessionTitle && <div style={S.sessionChip}>🔨 {sessionTitle}</div>}
        <div style={S.title}>Waiting to be admitted</div>
        <div style={S.sub}>
          {hostName
            ? <><strong style={{ color: '#ccc' }}>{hostName}</strong> will let you in shortly.</>
            : 'The host will let you in shortly.'
          }
          <br />
          Please keep this window open.
        </div>
        <div style={S.dots}>
          <div style={S.dot(0)} />
          <div style={S.dot(0.2)} />
          <div style={S.dot(0.4)} />
        </div>
        <div style={S.pollNote}>Checking every 5 seconds…</div>
        <div style={{ marginTop: 20 }}>
          <button style={S.btn} onClick={onLeave}>Leave</button>
        </div>
      </div>
    </div>
  );
}