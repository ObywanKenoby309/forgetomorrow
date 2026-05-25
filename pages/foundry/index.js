// pages/foundry/index.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';

const ORANGE = '#FF7043';

const S = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#0b0d11', fontFamily: "'DM Sans', sans-serif", padding: 20,
  },
  card: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '40px 36px', maxWidth: 440, width: '100%',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,112,67,0.15)', border: '1px solid rgba(255,112,67,0.3)',
    color: ORANGE, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
    padding: '4px 10px', borderRadius: 6, marginBottom: 20, textTransform: 'uppercase',
  },
  heading: { fontSize: 22, fontWeight: 700, color: '#f0f0f0', marginBottom: 6 },
  sub: { fontSize: 13, color: '#666', marginBottom: 30, lineHeight: 1.6 },
  label: { fontSize: 11, color: '#666', marginBottom: 5, display: 'block' },
  input: {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '10px 14px', color: '#e0e0e0', fontSize: 13,
    outline: 'none', marginBottom: 10, fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
  },
  primaryBtn: {
    width: '100%', background: ORANGE, border: 'none', color: '#fff',
    borderRadius: 8, padding: '11px 14px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', marginBottom: 10, fontFamily: "'DM Sans', sans-serif",
    transition: 'background 0.15s',
  },
  secondaryBtn: {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#aaa', borderRadius: 8, padding: '11px 14px', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
  },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' },
  divLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' },
  divTxt: { fontSize: 11, color: '#444' },
  error: { color: '#ef5350', fontSize: 12, marginBottom: 10 },
  seekerNote: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8, padding: '14px 16px', marginBottom: 20,
    fontSize: 12, color: '#555', lineHeight: 1.6,
  },
};

const CAN_HOST = ['COACH', 'RECRUITER', 'ADMIN', 'OWNER', 'SITE_ADMIN'];

export default function FoundryLobby() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [title, setTitle] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [err, setErr] = useState('');

  if (status === 'loading') return null;
  if (status === 'unauthenticated') { router.replace('/login'); return null; }

  const userRole = String(session?.user?.role || '').toUpperCase();
  const canHost = CAN_HOST.includes(userRole);

  const handleCreate = async () => {
    if (!title.trim()) { setErr('Please give this Foundry a title.'); return; }
    setCreating(true); setErr('');
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
      }
    } catch {
      setErr('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = () => {
    const raw = joinCode.trim();
    if (!raw) { setErr('Enter a Foundry code or link.'); return; }
    setJoining(true); setErr('');
    const roomId = raw.includes('/foundry/')
      ? raw.split('/foundry/')[1].split('?')[0]
      : raw;
    router.push(`/foundry/${roomId}`);
  };

  return (
    <>
      <Head><title>Foundry · ForgeTomorrow</title></Head>
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.badge}>🔨 Foundry</div>
          <h1 style={S.heading}>
            {canHost ? 'Start or join a Foundry' : 'Join a Foundry'}
          </h1>
          <p style={S.sub}>
            {canHost
              ? 'A secure professional collaboration room — coaching, interviews, document review, and direct messaging in one place.'
              : 'Your coach or recruiter will send you a Foundry link or code. Enter it below to join the session.'}
          </p>

          {err && <div style={S.error}>{err}</div>}

          {/* Host-only: create a room */}
          {canHost && (
            <>
              <label style={S.label}>Session title</label>
              <input
                style={S.input}
                placeholder="e.g. Career Strategy Session — Q4 Review"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                aria-label="Session title"
              />
              <button
                style={{ ...S.primaryBtn, opacity: creating ? 0.7 : 1 }}
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? 'Opening Foundry…' : 'Open a Foundry'}
              </button>

              <div style={S.divider}>
                <div style={S.divLine} />
                <span style={S.divTxt}>or join an existing one</span>
                <div style={S.divLine} />
              </div>
            </>
          )}

          {/* Everyone: join via code/link */}
          <label style={S.label}>Foundry code or link</label>
          <input
            style={S.input}
            placeholder="Paste a Foundry code or invite link"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
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
      </div>
    </>
  );
}