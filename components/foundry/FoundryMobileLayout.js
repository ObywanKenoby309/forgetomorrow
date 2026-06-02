// components/foundry/FoundryMobileLayout.js
// Mobile-first Foundry room layout.
// Video fills the full screen. Controls overlay on top.
// Panels slide up as bottom sheets.
// Sheets: Chat | People | Files | Notes | More (screen share, record, invite, host controls)

import { useState, useEffect, useRef, useCallback } from 'react';

const ORANGE = '#FF7043';
const DARK = '#141720';

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  root: {
    position: 'fixed', inset: 0,
    background: '#000',
    display: 'flex', flexDirection: 'column',
    fontFamily: "'DM Sans', sans-serif",
    userSelect: 'none', WebkitUserSelect: 'none',
  },
  videoWrap: { position: 'absolute', inset: 0, zIndex: 1 },

  // Top overlay
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.70) 0%, transparent 100%)',
  },
  topLeft: { display: 'flex', flexDirection: 'column', gap: 1 },
  sessionTitle: {
    fontSize: 13, fontWeight: 700, color: '#fff',
    maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
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
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
    padding: '12px 8px 28px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, transparent 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-around',
  },
  ctrlBtn: (active, danger) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    background: active
      ? (danger ? 'rgba(198,40,40,0.35)' : 'rgba(255,112,67,0.28)')
      : 'rgba(255,255,255,0.12)',
    border: 'none', borderRadius: 12, padding: '10px 12px',
    cursor: 'pointer', minWidth: 52,
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    color: active ? (danger ? '#ef9a9a' : ORANGE) : 'rgba(255,255,255,0.85)',
    position: 'relative',
  }),
  ctrlIcon: { fontSize: 19, lineHeight: 1 },
  ctrlLabel: { fontSize: 9, fontWeight: 600, whiteSpace: 'nowrap' },
  badge: {
    position: 'absolute', top: 4, right: 4,
    background: ORANGE, color: '#fff',
    fontSize: 8, fontWeight: 800, borderRadius: 8,
    minWidth: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 3px',
  },

  // Sheet system
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 20 },
  sheet: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 21,
    background: DARK, borderRadius: '16px 16px 0 0',
    maxHeight: '80vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
  },
  sheetHandle: { display: 'flex', justifyContent: 'center', padding: '10px 0 4px' },
  sheetHandleBar: { width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' },
  sheetHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '4px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  sheetTitle: { fontSize: 15, fontWeight: 700, color: '#f0f0f0' },
  sheetClose: { background: 'none', border: 'none', color: '#555', fontSize: 22, cursor: 'pointer', padding: 0 },
  sheetBody: { flex: 1, overflowY: 'auto', padding: '12px 16px' },

  // People
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
  hostCtrlBtn: {
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#ddd', borderRadius: 6, fontSize: 11, padding: '4px 8px', cursor: 'pointer',
  },
  banBtn: {
    background: 'rgba(239,83,80,0.12)', border: '1px solid rgba(239,83,80,0.24)',
    color: '#ef9a9a', borderRadius: 6, fontSize: 11, padding: '4px 8px', cursor: 'pointer',
  },

  // Chat
  chatMessages: { display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 12 },
  chatMsg: { display: 'flex', gap: 8 },
  chatAvatar: {
    width: 28, height: 28, borderRadius: '50%', background: '#5C6BC0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 600, color: '#fff', flexShrink: 0, marginTop: 2,
  },
  chatSender: { fontSize: 12, fontWeight: 700, color: '#aaa', marginBottom: 2 },
  chatTime: { fontWeight: 400, color: '#444', marginLeft: 4 },
  chatText: { fontSize: 13, color: '#ccc', lineHeight: 1.5 },
  chatInputRow: {
    display: 'flex', gap: 8, padding: '10px 16px 24px',
    borderTop: '1px solid rgba(255,255,255,0.06)', background: DARK, flexShrink: 0,
  },
  chatInput: {
    flex: 1, background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20, padding: '10px 14px',
    color: '#e0e0e0', fontSize: 13, outline: 'none', fontFamily: 'inherit',
  },
  chatSendBtn: {
    background: ORANGE, border: 'none', color: '#fff',
    borderRadius: 20, padding: '10px 16px',
    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
  },

  // Files
  filesSection: { marginBottom: 16 },
  filesSectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  filesSectionTitle: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 700, color: '#bbb',
  },
  filesSectionCount: {
    fontSize: 10, color: '#444', background: 'rgba(255,255,255,0.05)',
    padding: '1px 5px', borderRadius: 3,
  },
  fileRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 10px', background: 'rgba(255,255,255,0.03)',
    borderRadius: 8, marginBottom: 6, border: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer',
  },
  fileName: { flex: 1, fontSize: 12, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  fileMeta: { fontSize: 10, color: '#4a4a4a' },
  fileOpenBtn: {
    background: 'rgba(255,112,67,0.12)', border: '1px solid rgba(255,112,67,0.2)',
    color: ORANGE, fontSize: 11, fontWeight: 700, padding: '5px 10px',
    borderRadius: 6, cursor: 'pointer', flexShrink: 0,
  },
  fileShareBtn: {
    background: 'rgba(255,112,67,0.12)', border: '1px solid rgba(255,112,67,0.2)',
    color: ORANGE, fontSize: 11, fontWeight: 700, padding: '5px 10px',
    borderRadius: 6, cursor: 'pointer', flexShrink: 0,
  },
  emptyFiles: {
    textAlign: 'center', padding: '20px 8px',
    background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)',
    borderRadius: 8, color: '#3a3a3a', fontSize: 12, lineHeight: 1.6,
  },
  filesDivider: { height: 1, background: 'rgba(255,255,255,0.05)', margin: '14px 0' },
  uploadBtn: {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8,
    padding: '14px', textAlign: 'center', cursor: 'pointer', color: '#555',
    fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  },

  // Notes
  notesArea: {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,200,50,0.10)',
    borderRadius: 10, padding: '12px', color: '#ccc',
    fontSize: 13, lineHeight: 1.7, outline: 'none',
    fontFamily: 'inherit', resize: 'none', minHeight: 200, boxSizing: 'border-box',
  },
  notesSaveState: { fontSize: 10, color: '#3a3a3a', textAlign: 'right', marginTop: 6 },
  notesAiHint: {
    marginTop: 12, background: 'rgba(255,112,67,0.04)',
    border: '1px dashed rgba(255,112,67,0.15)',
    borderRadius: 8, padding: '10px 12px',
    display: 'flex', gap: 8, alignItems: 'flex-start',
  },

  // More menu
  moreMenu: { display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 8 },
  moreItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 4px', borderRadius: 8, cursor: 'pointer',
    background: 'none', border: 'none', width: '100%', textAlign: 'left',
    fontFamily: 'inherit',
  },
  moreIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  moreLabel: { fontSize: 14, color: '#ddd', fontWeight: 500 },
  moreSublabel: { fontSize: 11, color: '#555', marginTop: 1 },
  moreSep: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' },

  // Invite panel
  inviteSection: { marginBottom: 14 },
  inviteLabel: { fontSize: 11, color: '#666', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  inviteLinkRow: {
    display: 'flex', gap: 8, alignItems: 'center',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '8px 10px',
  },
  inviteLinkText: { flex: 1, fontSize: 11, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  copyBtn: {
    background: 'rgba(255,112,67,0.12)', border: '1px solid rgba(255,112,67,0.2)',
    color: ORANGE, fontSize: 11, fontWeight: 700, padding: '5px 10px',
    borderRadius: 6, cursor: 'pointer', flexShrink: 0,
  },
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
  children,

  // Session
  sessionTitle,
  startTime,
  isRecording,
  roomId,

  // AV
  micMuted, camOff, isScreenSharing,
  onMicToggle, onCamToggle, onShareScreen, onRecordToggle,

  // Panels — People
  participants,
  isHost,
  onMuteAll,
  onMuteParticipant,
  onKickParticipant,
  onBanParticipant,
  onLockRoom,
  onStopParticipantShare,

  // Panels — Chat
  messages,
  onSend,
  sessionDms,
  selectedDmParticipant,
  onSelectDmParticipant,
  onSendDm,

  // Panels — Files
  sharedFiles,
  forgeFiles,
  onShare,
  onUpload,
  onRemoveFile,
  guestCode,

  // Panels — Notes
  notes,
  onNotesChange,

  // End
  onEnd,

  // Guest mode — no forge files, no host controls
  isGuest,
}) {
  const [activeSheet, setActiveSheet] = useState(null);
  const [chatDraft, setChatDraft] = useState('');
  const [dmDraft, setDmDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaveState, setNotesSaveState] = useState('idle');
  const [copiedLink, setCopiedLink] = useState('');
  const [unreadChat, setUnreadChat] = useState(0);
  // Safe defaults — prevent null/undefined crashes on any prop
  const safeMessages = messages || [];
  const safeParticipants = participants || [];
  const safeSharedFiles = sharedFiles || [];
  const safeForgeFiles = forgeFiles || [];
  const safeNotes = notes || '';
  const notesSaveTimer = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Track unread chat messages
  const prevMsgCount = useRef(0);
  useEffect(() => {
    if (activeSheet !== 'chat' && safeMessages.length > prevMsgCount.current) {
      setUnreadChat(v => v + (safeMessages.length - prevMsgCount.current));
    }
    prevMsgCount.current = safeMessages.length;
  }, [safeMessages, activeSheet]);

  // Clear unread when chat opens
  useEffect(() => {
    if (activeSheet === 'chat') setUnreadChat(0);
  }, [activeSheet]);

  // Scroll chat to bottom
  useEffect(() => {
    if (activeSheet === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [safeMessages, activeSheet]);

  // Sync notes from parent
  useEffect(() => { setNotesDraft(safeNotes); }, [safeNotes]);

  const closeSheet = useCallback(() => setActiveSheet(null), []);

  const sendChat = () => {
    if (!chatDraft.trim()) return;
    onSend?.(chatDraft.trim());
    setChatDraft('');
  };

  const handleNotesChange = (val) => {
    setNotesDraft(val);
    setNotesSaveState('saving');
    clearTimeout(notesSaveTimer.current);
    notesSaveTimer.current = setTimeout(() => {
      onNotesChange?.(val);
      setNotesSaveState('saved');
    }, 1500);
  };

  const openSharedFile = (file) => {
    if (!file?.downloadUrl) return;
    const storedCode = typeof window !== 'undefined' ? sessionStorage.getItem('foundry_guest_code') || '' : '';
    const code = guestCode || storedCode;
    const url = code ? `${file.downloadUrl}&guestCode=${encodeURIComponent(code)}` : file.downloadUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyText = (label, value) => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopiedLink(label);
      setTimeout(() => setCopiedLink(''), 1800);
    }).catch(() => {});
  };

  const ftLink = roomId && typeof window !== 'undefined' ? `${window.location.origin}/foundry/${roomId}` : '';
  const guestLink = roomId && guestCode && typeof window !== 'undefined'
    ? `${window.location.origin}/foundry/join/${roomId}?code=${guestCode}`
    : '';

  return (
    <div style={S.root}>
      <style>{`
        @keyframes foundryPulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
      `}</style>

      {/* Video — full screen */}
      <div style={S.videoWrap}>{children}</div>

      {/* Top bar */}
      <div style={S.topBar}>
        <div style={S.topLeft}>
          <div style={S.sessionTitle}>{sessionTitle || 'Foundry'}</div>
          <div style={S.timer}>
            <Timer startTime={startTime} />
            {isRecording && ' · REC'}
          </div>
        </div>
        <button style={S.endBtn} onClick={onEnd}>End</button>
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
        <button style={S.ctrlBtn(micMuted, micMuted)} onClick={onMicToggle}>
          <span style={S.ctrlIcon}>{micMuted ? '🔇' : '🎤'}</span>
          <span style={S.ctrlLabel}>{micMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* Camera */}
        <button style={S.ctrlBtn(camOff, camOff)} onClick={onCamToggle}>
          <span style={S.ctrlIcon}>{camOff ? '📵' : '📹'}</span>
          <span style={S.ctrlLabel}>Camera</span>
        </button>

        {/* Chat — with unread badge */}
        <button style={S.ctrlBtn(activeSheet === 'chat', false)} onClick={() => setActiveSheet(activeSheet === 'chat' ? null : 'chat')}>
          <span style={S.ctrlIcon}>💬</span>
          <span style={S.ctrlLabel}>Chat</span>
          {unreadChat > 0 && <span style={S.badge}>{unreadChat > 9 ? '9+' : unreadChat}</span>}
        </button>

        {/* Files */}
        <button style={S.ctrlBtn(activeSheet === 'files', false)} onClick={() => setActiveSheet(activeSheet === 'files' ? null : 'files')}>
          <span style={S.ctrlIcon}>📁</span>
          <span style={S.ctrlLabel}>Files</span>
          {(safeSharedFiles.length > 0) && <span style={S.badge}>{safeSharedFiles.length > 9 ? '9+' : safeSharedFiles.length}</span>}
        </button>

        {/* People */}
        <button style={S.ctrlBtn(activeSheet === 'people', false)} onClick={() => setActiveSheet(activeSheet === 'people' ? null : 'people')}>
          <span style={S.ctrlIcon}>👥</span>
          <span style={S.ctrlLabel}>People{safeParticipants.length > 0 ? ` (${safeParticipants.length})` : ''}</span>
        </button>

        {/* More */}
        <button style={{ ...S.ctrlBtn(activeSheet === 'more', false) }} onClick={() => setActiveSheet(activeSheet === 'more' ? null : 'more')}>
          <span style={S.ctrlIcon}>⋯</span>
          <span style={S.ctrlLabel}>More</span>
        </button>
      </div>

      {/* Sheet backdrop */}
      {activeSheet && <div style={S.backdrop} onClick={closeSheet} />}

      {/* ── PEOPLE SHEET ──────────────────────────────────────────────── */}
      {activeSheet === 'people' && (
        <div style={S.sheet}>
          <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>
          <div style={S.sheetHeader}>
            <span style={S.sheetTitle}>In this Foundry ({safeParticipants.length})</span>
            <button style={S.sheetClose} onClick={closeSheet}>×</button>
          </div>
          <div style={S.sheetBody}>
            {isHost && (
              <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={{ ...S.hostCtrlBtn, fontSize: 12, padding: '7px 12px' }} onClick={() => { onMuteAll?.(); closeSheet(); }}>
                  🔇 Mute all
                </button>
                <button style={{ ...S.hostCtrlBtn, fontSize: 12, padding: '7px 12px' }} onClick={() => { onLockRoom?.(); closeSheet(); }}>
                  🔒 Lock Foundry
                </button>
              </div>
            )}
            {safeParticipants.map(p => (
              <div key={p.id} style={S.participantRow}>
                {p.avatarUrl
                  ? <img src={p.avatarUrl} alt={p.name} style={{ ...S.participantAvatar, objectFit: 'cover' }} />
                  : <div style={S.participantAvatar}>{initials(p.name)}</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.participantName}>{p.name}{p.local ? ' (You)' : ''}</div>
                  <div style={S.participantRole}>{p.isHost ? 'Host' : 'Participant'}</div>
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 14, color: p.micMuted ? '#ef5350' : '#4caf50' }}>{p.micMuted ? '🔇' : '🎤'}</span>
                  <span style={{ fontSize: 14, color: p.videoOff ? '#ef5350' : '#4caf50' }}>{p.videoOff ? '📵' : '📹'}</span>
                  {isHost && !p.local && (
  <>
    <button
      style={S.hostCtrlBtn}
      onClick={() => {
        onSelectDmParticipant?.(p);
        setActiveSheet('dm');
      }}
    >
      DM
    </button>

    <button style={S.hostCtrlBtn} onClick={() => onMuteParticipant?.(p)}>Mute</button>

    <button style={S.hostCtrlBtn} onClick={() => onStopParticipantShare?.(p)}>Stop share</button>

    <button style={S.hostCtrlBtn} onClick={() => onKickParticipant?.(p)}>Kick</button>

    <button style={S.banBtn} onClick={() => onBanParticipant?.(p)}>Ban</button>
  </>
)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CHAT SHEET ────────────────────────────────────────────────── */}
      {activeSheet === 'chat' && (
        <div style={{ ...S.sheet, maxHeight: '82vh' }}>
          <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>
          <div style={S.sheetHeader}>
            <span style={S.sheetTitle}>Meeting Chat</span>
            <button style={S.sheetClose} onClick={closeSheet}>×</button>
          </div>
          <div style={{ ...S.sheetBody, paddingBottom: 0 }}>
            <div style={S.chatMessages}>
              {safeMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#444', fontSize: 12, padding: '20px 0' }}>
                  Chat is visible to everyone in this Foundry. Messages disappear when the session ends.
                </div>
              ) : (
                safeMessages.map((msg, i) => (
                  <div key={i} style={S.chatMsg}>
                    {msg.avatarUrl
                      ? <img src={msg.avatarUrl} alt={msg.sender} style={{ ...S.chatAvatar, objectFit: 'cover' }} />
                      : <div style={S.chatAvatar}>{initials(msg.sender)}</div>
                    }
                    <div>
                      <span style={S.chatSender}>{msg.sender}</span>
                      <span style={S.chatTime}>{msg.time}</span>
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
              autoFocus
            />
            <button style={S.chatSendBtn} onClick={sendChat}>→</button>
          </div>
        </div>
      )}

{activeSheet === 'dm' && (
  <div style={{ ...S.sheet, maxHeight: '82vh' }}>
    <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>

    <div style={S.sheetHeader}>
      <span style={S.sheetTitle}>
        DM · {selectedDmParticipant?.name || 'Participant'}
      </span>

      <button
        style={S.sheetClose}
        onClick={closeSheet}
      >
        ×
      </button>
    </div>

    <div style={{ ...S.sheetBody, paddingBottom: 0 }}>
      <div style={S.chatMessages}>
        {(sessionDms || [])
          .filter(dm =>
            dm.fromSessionId === selectedDmParticipant?.id ||
            dm.toSessionId === selectedDmParticipant?.id
          )
          .map(dm => (
            <div key={dm.id} style={S.chatMsg}>
              <div>
                <span style={S.chatSender}>{dm.fromName}</span>
                <span style={S.chatTime}>{dm.time}</span>
                <div style={S.chatText}>{dm.text}</div>
              </div>
            </div>
          ))}
      </div>
    </div>

    <div style={S.chatInputRow}>
      <input
  style={S.chatInput}
  placeholder={`Message ${selectedDmParticipant?.name || ''}`}
  value={dmDraft}
  onChange={(e) => setDmDraft(e.target.value)}
  onKeyDown={(e) => {
    if (
      e.key === 'Enter' &&
      dmDraft.trim() &&
      selectedDmParticipant
    ) {
      onSendDm?.(
        selectedDmParticipant,
        dmDraft.trim()
      );

      setDmDraft('');
    }
  }}
/>

      <button
  style={S.chatSendBtn}
  onClick={() => {
    if (!dmDraft.trim() || !selectedDmParticipant) return;

    onSendDm?.(
      selectedDmParticipant,
      dmDraft.trim()
    );

    setDmDraft('');
  }}
>
  →
</button>
    </div>
  </div>
)}

      {/* ── FILES SHEET ───────────────────────────────────────────────── */}
      {activeSheet === 'files' && (
        <div style={{ ...S.sheet, maxHeight: '85vh' }}>
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onUpload?.(f); e.target.value = ''; }} />
          <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>
          <div style={S.sheetHeader}>
            <span style={S.sheetTitle}>Files</span>
            <button style={S.sheetClose} onClick={closeSheet}>×</button>
          </div>
          <div style={S.sheetBody}>

            {/* Shared files */}
            <div style={S.filesSection}>
              <div style={S.filesSectionHeader}>
                <div style={S.filesSectionTitle}>
                  <span style={{ color: '#4caf50' }}>⊞</span>
                  Shared in session
                  <span style={S.filesSectionCount}>{safeSharedFiles.length}</span>
                </div>
                {isHost && (
                  <button style={S.copyBtn} onClick={() => fileInputRef.current?.click()}>+ Add</button>
                )}
              </div>
              {safeSharedFiles.length === 0 ? (
                <div style={S.emptyFiles}>Nothing shared yet. Share from Your Forge below.</div>
              ) : (
                safeSharedFiles.map((f, i) => (
                  <div key={f.id || i} style={S.fileRow} onClick={() => openSharedFile(f)}>
                    <span style={{ fontSize: 20 }}>📄</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.fileName}>{f.name}</div>
                      <div style={S.fileMeta}>{f.sharedBy || 'Shared'} · {f.ago || 'just now'}</div>
                    </div>
                    {f.hasFile && <button style={S.fileOpenBtn} onClick={e => { e.stopPropagation(); openSharedFile(f); }}>Open ↗</button>}
                    {isHost && f.id && (
                      <button
                        style={{ ...S.hostCtrlBtn, fontSize: 16, padding: '2px 6px' }}
                        onClick={e => { e.stopPropagation(); onRemoveFile?.(f); }}
                        title="Remove"
                      >×</button>
                    )}
                  </div>
                ))
              )}
            </div>

            {!isGuest && (
              <>
                <div style={S.filesDivider} />

                {/* Your Forge */}
                <div style={S.filesSection}>
                  <div style={S.filesSectionHeader}>
                    <div style={S.filesSectionTitle}>
                      <span style={{ color: ORANGE }}>🔨</span>
                      Your Forge
                    </div>
                    <button style={{ ...S.copyBtn, background: 'rgba(255,112,67,0.12)', borderColor: 'rgba(255,112,67,0.25)' }} onClick={() => onShare?.()}>↗ Share</button>
                  </div>
                  {safeForgeFiles.length === 0 ? (
                    <div style={{ fontSize: 11, color: '#3a3a3a', padding: '8px 0' }}>No documents in your Forge yet.</div>
                  ) : (
                    safeForgeFiles.slice(0, 8).map((f, i) => (
                      <div key={i} style={S.fileRow} onClick={() => onShare?.(f)}>
                        <span style={{ fontSize: 18 }}>📋</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={S.fileName}>{f.name}</div>
                          <div style={S.fileMeta}>{f.type} · {f.ago}</div>
                        </div>
                        <button style={S.fileShareBtn} onClick={e => { e.stopPropagation(); onShare?.(f); }}>↗</button>
                      </div>
                    ))
                  )}
                </div>

                <div style={S.filesDivider} />

                {/* Computer upload */}
                <div style={S.filesSection}>
                  <div style={S.filesSectionHeader}>
                    <div style={S.filesSectionTitle}>
                      <span style={{ color: '#666' }}>💻</span>
                      From Computer
                    </div>
                  </div>
                  <button style={S.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                    <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.1)' }}>↑</span>
                    <span>Tap to upload a file</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── NOTES SHEET ───────────────────────────────────────────────── */}
      {activeSheet === 'notes' && (
        <div style={{ ...S.sheet, maxHeight: '85vh' }}>
          <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>
          <div style={S.sheetHeader}>
            <span style={S.sheetTitle}>📝 Session Notes</span>
            <button style={S.sheetClose} onClick={closeSheet}>×</button>
          </div>
          <div style={S.sheetBody}>
            <textarea
              style={S.notesArea}
              value={notesDraft}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="Quick notes, action items, reminders…"
              rows={10}
              autoFocus
            />
            <div style={S.notesSaveState}>
              {notesSaveState === 'saving' ? '⏳ Saving…' : notesSaveState === 'saved' ? '✓ Saved' : '💾 Auto-saves as you type'}
            </div>
            <div style={S.notesAiHint}>
              <span style={{ fontSize: 18, color: 'rgba(255,112,67,0.35)', flexShrink: 0 }}>🧠</span>
              <div>
                <div style={{ fontSize: 11, color: '#444', lineHeight: 1.6 }}>Forge AI will generate a structured coaching debrief at session end.</div>
                <div style={{ fontSize: 10, color: ORANGE, opacity: 0.5, marginTop: 2 }}>Coming soon · Forge Intelligence</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MORE SHEET ────────────────────────────────────────────────── */}
      {activeSheet === 'more' && (
        <div style={S.sheet}>
          <div style={S.sheetHandle}><div style={S.sheetHandleBar} /></div>
          <div style={S.sheetHeader}>
            <span style={S.sheetTitle}>More options</span>
            <button style={S.sheetClose} onClick={closeSheet}>×</button>
          </div>
          <div style={S.sheetBody}>
            <div style={S.moreMenu}>

              {/* Notes — quick access */}
              <button style={S.moreItem} onClick={() => setActiveSheet('notes')}>
                <span style={S.moreIcon}>📝</span>
                <div>
                  <div style={S.moreLabel}>Session Notes</div>
                  <div style={S.moreSublabel}>Quick notes & action items</div>
                </div>
              </button>

              {/* Screen share */}
              <button style={S.moreItem} onClick={() => { onShareScreen?.(); closeSheet(); }}>
                <span style={S.moreIcon}>📺</span>
                <span style={S.moreLabel}>{isScreenSharing ? 'Stop sharing screen' : 'Share screen'}</span>
              </button>

              {/* Record */}
              <button style={S.moreItem} onClick={() => { onRecordToggle?.(); closeSheet(); }}>
                <span style={S.moreIcon}>{isRecording ? '⏹' : '⏺'}</span>
                <span style={S.moreLabel}>{isRecording ? 'Stop recording' : 'Record session'}</span>
              </button>

              {/* Invite — host only */}
              {isHost && !isGuest && (
                <>
                  <div style={S.moreSep} />
                  <div style={{ padding: '8px 4px 4px' }}>
                    <div style={{ fontSize: 11, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Invite links</div>

                    {ftLink && (
                      <div style={S.inviteSection}>
                        <div style={S.inviteLabel}>ForgeTomorrow members</div>
                        <div style={S.inviteLinkRow}>
                          <span style={S.inviteLinkText}>{ftLink}</span>
                          <button style={S.copyBtn} onClick={() => copyText('ft', ftLink)}>
                            {copiedLink === 'ft' ? '✓' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}

                    {guestLink && (
                      <div style={S.inviteSection}>
                        <div style={S.inviteLabel}>External guests</div>
                        <div style={S.inviteLinkRow}>
                          <span style={S.inviteLinkText}>{guestLink}</span>
                          <button style={S.copyBtn} onClick={() => copyText('guest', guestLink)}>
                            {copiedLink === 'guest' ? '✓' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Host controls */}
              {isHost && (
                <>
                  <div style={S.moreSep} />
                  <button style={S.moreItem} onClick={() => { onMuteAll?.(); closeSheet(); }}>
                    <span style={S.moreIcon}>🔇</span>
                    <span style={S.moreLabel}>Mute all participants</span>
                  </button>
                  <button style={S.moreItem} onClick={() => { onLockRoom?.(); closeSheet(); }}>
                    <span style={S.moreIcon}>🔒</span>
                    <span style={S.moreLabel}>Lock / unlock Foundry</span>
                  </button>
                  <div style={S.moreSep} />
                  <button style={{ ...S.moreItem }} onClick={() => { closeSheet(); onEnd?.(); }}>
                    <span style={S.moreIcon}>📵</span>
                    <span style={{ ...S.moreLabel, color: '#ef5350' }}>End Foundry for all</span>
                  </button>
                </>
              )}

              {!isHost && (
                <>
                  <div style={S.moreSep} />
                  <button style={S.moreItem} onClick={() => { closeSheet(); onEnd?.(); }}>
                    <span style={S.moreIcon}>🚪</span>
                    <span style={S.moreLabel}>Leave Foundry</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}