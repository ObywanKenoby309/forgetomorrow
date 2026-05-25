// components/foundry/FoundryVideoGrid.js
// Manages the main video area and PIP strip.
// Designed to swap in a real WebRTC track later - currently shows avatar tiles.

import { useState } from 'react';

const S = {
  area: { flex: 1, display: 'flex', flexDirection: 'column', padding: 10, gap: 8, minWidth: 0 },
  mainTile: {
    flex: 1, borderRadius: 10, position: 'relative', overflow: 'hidden',
    background: '#070910', border: '1px solid rgba(255,255,255,0.06)',
  },
  inner: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ambient: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(255,112,67,0.045) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  floor: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
    background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
    pointerEvents: 'none',
  },
  frameLine: {
    position: 'absolute', top: 0, left: '18%', right: '18%', height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(255,112,67,0.22), transparent)',
    pointerEvents: 'none',
  },
  hostAvatar: {
    width: 80, height: 80, borderRadius: '50%',
    background: 'linear-gradient(135deg,#BF360C,#FF7043)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 30, fontWeight: 700, color: '#fff', position: 'relative', zIndex: 1,
  },
  nameTag: {
    position: 'absolute', bottom: 10, left: 10,
    background: 'rgba(0,0,0,0.55)', borderRadius: 5, padding: '4px 10px',
    fontSize: 11, color: '#ddd', display: 'flex', alignItems: 'center', gap: 6, zIndex: 2,
  },
  hostBadge: {
    background: 'rgba(255,112,67,0.2)', color: '#FF7043',
    fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
  },
  pipRow: { display: 'flex', gap: 7, height: 82, flexShrink: 0 },
  pip: {
    flex: 1, borderRadius: 8, background: '#0a0c10',
    border: '1px solid rgba(255,255,255,0.06)',
    position: 'relative', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'border-color 0.15s',
  },
  pipSelected: { border: '1.5px solid rgba(255,112,67,0.6)' },
  pipAvatar: {
    width: 32, height: 32, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 600, color: '#fff',
  },
  pipName: {
    position: 'absolute', bottom: 4, left: 5, fontSize: 9,
    color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.45)',
    borderRadius: 3, padding: '1px 5px',
  },
  pipMute: { position: 'absolute', top: 4, right: 4, fontSize: 12, color: '#ef5350' },
  pipOff: {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 2,
    color: 'rgba(255,255,255,0.2)', fontSize: 9,
  },
  pipAdd: {
    border: '1px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 3, color: 'rgba(255,255,255,0.2)', fontSize: 9,
  },
};

function initials(name) {
  return name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}

export default function FoundryVideoGrid({ participants = [], compact = false, onInvite }) {
  const [selectedPip, setSelectedPip] = useState(null);

  const host = participants.find(p => p.isHost) || participants[0];
  const others = participants.filter(p => p !== host);

  return (
    <div style={S.area}>
      {/* Main tile - host / active speaker */}
      <div style={S.mainTile}>
        <div style={S.inner}>
          <div style={S.ambient} />
          <div style={S.floor} />
          <div style={S.frameLine} />
          {host?.videoOff ? (
            <div style={S.hostAvatar}>{initials(host.name)}</div>
          ) : (
            // Placeholder: swap <video> tag here when WebRTC tracks available
            <div style={S.hostAvatar}>{initials(host?.name)}</div>
          )}
          {host && (
            <div style={S.nameTag}>
              <span style={{ color: host.micMuted ? '#ef5350' : '#4caf50', fontSize: 12 }}>
                {host.micMuted ? '✕' : '🎤'}
              </span>
              {host.name}
              {host.isHost && <span style={S.hostBadge}>Host</span>}
            </div>
          )}
        </div>
      </div>

      {/* PIP strip - hidden in compact mode */}
      {!compact && (
        <div style={S.pipRow}>
          {others.map((p) => (
            <div
              key={p.id}
              style={{ ...S.pip, ...(selectedPip === p.id ? S.pipSelected : {}) }}
              onClick={() => setSelectedPip(selectedPip === p.id ? null : p.id)}
              tabIndex={0}
              aria-label={`${p.name}${p.micMuted ? ', muted' : ''}${p.videoOff ? ', camera off' : ''}`}
            >
              {p.videoOff ? (
                <div style={S.pipOff}>
                  <span style={{ fontSize: 16 }}>🎥</span>
                  <span>Camera off</span>
                </div>
              ) : (
                // Placeholder: swap for <video> when WebRTC ready
                <div style={{ ...S.pipAvatar, background: p.color || '#5C6BC0' }}>
                  {initials(p.name)}
                </div>
              )}
              <div style={S.pipName}>{p.name?.split(' ')[0]}</div>
              {p.micMuted && <span style={S.pipMute}>✕</span>}
            </div>
          ))}

          {/* Invite slot */}
          <div
            style={{ ...S.pip, ...S.pipAdd }}
            onClick={onInvite}
            tabIndex={0}
            role="button"
            aria-label="Invite participant"
          >
            <span style={{ fontSize: 16 }}>+</span>
            <span>Invite</span>
          </div>
        </div>
      )}
    </div>
  );
}
