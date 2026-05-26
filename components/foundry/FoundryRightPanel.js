// components/foundry/FoundryRightPanel.js
// Right panel with People / Chat / Files / Notes tabs.
// Chat tab has two sub-views:
//   - Meeting Chat: ephemeral Daily sendAppMessage, session only
//   - Direct Messages: full Signal inbox via FoundrySignalPanel

import { useState, useRef, useEffect } from 'react';
import FoundrySignalPanel from './FoundrySignalPanel';

const ORANGE = '#FF7043';

const S = {
  panel: {
    width: 274, flexShrink: 0, background: 'rgba(255,255,255,0.025)',
    borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column',
    fontFamily: "'DM Sans', sans-serif",
  },
  tabBar: { display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 2px' },
  tab: (active) => ({
    flex: 1, background: 'none', border: 'none',
    borderBottom: active ? `2px solid ${ORANGE}` : '2px solid transparent',
    color: active ? ORANGE : '#555', cursor: 'pointer', fontSize: 11, fontWeight: 500,
    padding: '9px 2px', transition: 'all 0.15s', whiteSpace: 'nowrap', textAlign: 'center',
    fontFamily: "'DM Sans', sans-serif",
  }),
  content: { flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column' },

  // Chat sub-tabs
  chatSub: {
    display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)',
    borderRadius: 5, padding: 2, marginBottom: 10, flexShrink: 0,
  },
  subBtn: (active) => ({
    flex: 1, background: active ? 'rgba(255,255,255,0.07)' : 'none',
    border: 'none', color: active ? '#ccc' : '#555', cursor: 'pointer',
    fontSize: 10, fontWeight: 500, padding: '4px 6px', borderRadius: 3,
    transition: 'all 0.15s', textAlign: 'center', fontFamily: "'DM Sans', sans-serif",
  }),

  // Meeting chat
  msgs: { display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', minHeight: 0 },
  msgRow: { display: 'flex', gap: 6 },
  msgAv: (color) => ({
    width: 24, height: 24, borderRadius: '50%', background: color || '#5C6BC0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 9, fontWeight: 600, color: '#fff', flexShrink: 0, marginTop: 1,
  }),
  msgName: { fontSize: 11, fontWeight: 600, color: '#bbb' },
  msgTime: { fontSize: 9, color: '#444', marginLeft: 5 },
  msgText: { fontSize: 11, color: '#888', lineHeight: 1.5, marginTop: 1 },
  chatIn: {
    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
    background: 'rgba(255,255,255,0.05)', borderRadius: 7, padding: '6px 8px',
    border: '1px solid rgba(255,255,255,0.06)', marginTop: 8,
  },
  chatInEl: { background: 'none', border: 'none', outline: 'none', color: '#ccc', fontSize: 11, flex: 1, fontFamily: 'inherit' },
  sendB: { background: ORANGE, border: 'none', color: '#fff', borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontSize: 13 },

  // Convert to notes button
  convertBtn: {
    width: '100%', background: 'rgba(255,200,50,0.08)', border: '1px solid rgba(255,200,50,0.15)',
    color: 'rgba(255,200,50,0.7)', fontSize: 10, padding: '6px 10px', borderRadius: 6,
    cursor: 'pointer', fontFamily: 'inherit', marginTop: 6, transition: 'all 0.15s',
  },

  // People
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(255,255,255,0.05)', borderRadius: 6,
    padding: '5px 9px', marginBottom: 8, border: '1px solid rgba(255,255,255,0.05)',
  },
  searchInput: { background: 'none', border: 'none', outline: 'none', color: '#ccc', fontSize: 12, flex: 1, fontFamily: 'inherit' },
  inviteBtn: {
    width: '100%', background: 'rgba(255,112,67,0.1)', border: '1px solid rgba(255,112,67,0.25)',
    color: ORANGE, fontSize: 11, padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, fontFamily: 'inherit',
  },
  sectionLabel: { fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, margin: '6px 0 5px' },
  participantRow: { display: 'flex', alignItems: 'center', gap: 7, padding: '5px 5px', borderRadius: 6, cursor: 'pointer' },
  pav: (color) => ({ width: 28, height: 28, borderRadius: '50%', background: color || '#5C6BC0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#fff', flexShrink: 0 }),
  pName: { fontSize: 11, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  pRole: { fontSize: 10, color: '#555' },
  dmBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#666', fontSize: 9, padding: '2px 5px', borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit' },
  hcBtn: { width: '100%', background: 'none', border: 'none', color: '#555', fontSize: 11, padding: '5px 5px', borderRadius: 5, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, fontFamily: 'inherit' },

  // Files
  fsec: { marginBottom: 12 },
  fsh: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  fshl: { display: 'flex', alignItems: 'center', gap: 5 },
  fshlabel: { fontSize: 11, fontWeight: 600, color: '#bbb' },
  fshcount: { fontSize: 9, color: '#555', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 3 },
  addF: (accent) => ({ background: 'none', border: `1px solid ${accent ? 'rgba(255,112,67,0.25)' : 'rgba(255,255,255,0.08)'}`, color: accent ? ORANGE : '#666', fontSize: 9, padding: '2px 6px', borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, fontFamily: 'inherit' }),
  fi: { display: 'flex', alignItems: 'center', gap: 7, padding: '6px 7px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, marginBottom: 4, border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' },
  fname: { fontSize: 10, color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  fmeta: { fontSize: 9, color: '#4a4a4a' },
  liveBadge: { fontSize: 8, background: 'rgba(76,175,80,0.12)', color: '#4caf50', border: '1px solid rgba(76,175,80,0.18)', padding: '1px 4px', borderRadius: 2, marginLeft: 4 },
  emptyDrop: { textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.015)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 7, color: '#3a3a3a', fontSize: 10, lineHeight: 1.6, cursor: 'pointer' },
  fdiv: { border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '10px 0' },

  // Notes
  sticky: { background: '#1a1a10', border: '1px solid rgba(255,200,50,0.12)', borderRadius: 8, padding: 10, flex: 1 },
  stickyHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,200,50,0.08)' },
  stickyTitle: { fontSize: 10, color: 'rgba(255,200,50,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },
  noteArea: { background: 'none', border: 'none', outline: 'none', color: '#aaa', fontSize: 11, lineHeight: 1.7, width: '100%', resize: 'none', fontFamily: 'inherit', minHeight: 120 },
  noteSaved: { fontSize: 9, color: '#3a3a3a', textAlign: 'right', marginTop: 3 },
  aiTeaser: { background: 'rgba(255,112,67,0.04)', border: '1px dashed rgba(255,112,67,0.15)', borderRadius: 7, padding: '10px 12px', display: 'flex', gap: 8, marginTop: 8 },
  aiCopy: { fontSize: 10, color: '#444', lineHeight: 1.6 },
  aiSoon: { fontSize: 9, color: ORANGE, opacity: 0.5, marginTop: 2 },
};

const TABS = ['People', 'Chat', 'Files', 'Notes'];

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

// ── People Tab ─────────────────────────────────────────────────
function PeopleTab({ participants, isHost, onDmParticipant }) {
  const [query, setQuery] = useState('');
  const filtered = participants.filter(p => p.name?.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      <div style={S.searchBox}>
        <span style={{ color: '#555', fontSize: 13 }}>⌕</span>
        <input style={S.searchInput} placeholder="Search participants…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search participants" />
      </div>
      <button style={S.inviteBtn}><span>+</span> Invite to Foundry</button>
      <div style={S.sectionLabel}>In this Foundry ({participants.length})</div>
      {filtered.map(p => (
        <div key={p.id} style={S.participantRow}>
          {p.avatarUrl ? (
            <img src={p.avatarUrl} alt={p.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={S.pav()}>{initials(p.name)}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.pName}>{p.name}</div>
            <div style={S.pRole}>{p.isHost ? 'Host' : 'Participant'}{p.local ? ' (You)' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: p.micMuted ? '#ef5350' : '#4caf50' }}>{p.micMuted ? '🔇' : '🎤'}</span>
            <span style={{ fontSize: 11, color: p.videoOff ? '#ef5350' : '#4caf50' }}>{p.videoOff ? '📵' : '📹'}</span>
            {!p.local && (
              <button style={S.dmBtn} onClick={() => onDmParticipant(p)}>DM</button>
            )}
          </div>
        </div>
      ))}
      {isHost && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={S.sectionLabel}>Host controls</div>
          <button style={S.hcBtn}>🔇 Mute all</button>
          <button style={S.hcBtn}>🔒 Lock Foundry</button>
          <button style={S.hcBtn}>✕ Remove participant</button>
        </div>
      )}
    </div>
  );
}

// ── Chat Tab ───────────────────────────────────────────────────
function ChatTab({
  messages, onSend,
  currentUserId, currentUserRole, participants,
  notes, onNotesChange, onConvertChatToNotes,
  onDmParticipant,
}) {
  const [sub, setSub] = useState('meeting');
  const [draft, setDraft] = useState('');
  const [dmTarget, setDmTarget] = useState(null); // participant to DM

  const handleSend = () => {
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
  };

  // When DM button clicked from People tab, switch to DMs sub and open that participant
  const handleDmParticipant = (p) => {
    setSub('dms');
    setDmTarget(p);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={S.chatSub}>
        <button style={S.subBtn(sub === 'meeting')} onClick={() => setSub('meeting')}>Meeting Chat</button>
        <button style={S.subBtn(sub === 'dms')} onClick={() => setSub('dms')}>Direct Messages</button>
      </div>

      {sub === 'meeting' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={S.msgs}>
            {messages.length === 0 && (
              <div style={{ fontSize: 11, color: '#444', textAlign: 'center', padding: '20px 0' }}>
                Meeting chat is live and ephemeral — messages disappear when the Foundry ends.
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={S.msgRow}>
                {msg.avatarUrl ? (
                  <img src={msg.avatarUrl} alt={msg.sender} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: 1 }} />
                ) : (
                  <div style={S.msgAv(msg.color)}>{initials(msg.sender)}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={S.msgName}>{msg.sender}</span>
                  <span style={S.msgTime}>{msg.time}</span>
                  <div style={S.msgText}>{msg.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={S.chatIn}>
            <input
              style={S.chatInEl}
              placeholder="Send to everyone…"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              aria-label="Meeting chat message"
            />
            <button style={S.sendB} onClick={handleSend} aria-label="Send">→</button>
          </div>
          {messages.length > 0 && (
            <button style={S.convertBtn} onClick={() => onConvertChatToNotes(messages)}>
              📝 Convert chat to session notes
            </button>
          )}
        </div>
      )}

      {sub === 'dms' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <FoundrySignalPanel
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            foundryParticipants={participants.filter(p => !p.local)}
            initialDmTarget={dmTarget}
          />
        </div>
      )}
    </div>
  );
}

// ── Files Tab ──────────────────────────────────────────────────
function FilesTab({ sharedFiles, forgeFiles, onShare, onUpload }) {
  return (
    <div>
      <div style={S.fsec}>
        <div style={S.fsh}>
          <div style={S.fshl}>
            <span style={{ color: '#4caf50', fontSize: 14 }}>⊞</span>
            <span style={S.fshlabel}>Shared</span>
            <span style={S.fshcount}>{sharedFiles.length} {sharedFiles.length === 1 ? 'file' : 'files'}</span>
          </div>
          <button style={S.addF(false)}>+ Add</button>
        </div>
        {sharedFiles.length === 0 ? (
          <div style={{ ...S.emptyDrop, cursor: 'default' }}>Nothing shared yet. Share from Your Forge or Computer.</div>
        ) : (
          sharedFiles.map((f, i) => (
            <div key={i} style={S.fi}>
              <span style={{ fontSize: 16 }}>📄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.fname}>{f.name}</div>
                <div style={S.fmeta}>{f.sharedBy} · {f.ago}<span style={S.liveBadge}>live</span></div>
              </div>
              <span style={{ fontSize: 12, color: '#555' }}>↓</span>
            </div>
          ))
        )}
      </div>
      <div style={S.fdiv} />
      <div style={S.fsec}>
        <div style={S.fsh}>
          <div style={S.fshl}>
            <span style={{ color: ORANGE, fontSize: 14 }}>🔨</span>
            <span style={S.fshlabel}>Your Forge</span>
          </div>
          <button style={S.addF(true)} onClick={() => onShare && onShare()}>↗ Share</button>
        </div>
        {forgeFiles.length === 0 ? (
          <div style={{ fontSize: 10, color: '#3a3a3a', padding: '8px 0' }}>No documents in your Forge yet.</div>
        ) : (
          forgeFiles.map((f, i) => (
            <div key={i} style={S.fi} onClick={() => onShare(f)}>
              <span style={{ fontSize: 16 }}>📋</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.fname}>{f.name}</div>
                <div style={S.fmeta}>{f.type} · {f.ago}</div>
              </div>
              <span style={{ fontSize: 12, color: '#555' }}>↗</span>
            </div>
          ))
        )}
      </div>
      <div style={S.fdiv} />
      <div style={S.fsec}>
        <div style={S.fsh}>
          <div style={S.fshl}>
            <span style={{ color: '#666', fontSize: 14 }}>💻</span>
            <span style={{ ...S.fshlabel, color: '#888' }}>Computer</span>
          </div>
          <button style={S.addF(false)} onClick={onUpload}>↑ Upload</button>
        </div>
        <div style={S.emptyDrop} onClick={onUpload}>
          <div style={{ fontSize: 18, marginBottom: 4, color: 'rgba(255,255,255,0.1)' }}>↑</div>
          Drop a file or click to upload
        </div>
      </div>
    </div>
  );
}

// ── Notes Tab ──────────────────────────────────────────────────
function NotesTab({ notes, onNotesChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={S.sticky}>
        <div style={S.stickyHeader}>
          <span style={S.stickyTitle}>📝 Session notes</span>
          <span style={{ fontSize: 9, color: 'rgba(255,200,50,0.25)' }}>Foundry · Live</span>
        </div>
        <textarea
          style={S.noteArea}
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          placeholder="Quick notes, action items, reminders…"
          aria-label="Session notes"
        />
      </div>
      <div style={S.noteSaved}>💾 Auto-saved</div>
      <div style={S.aiTeaser}>
        <span style={{ fontSize: 18, color: 'rgba(255,112,67,0.35)', flexShrink: 0 }}>🧠</span>
        <div>
          <div style={S.aiCopy}>Forge AI will generate a structured coaching debrief at the end of this session.</div>
          <div style={S.aiSoon}>Coming soon · Forge Intelligence</div>
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────
export default function FoundryRightPanel({
  participants = [],
  messages = [],
  sharedFiles = [],
  forgeFiles = [],
  notes = '',
  onNotesChange,
  onSend,
  onShare,
  onUpload,
  isHost = false,
  initialTab = 'People',
  currentUserId,
  currentUserRole,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Convert meeting chat to notes
  const handleConvertChatToNotes = (msgs) => {
    const transcript = msgs.map(m => `[${m.time}] ${m.sender}: ${m.text}`).join('\n');
    const appended = notes
      ? `${notes}\n\n--- Meeting Chat ---\n${transcript}`
      : `--- Meeting Chat ---\n${transcript}`;
    onNotesChange(appended);
    setActiveTab('Notes');
  };

  // DM a participant — switch to Chat > DMs
  const handleDmParticipant = () => {
    setActiveTab('Chat');
  };

  return (
    <div style={S.panel}>
      <div style={S.tabBar} role="tablist">
        {TABS.map(tab => (
          <button
            key={tab}
            style={S.tab(activeTab === tab)}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={S.content}>
        {activeTab === 'People' && (
          <PeopleTab
            participants={participants}
            isHost={isHost}
            onDmParticipant={handleDmParticipant}
          />
        )}
        {activeTab === 'Chat' && (
          <ChatTab
            messages={messages}
            onSend={onSend}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            participants={participants}
            notes={notes}
            onNotesChange={onNotesChange}
            onConvertChatToNotes={handleConvertChatToNotes}
            onDmParticipant={handleDmParticipant}
          />
        )}
        {activeTab === 'Files' && (
          <FilesTab
            sharedFiles={sharedFiles}
            forgeFiles={forgeFiles}
            onShare={onShare}
            onUpload={onUpload}
          />
        )}
        {activeTab === 'Notes' && (
          <NotesTab notes={notes} onNotesChange={onNotesChange} />
        )}
      </div>
    </div>
  );
}