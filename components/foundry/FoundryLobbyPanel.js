// components/foundry/FoundryLobbyPanel.js
// Shown in the host's People panel while participants are waiting in lobby.
// Polls the lobby list every 5 seconds. Host can admit individually or admit all.
// Also handles co-host assignment.

import { useState, useEffect, useRef, useCallback } from 'react';

const ORANGE = '#FF7043';
const POLL_MS = 5000;

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 0 },
  // Lobby section
  lobbySection: {
    background: 'rgba(255,112,67,0.06)',
    border: '1px solid rgba(255,112,67,0.15)',
    borderRadius: 10, padding: '12px 12px', marginBottom: 10,
  },
  lobbyHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  lobbyTitle: {
    fontSize: 11, fontWeight: 700, color: ORANGE,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  lobbyCount: {
    background: ORANGE, color: '#fff', borderRadius: 999,
    padding: '1px 7px', fontSize: 10, fontWeight: 700,
  },
  admitAllBtn: {
    background: ORANGE, border: 'none', color: '#fff',
    borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  lobbyRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 0', borderTop: '1px solid rgba(255,112,67,0.1)',
  },
  avatar: (url) => ({
    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
    background: url ? `url(${url}) center/cover` : '#5C6BC0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 600, color: '#fff',
  }),
  lobbyName: { flex: 1, fontSize: 12, color: '#ccc', fontWeight: 500 },
  lobbyRole: { fontSize: 10, color: '#555' },
  guestTag: {
    fontSize: 9, background: 'rgba(255,255,255,0.06)', color: '#555',
    padding: '1px 5px', borderRadius: 3, fontWeight: 600,
  },
  admitBtn: {
    background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.3)',
    color: '#66bb6a', borderRadius: 5, padding: '3px 9px',
    fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  declineBtn: {
    background: 'none', border: '1px solid rgba(239,83,80,0.2)',
    color: '#555', borderRadius: 5, padding: '3px 7px',
    fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
  },
  emptyLobby: { fontSize: 11, color: '#444', textAlign: 'center', padding: '8px 0' },
  // Co-host section
  coHostSection: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10, padding: '10px 12px', marginBottom: 10,
  },
  coHostTitle: { fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  coHostRow: { display: 'flex', alignItems: 'center', gap: 8 },
  coHostName: { flex: 1, fontSize: 12, color: '#aaa' },
  removeBtn: {
    background: 'none', border: '1px solid rgba(255,255,255,0.08)',
    color: '#555', borderRadius: 5, padding: '2px 7px',
    fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
  },
  assignInput: {
    flex: 1, background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6, padding: '5px 8px', color: '#ccc',
    fontSize: 11, outline: 'none', fontFamily: 'inherit',
  },
  assignBtn: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#888', borderRadius: 5, padding: '5px 9px',
    fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
  },
};

export default function FoundryLobbyPanel({
  roomId,
  participants = [], // current in-room participants (for co-host picker)
  coHostUserId,
  coHostName,
  isHost,
  onCoHostAssigned,
}) {
  const [waitingList, setWaitingList] = useState([]);
  const [admitting, setAdmitting] = useState({}); // { lobbyId: true }
  const [coHostSearch, setCoHostSearch] = useState('');
  const [coHostError, setCoHostError] = useState('');
  const pollRef = useRef(null);

  const fetchLobby = useCallback(async () => {
    if (!isHost) return;
    try {
      const res = await fetch(`/api/foundry/room/${roomId}/lobby`);
      const data = await res.json();
      if (data.waitingList) setWaitingList(data.waitingList);
    } catch {}
  }, [roomId, isHost]);

  useEffect(() => {
    if (!isHost) return;
    fetchLobby();
    pollRef.current = setInterval(fetchLobby, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [isHost, fetchLobby]);

  const admit = async (lobbyId) => {
    setAdmitting(prev => ({ ...prev, [lobbyId]: true }));
    try {
      await fetch(`/api/foundry/room/${roomId}/admit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lobbyId }),
      });
      setWaitingList(prev => prev.filter(p => p.lobbyId !== lobbyId));
    } catch {}
    setAdmitting(prev => ({ ...prev, [lobbyId]: false }));
  };

  const decline = async (lobbyId) => {
    try {
      await fetch(`/api/foundry/room/${roomId}/admit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lobbyId, decline: true }),
      });
      setWaitingList(prev => prev.filter(p => p.lobbyId !== lobbyId));
    } catch {}
  };

  const admitAll = async () => {
    try {
      await fetch(`/api/foundry/room/${roomId}/admit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admitAll: true }),
      });
      setWaitingList([]);
    } catch {}
  };

  const assignCoHost = async (userId) => {
    setCoHostError('');
    try {
      const res = await fetch(`/api/foundry/room/${roomId}/cohost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coHostUserId: userId }),
      });
      const data = await res.json();
      if (!res.ok) { setCoHostError(data.error || 'Could not assign co-host'); return; }
      onCoHostAssigned?.(data);
      setCoHostSearch('');
    } catch { setCoHostError('Network error'); }
  };

  const removeCoHost = async () => {
    try {
      await fetch(`/api/foundry/room/${roomId}/cohost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coHostUserId: null }),
      });
      onCoHostAssigned?.(null);
    } catch {}
  };

  // Eligible co-hosts: any non-host, non-local FT user (has a userId, not a guest)
  // We no longer filter by role here because p.role only populates from Daily userData,
  // which requires the daily_fix.js token patch. Until every room is recreated after
  // that patch, role will be empty for many participants. Any authenticated FT user
  // (Seeker, Coach, or Recruiter) can be assigned co-host — the host decides.
  const eligibleCoHosts = participants.filter(p =>
    !p.local && !p.isHost && !p.isGuest && !!p.userId
  );

  if (!isHost) return null;

  return (
    <div style={S.wrap}>
      {/* Lobby waiting list */}
      <div style={S.lobbySection}>
        <div style={S.lobbyHeader}>
          <div style={S.lobbyTitle}>
            ⏳ Lobby
            {waitingList.length > 0 && <span style={S.lobbyCount}>{waitingList.length}</span>}
          </div>
          {waitingList.length > 0 && (
            <button style={S.admitAllBtn} onClick={admitAll}>Admit all</button>
          )}
        </div>

        {waitingList.length === 0 ? (
          <div style={S.emptyLobby}>No one waiting</div>
        ) : (
          waitingList.map(p => (
            <div key={p.lobbyId} style={S.lobbyRow}>
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt={p.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={S.avatar(null)}>{initials(p.name)}</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.lobbyName}>{p.name}</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {p.isGuest && <span style={S.guestTag}>Guest</span>}
                  {p.role && !p.isGuest && <span style={S.lobbyRole}>{p.role}</span>}
                </div>
              </div>
              <button
                style={{ ...S.admitBtn, opacity: admitting[p.lobbyId] ? 0.6 : 1 }}
                onClick={() => admit(p.lobbyId)}
                disabled={!!admitting[p.lobbyId]}
              >
                Admit
              </button>
              <button style={S.declineBtn} onClick={() => decline(p.lobbyId)}>✕</button>
            </div>
          ))
        )}
      </div>

      {/* Co-host assignment */}
      <div style={S.coHostSection}>
        <div style={S.coHostTitle}>Co-host</div>
        {coHostUserId ? (
          <div style={S.coHostRow}>
            <span style={S.coHostName}>👑 {coHostName || 'Co-host assigned'}</span>
            <button style={S.removeBtn} onClick={removeCoHost}>Remove</button>
          </div>
        ) : (
          <>
            {eligibleCoHosts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {eligibleCoHosts.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#aaa', flex: 1 }}>{p.name}</span>
                    <button
                      style={S.admitBtn}
                      onClick={() => p.userId && assignCoHost(p.userId)}
                    >
                      Make co-host
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#444' }}>
                No eligible co-hosts in the room yet.
                <br />
                <span style={{ color: '#333' }}>Co-hosts must be a Coach or Recruiter.</span>
              </div>
            )}
            {coHostError && <div style={{ fontSize: 11, color: '#ef5350', marginTop: 6 }}>{coHostError}</div>}
          </>
        )}
      </div>
    </div>
  );
}