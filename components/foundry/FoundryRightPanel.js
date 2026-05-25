// components/foundry/FoundryRightPanel.js
import { useState, useRef, useEffect } from 'react';

const ORANGE = '#FF7043';

const S = {
  panel: {
    width: 274, flexShrink: 0, background: 'rgba(255,255,255,0.025)',
    borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column',
    fontFamily: "'DM Sans', sans-serif",
  },
  tabBar: { display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 2px' },
  tab: {
    flex: 1, background: 'none', border: 'none', borderBottom: '2px solid transparent',
    color: '#555', cursor: 'pointer', fontSize: 11, fontWeight: 500,
    padding: '9px 2px', transition: 'all 0.15s', whiteSpace: 'nowrap', textAlign: 'center',
    fontFamily: "'DM Sans', sans-serif",
  },
  tabActive: { color: ORANGE, borderBottomColor: ORANGE },
  content: { flex: 1, overflowY: 'auto', padding: '10px 12px' },
  // People
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(255,255,255,0.05)', borderRadius: 6,
    padding: '5px 9px', marginBottom: 8, border: '1px solid rgba(255,255,255,0.05)',
  },
  searchInput: { background: 'none', border: 'none', outline: 'none', color: '#ccc', fontSize: 12, flex: 1 },
  inviteBtn: {
    width: '100%', background: 'rgba(255,112,67,0.1)', border: '1px solid rgba(255,112,67,0.25)',
    color: ORANGE, fontSize: 11, padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, fontFamily: "'DM Sans', sans-serif",
  },
  sectionLabel: {
    fontSize: 9, color: '#444', textTransform: 'uppercase',
    letterSpacing: '0.08em', fontWeight: 600, margin: '6px 0 5px',
  },
  participantRow: {
    display: 'flex', alignItems: 'center', gap: 7, padding: '5px 5px',
    borderRadius: 6, cursor: 'pointer',
  },
  avatar: (color) => ({
    width: 28, height: 28, borderRadius: '50%', background: color || '#5C6BC0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 600, color: '#fff', flexShrink: 0,
  }),
  pName: { fontSize: 11, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  pRole: { fontSize: 10, color: '#555' },
  dmBtn: {
    background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#666',
    fontSize: 9, padding: '2px 5px', borderRadius: 3, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  hcBtn: {
    width: '100%', background: 'none', border: 'none', color: '#555', fontSize: 11,
    padding: '5px 5px', borderRadius: 5, cursor: 'pointer', textAlign: 'left',
    display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2,
    fontFamily: "'DM Sans', sans-serif",
  },
  // Chat
  chatSub: {
    display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)',
    borderRadius: 5, padding: 2, marginBottom: 10,
  },
  subBtn: {
    flex: 1, background: 'none', border: 'none', color: '#555', cursor: 'pointer',
    fontSize: 10, fontWeight: 500, padding: '4px 6px', borderRadius: 3, textAlign: 'center',
    fontFamily: "'DM Sans', sans-serif",
  },
  subBtnActive: { background: 'rgba(255,255,255,0.07)', color: '#ccc' },
  msgRow: { display: 'flex', gap: 6, marginBottom: 8 },
  msgAvatar: (color) => ({
    width: 24, height: 24, borderRadius: '50%', background: color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 9, fontWeight: 600, color: '#fff', flexShrink: 0, marginTop: 1,
  }),
  msgName: { fontSize: 11, fontWeight: 600, color: '#bbb' },
  msgTime: { fontSize: 9, color: '#444', marginLeft: 5 },
  msgText: { fontSize: 11, color: '#888', lineHeight: 1.5, marginTop: 1 },
  chatInput: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(255,255,255,0.05)', borderRadius: 7, padding: '6px 8px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  chatInputEl: { background: 'none', border: 'none', outline: 'none', color: '#ccc', fontSize: 11, flex: 1 },
  sendBtn: { background: ORANGE, border: 'none', color: '#fff', borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontSize: 13 },
  dmConv: { display: 'flex', alignItems: 'center', gap: 7, padding: '6px 5px', borderRadius: 6, cursor: 'pointer', position: 'relative' },
  dmUnread: {
    position: 'absolute', top: 6, right: 5, background: ORANGE, color: '#fff',
    fontSize: 8, fontWeight: 700, width: 14, height: 14, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dmPre: { fontSize: 10, color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 },
  sigNote: { fontSize: 10, color: '#444', lineHeight: 1.5, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 8 },
  // Files
  fSection: { marginBottom: 12 },
  fHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  fLabel: { fontSize: 11, fontWeight: 600, color: '#bbb' },
  fCount: { fontSize: 9, color: '#555', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 3 },
  fAddBtn: (accent) => ({
    background: 'none', border: `1px solid ${accent ? 'rgba(255,112,67,0.25)' : 'rgba(255,255,255,0.08)'}`,
    color: accent ? ORANGE : '#666', fontSize: 9, padding: '2px 6px', borderRadius: 3, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 2, fontFamily: "'DM Sans', sans-serif",
  }),
  fileItem: {
    display: 'flex', alignItems: 'center', gap: 7, padding: '6px 7px',
    background: 'rgba(255,255,255,0.03)', borderRadius: 6, marginBottom: 4,
    border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
  },
  fileName: { fontSize: 10, color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  fileMeta: { fontSize: 9, color: '#4a4a4a' },
  liveBadge: {
    fontSize: 8, background: 'rgba(76,175,80,0.12)', color: '#4caf50',
    border: '1px solid rgba(76,175,80,0.18)', padding: '1px 4px', borderRadius: 2, marginLeft: 4,
  },
  emptyDrop: {
    textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.015)',
    border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 7, color: '#3a3a3a',
    fontSize: 10, lineHeight: 1.6, cursor: 'pointer',
  },
  divider: { border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '10px 0' },
  // Notes
  sticky: {
    background: '#1a1a10', border: '1px solid rgba(255,200,50,0.12)',
    borderRadius: 8, padding: 10, marginBottom: 10,
  },
  stickyHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,200,50,0.08)',
  },
  stickyTitle: {
    fontSize: 10, color: 'rgba(255,200,50,0.5)', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  noteArea: {
    background: 'none', border: 'none', outline: 'none', color: '#aaa',
    fontSize: 11, lineHeight: 1.7, width: '100%', resize: 'none',
    fontFamily: "'DM Sans', sans-serif", minHeight: 120,
  },
  aiTeaser: {
    background: 'rgba(255,112,67,0.04)', border: '1px dashed rgba(255,112,67,0.15)',
    borderRadius: 7, padding: '10px 12px', display: 'flex', gap: 8, marginTop: 8,
  },
  aiCopy: { fontSize: 10, color: '#444', lineHeight: 1.6 },
  aiSoon: { fontSize: 9, color: ORANGE, opacity: 0.5, marginTop: 2 },
};

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

// ── People Tab ────────────────────────────────────────────────
function PeopleTab({ participants, onDm, isHost }) {
  const [query, setQuery] = useState('');
  const filtered = participants.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div style={S.searchBox}>
        <span style={{ color: '#555', fontSize: 13 }}>⌕</span>
        <input
          style={S.searchInput}
          placeholder="Search participants…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search participants"
        />
      </div>
      <button style={S.inviteBtn}>
        <span>+</span> Invite to Foundry
      </button>
      <div style={S.sectionLabel}>In this Foundry ({participants.length})</div>
      {filtered.map(p => (
        <div key={p.id} style={S.participantRow}>
          <div style={S.avatar(p.color)}>{initials(p.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.pName}>{p.name}</div>
            <div style={S.pRole}>{p.role}{p.isHost ? ' · Host' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: p.micMuted ? '#ef5350' : '#4caf50' }}>
              {p.micMuted ? '🔇' : '🎤'}
            </span>
            <span style={{ fontSize: 11, color: p.videoOff ? '#ef5350' : '#4caf50' }}>
              {p.videoOff ? '📵' : '📹'}
            </span>
            {!p.isHost && (
              <button style={S.dmBtn} onClick={() => onDm(p)}>DM</button>
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

// ── Chat Tab ──────────────────────────────────────────────────
function ChatTab({ messages, dms, participants, onSend, onDmOpen }) {
  const [sub, setSub] = useState('meeting');
  const [draft, setDraft] = useState('');
  const dmUnread = dms.filter(d => d.unread).length;

  const handleSend = () => {
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
  };

  return (
    <div>
      <div style={S.chatSub}>
        <button style={{ ...S.subBtn, ...(sub === 'meeting' ? S.subBtnActive : {}) }} onClick={() => setSub('meeting')}>
          Meeting Chat
        </button>
        <button style={{ ...S.subBtn, ...(sub === 'dms' ? S.subBtnActive : {}) }} onClick={() => setSub('dms')}>
          Direct Messages
          {dmUnread > 0 && (
            <span style={{ background: ORANGE, color: '#fff', fontSize: 8, padding: '1px 4px', borderRadius: 3, marginLeft: 4 }}>
              {dmUnread}
            </span>
          )}
        </button>
      </div>

      {sub === 'meeting' && (
        <>
          <div>
            {messages.map((msg, i) => (
              <div key={i} style={S.msgRow}>
                <div style={S.msgAvatar(msg.color)}>{initials(msg.sender)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={S.msgName}>{msg.sender}</span>
                  <span style={S.msgTime}>{msg.time}</span>
                  <div style={S.msgText}>{msg.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={S.chatInput}>
            <input
              style={S.chatInputEl}
              placeholder="Send to everyone…"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              aria-label="Meeting chat message"
            />
            <button style={S.sendBtn} onClick={handleSend} aria-label="Send">→</button>
          </div>
        </>
      )}

      {sub === 'dms' && (
        <>
          <div style={S.sectionLabel}>Direct messages</div>
          {dms.map((dm, i) => (
            <div key={i} style={S.dmConv} onClick={() => onDmOpen(dm)}>
              <div style={S.avatar(dm.color)}>{initials(dm.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.pName}>{dm.name}</div>
                <div style={S.dmPre}>{dm.preview}</div>
              </div>
              {dm.unread && <div style={S.dmUnread}>{dm.unread}</div>}
            </div>
          ))}
          <div style={S.sigNote}>
            ⚡ Direct messages are Signal conversations. They continue inside ForgeTomorrow after this Foundry ends.
          </div>
        </>
      )}
    </div>
  );
}

// ── Files Tab ─────────────────────────────────────────────────
function FilesTab({ sharedFiles, forgeFiles, onShare, onUpload }) {
  return (
    <div>
      {/* Shared */}
      <div style={S.fSection}>
        <div style={S.fHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: '#4caf50', fontSize: 14 }}>⊞</span>
            <span style={S.fLabel}>Shared</span>
            <span style={S.fCount}>{sharedFiles.length} {sharedFiles.length === 1 ? 'file' : 'files'}</span>
          </div>
          <button style={S.fAddBtn(false)}>+ Add</button>
        </div>
        {sharedFiles.length === 0 ? (
          <div style={{ ...S.emptyDrop, cursor: 'default' }}>
            Nothing shared yet. Share a file from Your Forge or Computer and it will appear here for everyone.
          </div>
        ) : (
          sharedFiles.map((f, i) => (
            <div key={i} style={S.fileItem}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>📄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.fileName}>{f.name}</div>
                <div style={S.fileMeta}>
                  {f.sharedBy} · {f.ago}
                  <span style={S.liveBadge}>live</span>
                </div>
              </div>
              <span style={{ fontSize: 12, color: '#555' }}>↓</span>
            </div>
          ))
        )}
      </div>

      <hr style={S.divider} />

      {/* Your Forge */}
      <div style={S.fSection}>
        <div style={S.fHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: ORANGE, fontSize: 14 }}>🔨</span>
            <span style={S.fLabel}>Your Forge</span>
          </div>
          <button style={S.fAddBtn(true)} onClick={onShare}>↗ Share</button>
        </div>
        {forgeFiles.map((f, i) => (
          <div key={i} style={S.fileItem} onClick={() => onShare(f)}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>📋</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={S.fileName}>{f.name}</div>
              <div style={S.fileMeta}>{f.type} · {f.ago}</div>
            </div>
            <span style={{ fontSize: 12, color: '#555' }}>↗</span>
          </div>
        ))}
      </div>

      <hr style={S.divider} />

      {/* Computer */}
      <div style={S.fSection}>
        <div style={S.fHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: '#666', fontSize: 14 }}>💻</span>
            <span style={{ ...S.fLabel, color: '#888' }}>Computer</span>
          </div>
          <button style={S.fAddBtn(false)} onClick={onUpload}>↑ Upload</button>
        </div>
        <div style={S.emptyDrop} onClick={onUpload}>
          <div style={{ fontSize: 18, marginBottom: 4, color: 'rgba(255,255,255,0.1)' }}>↑</div>
          Drop a file or click to upload from your device
        </div>
      </div>
    </div>
  );
}

// ── Notes Tab ─────────────────────────────────────────────────
function NotesTab({ notes, onNotesChange }) {
  return (
    <div>
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
      <div style={{ fontSize: 9, color: '#3a3a3a', textAlign: 'right', marginBottom: 8 }}>
        💾 Auto-saved
      </div>
      <div style={S.aiTeaser}>
        <span style={{ fontSize: 18, color: 'rgba(255,112,67,0.35)', flexShrink: 0 }}>🧠</span>
        <div>
          <div style={S.aiCopy}>
            Forge AI will generate a structured coaching debrief at the end of this session — action items, key decisions, follow-ups.
          </div>
          <div style={S.aiSoon}>Coming soon · Forge Intelligence</div>
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────
const TABS = ['People', 'Chat', 'Files', 'Notes'];

export default function FoundryRightPanel({
  participants, messages, dms, sharedFiles, forgeFiles,
  notes, onNotesChange, onSend, onDm, onDmOpen, onShare, onUpload,
  isHost, initialTab = 'People',
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div style={S.panel}>
      <div style={S.tabBar} role="tablist">
        {TABS.map(tab => (
          <button
            key={tab}
            style={{ ...S.tab, ...(activeTab === tab ? S.tabActive : {}) }}
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
          <PeopleTab participants={participants} onDm={onDm} isHost={isHost} />
        )}
        {activeTab === 'Chat' && (
          <ChatTab messages={messages} dms={dms} participants={participants} onSend={onSend} onDmOpen={onDmOpen} />
        )}
        {activeTab === 'Files' && (
          <FilesTab sharedFiles={sharedFiles} forgeFiles={forgeFiles} onShare={onShare} onUpload={onUpload} />
        )}
        {activeTab === 'Notes' && (
          <NotesTab notes={notes} onNotesChange={onNotesChange} />
        )}
      </div>
    </div>
  );
}
