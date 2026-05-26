// pages/foundry/index.js
// Foundry lobby — lives inside the normal platform chrome.
// Uses SeekerLayout so the user gets their wallpaper, header, and sidebar
// just like every other internal page.

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import SeekerLayout from '@/components/layouts/SeekerLayout';

const ORANGE = '#FF7043';

const S = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 140px)',
    padding: '24px 0',
  },
  card: {
    background: 'rgba(255,255,255,0.58)',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 14,
    padding: '32px 30px',
    maxWidth: 420,
    width: '100%',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,112,67,0.12)', border: '1px solid rgba(255,112,67,0.3)',
    color: ORANGE, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
    padding: '3px 9px', borderRadius: 5, marginBottom: 14, textTransform: 'uppercase',
  },
  heading: {
    fontSize: 20, fontWeight: 800, color: '#112033',
    marginBottom: 5, lineHeight: 1.2,
  },
  sub: {
    fontSize: 12, color: '#546E7A', marginBottom: 22, lineHeight: 1.6,
  },
  label: {
    fontSize: 11, color: '#78909C', marginBottom: 4, display: 'block', fontWeight: 500,
  },
  input: {
    width: '100%', background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: 8, padding: '9px 12px', color: '#112033', fontSize: 13,
    outline: 'none', marginBottom: 8, fontFamily: 'inherit',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  },
  primaryBtn: {
    width: '100%', background: ORANGE, border: 'none', color: '#fff',
    borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', marginBottom: 8, fontFamily: 'inherit',
    transition: 'background 0.15s', letterSpacing: '0.01em',
  },
  secondaryBtn: {
    width: '100%', background: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(0,0,0,0.12)',
    color: '#37474F', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0',
  },
  divLine: { flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' },
  divTxt: { fontSize: 11, color: '#90A4AE' },
  error: {
    color: '#c62828', fontSize: 11, marginBottom: 8,
    background: 'rgba(198,40,40,0.07)', border: '1px solid rgba(198,40,40,0.15)',
    borderRadius: 6, padding: '6px 10px',
  },
  seekerNote: {
    background: 'rgba(255,112,67,0.06)', border: '1px solid rgba(255,112,67,0.15)',
    borderRadius: 8, padding: '12px 14px', marginBottom: 18,
    fontSize: 12, color: '#78909C', lineHeight: 1.6,
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
        setCreating(false);
      }
    } catch {
      setErr('Network error. Please try again.');
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
    <SeekerLayout title="Foundry · ForgeTomorrow" activeNav="foundry">
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.badge}>🔨 Foundry</div>

          <h1 style={S.heading}>
            {canHost ? 'Start or join a Foundry' : 'Join a Foundry'}
          </h1>
          <p style={S.sub}>
            {canHost
              ? 'A secure professional collaboration room — live video, coaching, document review, and direct messaging in one place.'
              : 'Your coach or recruiter will send you a Foundry link or code. Enter it below to join.'}
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
    </SeekerLayout>
  );
}