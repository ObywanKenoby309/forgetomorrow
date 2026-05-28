// components/foundry/FoundryMobileLayout.js
// Mobile-first Foundry room layout.
// Video fills the full screen. Controls overlay on top.
// Panels slide up as bottom sheets.
// End button always visible top-right.

import { useState, useEffect, useRef, useCallback } from 'react';

const ORANGE = '#FF7043';

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  root: {
    position: 'fixed', inset: 0,
    background: '#000',
    display: 'flex', flexDirection: 'column',
    fontFamily: "'DM Sans', sans-serif",
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },

  // Video fills everything
  videoWrap: {
    position: 'absolute', inset: 0,
    zIndex: 1,
  },

  // Top overlay — title + end button
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)',
  },
  topLeft: { display: 'flex', flexDirection: 'column', gap: 1 },
  sessionTitle: {
    fontSize: 13, fontWeight: 700, color: '#fff',
    maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  timer: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' },
  endBtn: {
    background: '#c62828', border: 'none', color: '#fff',
    borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  },

  // Recording badge
  recBadge: {
    position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
    zIndex: 11, display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: '3px 10px',
    fontSize: 10, color: '#ef5350', fontWeight: 600,
  },
  recDot: {
    width: 6, height: 6, borderRadius: '50%', background: '#ef5350',
    animation: 'foundryPulse 1.4s ease-in-out infinite',
  },

  // Bottom controls bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    zIndex: 10,
    padding: '12px 16px 28px', // 28px for home indicator
    background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  ctrlBtn: (active, danger) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    background: active
      ? (danger ? 'rgba(198,40,40,0.3)' : 'rgba(255,112,67,0.25)')
      : 'rgba(255,255,255,0.12)',
    border: 'none',
    borderRadius: 12,
    padding: '10px 14px',
    cursor: 'pointer',
    minWidth: 56,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: active
      ? (danger ? '#ef9a9a' : ORANGE)
      : 'rgba(255,255,255,0.85)',
  }),
  ctrlIcon: { fontSize: 20, lineHeight: 1 },
  ctrlLabel: { fontSize: 9, fontWeight: 600, whiteSpace: 'nowrap' },

  // More menu button
  moreBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 12,
    padding: '10px 14px', cursor: 'pointer', minWidth: 56,
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    color: 'rgba(255,255,255,0.85)',
  },

  // Bottom sheet backdrop
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 20,
  },

  // Bottom sheet
  sheet: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    zIndex: 21,
    background: '#141720',
    borderRadius: '16px 16px 0 0',
    maxHeight: '75vh',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
  },
  sheetHandle: {
    display: 'flex', justifyContent: 'center', padding: '10px 0 4px',
  },
  sheetHandleBar: {
    width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)',
  },
  sheetHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '4px 18px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  sheetTitle: { fontSize: 15, fontWeight: 700, color: '#f0f0f0' },
  sheetClose: {
    background: 'none', border: 'none', color: '#555',
    fontSize: 20, cursor: 'pointer', padding: 0,
  },
  sheetBody: { flex: 1, overflowY: 'auto', padding: '12px 16px' },

  // People list
  participantRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  participantAvatar: {
    width: 36, height: 36, borderRadius: '50%', background: '#5C6BC0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 600, color: '#fff', flexShrink: 0,
  },
  participantName: { flex: 1, fontSize: 14, color: '#ddd', fontWeight: 500 },
  participantRole: { fontSize: 11, color: '#555' },

  // Chat
  chatMessages: { display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 12 },
  chatMsg: { display: 'flex', gap: 8 },
  chatAvatar: {
    width: 28, height: 28, borderRadius: '50%', background: '#5C6BC0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 600, color: '#fff', flexShrink: 0, marginTop: 2,
  },
  chatSender: { fontSize: 12, fontWeight: 700, color: '#aaa', marginBottom: 2 },
  chatText: { fontSize: 13, color: '#ccc', lineHeight: 1.5 },
  chatInputRow: {
    display: 'flex', gap: 8, padding: '10px 16px 24px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: '#141720',
  },
  chatInput: {
    flex: 1, background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20, padding: '10px 14px',
    color: '#e0e0e0', fontSize: 13, outline: 'none',
    fontFamily: 'inherit',
  },
  chatSendBtn: {
    background: ORANGE, border: 'none', color: '#fff',
    borderRadius: 20, padding: '10px 16px', fontSize: 13,
    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
  },

  // More menu sheet
  moreMenu: { display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 8 },
  moreItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 4px', borderRadius: 8, cursor: 'pointer',
    background: 'none', border: 'none', width: '100%', textAlign: 'left',
    fontFamily: 'inherit',
  },
  moreIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  moreLabel: { fontSize: 14, color: '#ddd', fontWeight: 500 },
  moreSep: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' },
};

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function Timer({ startTime }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const pad = n => String(n).padStart(2, '0');
  return <span>{h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`}</span>;
}

export default function FoundryMobileLayout({
  // Video
  children, // FoundryVideoGrid goes here

  // Session info
  sessionTitle,
  startTime,
  isRecording,

  // AV controls
  micMuted,
  camOff,
  isScreenSharing,
  onMicToggle,
  onCamToggle,
  onShareScreen,
  onRecordToggle,

  // Panels
  participants,
  messages,
  onSend,

  // End
  onEnd,
  isHost,
  onMuteAll,
  onMuteParticipant,
  onKickParticipant,
  onBanParticipant,
  onLockRoom,
  onStopParticipantShare,
}) {
  const [activeSheet, setActiveSheet] = useState(null); // null | 'chat' | 'people' | 'more'
  const [chatDraft, setChatDraft] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (activeSheet === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeSheet]);

  const closeSheet = () => setActiveSheet(null);

  const sendChat = () => {
    if (!chatDraft.trim()) return;
    onSend?.(chatDraft.trim());
    setChatDraft('');
  };

  const unreadCount = 0; // can wire unread badges later

  return (
    <div style={S.root}>
      <style>{`
        @keyframes foundryPulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* Video — full screen */}
      <div style={S.videoWrap}>
        {children}
      </div>

      {/* Top bar */}
      <div style={S.topBar}>
        <div style={S.topLeft}>
          <div style={S.sessionTitle}>{sessionTitle || 'Foundry'}</div>
          <div style={S.timer}>
            <Timer startTime={startTime} />
            {isRecording && ' · REC'}
          </div>
        </div>
        <button style={S.endBtn} onClick={onEnd}>
          End
        </button>
      </div>

      {/* Recording badge */}
      {isRecording && (
        <div style={S.recBadge}>
          <div style={S.recDot} />
          Recording
        </div>
      )}

      {/* Bottom controls */}
      <div style={S.bottomBar}>
        {/* Mic */}
        <button style={S.ctrlBtn(micMuted, micMuted)} onClick={onMicToggle} aria-label={micMuted ? 'Unmute' : 'Mute'}>
          <span style={S.ctrlIcon}>{micMuted ? '🔇' : '🎤'}</span>
          <span style={S.ctrlLabel}>{micMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* Camera */}
        <button style={S.ctrlBtn(camOff, camOff)} onClick={onCamToggle} aria-label={camOff ? 'Start video' : 'Stop video'}>
          <span style={S.ctrlIcon}>{camOff ? '📵' : '📹'}</span>
          <span style={S.ctrlLabel}>{camOff ? 'Camera' : 'Camera'}</span>
        </button>

        {/* Chat */}
        <button style={S.ctrlBtn(activeSheet === 'chat', false)} onClick={() => setActiveSheet(activeSheet === 'chat' ? null : 'chat')}>
          <span style={S.ctrlIcon}>💬</span>
          <span style={S.ctrlLabel}>Chat</span>
        </button>

        {/* People */}
        <button style={S.ctrlBtn(activeSheet === 'people', false)} onClick={() => setActiveSheet(activeSheet === 'people' ? null : 'people')}>
          <span style={S.ctrlIcon}>👥</span>
          <span style={S.ctrlLabel}>People {participants?.length > 0 ? `(${participants.length})` : ''}</span>
        </button>

        {/* More */}
        <button style={S.moreBtn} onClick={() => setActiveSheet(activeSheet === 'more' ? null : 'more')}>
          <span style={S.ctrlIcon}>⋯</span>
          <span style={{ fontSize: 9, fontWeight: 600, whiteSpace: 'nowrap' }}>More</span>
        </button>
      </div>

      {/* Sheet backdrop */}
      {activeSheet && (
        <div style={S.backdrop} onClick={closeSheet} />
      )}

      {/* People sheet */}
      {activeSheet === 'people' && (
        <div style={S.sheet}>
          <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>
          <div style={S.sheetHeader}>
            <span style={S.sheetTitle}>In this Foundry ({participants?.length || 0})</span>
            <button style={S.sheetClose} onClick={closeSheet}>×</button>
          </div>
          <div style={S.sheetBody}>
            {(participants || []).map(p => (
              <div key={p.id} style={S.participantRow}>
                {p.avatarUrl ? (
                  <img src={p.avatarUrl} alt={p.name} style={{ ...S.participantAvatar, objectFit: 'cover' }} />
                ) : (
                  <div style={S.participantAvatar}>{initials(p.name)}</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={S.participantName}>{p.name}{p.local ? ' (You)' : ''}</div>
                  <div style={S.participantRole}>{p.isHost ? 'Host' : 'Participant'}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 14, color: p.micMuted ? '#ef5350' : '#4caf50' }}>
                    {p.micMuted ? '🔇' : '🎤'}
                  </span>
                  <span style={{ fontSize: 14, color: p.videoOff ? '#ef5350' : '#4caf50' }}>
                    {p.videoOff ? '📵' : '📹'}
                  </span>
                  {isHost && !p.local && (
                    <>
                      <button style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#ddd', borderRadius: 6, fontSize: 11, padding: '4px 7px' }} onClick={() => onMuteParticipant?.(p)}>Mute</button>
                      <button style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#ddd', borderRadius: 6, fontSize: 11, padding: '4px 7px' }} onClick={() => onStopParticipantShare?.(p)}>Stop share</button>
                      <button style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#ddd', borderRadius: 6, fontSize: 11, padding: '4px 7px' }} onClick={() => onKickParticipant?.(p)}>Kick</button>
                      <button style={{ background: 'rgba(239,83,80,0.12)', border: '1px solid rgba(239,83,80,0.24)', color: '#ef9a9a', borderRadius: 6, fontSize: 11, padding: '4px 7px' }} onClick={() => onBanParticipant?.(p)}>Ban</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat sheet */}
      {activeSheet === 'chat' && (
        <div style={{ ...S.sheet, maxHeight: '80vh' }}>
          <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>
          <div style={S.sheetHeader}>
            <span style={S.sheetTitle}>Meeting Chat</span>
            <button style={S.sheetClose} onClick={closeSheet}>×</button>
          </div>
          <div style={{ ...S.sheetBody, paddingBottom: 0 }}>
            <div style={S.chatMessages}>
              {(messages || []).length === 0 ? (
                <div style={{ textAlign: 'center', color: '#444', fontSize: 12, padding: '20px 0' }}>
                  No messages yet. Chat is visible to everyone in this Foundry.
                </div>
              ) : (
                (messages || []).map((msg, i) => (
                  <div key={i} style={S.chatMsg}>
                    <div style={S.chatAvatar}>{initials(msg.sender)}</div>
                    <div>
                      <div style={S.chatSender}>{msg.sender} <span style={{ fontWeight: 400, color: '#444' }}>{msg.time}</span></div>
                      <div style={S.chatText}>{msg.text}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div style={S.chatInputRow}>
            <input
              style={S.chatInput}
              placeholder="Send to everyone…"
              value={chatDraft}
              onChange={e => setChatDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              aria-label="Chat message"
            />
            <button style={S.chatSendBtn} onClick={sendChat}>→</button>
          </div>
        </div>
      )}

      {/* More sheet */}
      {activeSheet === 'more' && (
        <div style={S.sheet}>
          <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>
          <div style={S.sheetHeader}>
            <span style={S.sheetTitle}>More options</span>
            <button style={S.sheetClose} onClick={closeSheet}>×</button>
          </div>
          <div style={S.sheetBody}>
            <div style={S.moreMenu}>
              <button style={S.moreItem} onClick={() => { onShareScreen?.(); closeSheet(); }}>
                <span style={S.moreIcon}>📺</span>
                <span style={S.moreLabel}>{isScreenSharing ? 'Stop sharing' : 'Share screen'}</span>
              </button>
              <button style={S.moreItem} onClick={() => { onRecordToggle?.(); closeSheet(); }}>
                <span style={S.moreIcon}>{isRecording ? '⏹' : '⏺'}</span>
                <span style={S.moreLabel}>{isRecording ? 'Stop recording' : 'Record session'}</span>
              </button>
              <div style={S.moreSep} />
              {isHost && (
                <>
                  <button style={S.moreItem} onClick={() => { onMuteAll?.(); closeSheet(); }}>
                    <span style={S.moreIcon}>🔇</span>
                    <span style={S.moreLabel}>Mute all</span>
                  </button>
                  <button style={S.moreItem} onClick={() => { onLockRoom?.(); closeSheet(); }}>
                    <span style={S.moreIcon}>🔒</span>
                    <span style={S.moreLabel}>Lock / unlock Foundry</span>
                  </button>
                  <button
                    style={{ ...S.moreItem, color: '#ef5350' }}
                    onClick={() => { closeSheet(); onEnd?.(); }}
                  >
                    <span style={S.moreIcon}>📵</span>
                    <span style={{ ...S.moreLabel, color: '#ef5350' }}>End Foundry for all</span>
                  </button>
                </>
              )}
              {!isHost && (
                <button
                  style={{ ...S.moreItem }}
                  onClick={() => { closeSheet(); onEnd?.(); }}
                >
                  <span style={S.moreIcon}>🚪</span>
                  <span style={S.moreLabel}>Leave Foundry</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}