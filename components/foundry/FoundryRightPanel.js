// components/foundry/FoundryRightPanel.js
import { useState, useEffect, useRef } from 'react';
import FoundrySignalPanel from './FoundrySignalPanel';
import FoundryLobbyPanel from './FoundryLobbyPanel';

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
  convertBtn: {
    width: '100%', background: 'rgba(255,200,50,0.08)', border: '1px solid rgba(255,200,50,0.15)',
    color: 'rgba(255,200,50,0.7)', fontSize: 10, padding: '6px 10px', borderRadius: 6,
    cursor: 'pointer', fontFamily: 'inherit', marginTop: 6, transition: 'all 0.15s',
  },
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

function PeopleTab({ participants, isHost, onDmParticipant, roomId, guestToken, coHostUserId, coHostName, onCoHostAssigned, isLocked, onMuteAll, onMuteParticipant, onKickParticipant, onBanParticipant, onLockRoom, onStopParticipantShare }) {
  const [query, setQuery] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteTab, setInviteTab] = useState('internal');
  const [contacts, setContacts] = useState([]);
  const [contactQuery, setContactQuery] = useState('');
  const [externalName, setExternalName] = useState('');
  const [externalEmail, setExternalEmail] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [meetingLinks, setMeetingLinks] = useState({ ftLink: '', guestLink: '', guestCode: guestToken || '' });
  const [copied, setCopied] = useState('');

  const filtered = participants.filter(p => p.name?.toLowerCase().includes(query.toLowerCase()));

  const localFtLink = roomId && typeof window !== 'undefined'
    ? `${window.location.origin}/foundry/${roomId}`
    : '';
  const localGuestLink = roomId && guestToken && typeof window !== 'undefined'
    ? `${window.location.origin}/foundry/join/${roomId}?code=${guestToken}`
    : '';

  const ftLink = meetingLinks.ftLink || localFtLink;
  const guestLink = meetingLinks.guestLink || localGuestLink;
  const guestCode = meetingLinks.guestCode || guestToken || '';

  const copyText = (label, value) => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 1800);
    }).catch(() => {});
  };

  const loadInviteOptions = async () => {
    if (!roomId || !isHost) return;
    try {
      const res = await fetch(`/api/foundry/room/${roomId}/live-invite`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not load invite options');
      setContacts(Array.isArray(data.contacts) ? data.contacts : []);
      setMeetingLinks({
        ftLink: data.ftLink || localFtLink,
        guestLink: data.guestLink || localGuestLink,
        guestCode: data.guestCode || guestToken || '',
      });
      setInviteError('');
    } catch (err) {
      setInviteError(String(err?.message || err || 'Could not load invite options'));
    }
  };

  useEffect(() => {
    if (showInvite) loadInviteOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInvite, roomId, isHost]);

  const sendInternalInvite = async (contact) => {
    if (!contact?.id || !roomId) return;
    setInviteBusy(true);
    setInviteError('');
    setInviteMessage('');
    try {
      const res = await fetch(`/api/foundry/room/${roomId}/live-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'internal', userId: contact.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not invite contact');
      setInviteMessage(`${contact.name || 'Contact'} invited. They will see a calendar item, notification, and Signal message.`);
      await loadInviteOptions();
    } catch (err) {
      setInviteError(String(err?.message || err || 'Could not invite contact'));
    } finally {
      setInviteBusy(false);
    }
  };

  const sendExternalInvite = async () => {
  const cleanEmail = String(externalEmail || '').trim();
  const cleanName = String(externalName || '').trim();

  if (!roomId) {
    setInviteError('Foundry room is not ready yet. Close and reopen the invite panel.');
    return;
  }

  if (!cleanEmail) {
    setInviteError('Enter an external guest email.');
    return;
  }

  setInviteBusy(true);
  setInviteError('');
  setInviteMessage('');

  try {
    const res = await fetch(`/api/foundry/room/${roomId}/live-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'external',
        email: cleanEmail,
        name: cleanName,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not invite guest');

    setInviteMessage(`${cleanEmail} invited. Guest link is ready to copy if needed.`);
    setExternalName('');
    setExternalEmail('');
    setMeetingLinks({
      ftLink: data.ftLink || ftLink,
      guestLink: data.guestLink || guestLink,
      guestCode: data.guestCode || guestCode,
    });
    await loadInviteOptions();
  } catch (err) {
    setInviteError(String(err?.message || err || 'Could not invite guest'));
  } finally {
    setInviteBusy(false);
  }
};

  const visibleContacts = contacts.filter((c) => {
    const q = contactQuery.trim().toLowerCase();
    if (!q) return true;
    return [c.name, c.email, c.headline, c.role].filter(Boolean).join(' ').toLowerCase().includes(q);
  });

  return (
    <div>
      {isHost && roomId && (
        <FoundryLobbyPanel
          roomId={roomId}
          participants={participants}
          coHostUserId={coHostUserId}
          coHostName={coHostName}
          isHost={isHost}
          onCoHostAssigned={onCoHostAssigned}
        />
      )}

      <div style={S.searchBox}>
        <span style={{ color: '#555', fontSize: 13 }}>⌕</span>
        <input style={S.searchInput} placeholder="Search participants…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search participants" />
      </div>
      <button style={S.inviteBtn} onClick={() => setShowInvite(v => !v)}>
        <span>+</span> {showInvite ? 'Close invite panel' : 'Invite to Foundry'}
      </button>

      {showInvite && isHost && (
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, padding: '10px 12px', marginBottom: 10,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={S.subBtn(inviteTab === 'internal')} onClick={() => setInviteTab('internal')}>Contacts</button>
            <button style={S.subBtn(inviteTab === 'external')} onClick={() => setInviteTab('external')}>External</button>
            <button style={S.subBtn(inviteTab === 'links')} onClick={() => setInviteTab('links')}>Links</button>
          </div>

          {inviteError && <div style={{ fontSize: 10, color: '#ef5350', lineHeight: 1.4 }}>{inviteError}</div>}
          {inviteMessage && <div style={{ fontSize: 10, color: '#4caf50', lineHeight: 1.4 }}>{inviteMessage}</div>}

          {inviteTab === 'internal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <input
                style={{ ...S.searchInput, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '7px 8px' }}
                placeholder="Search contacts to invite…"
                value={contactQuery}
                onChange={(e) => setContactQuery(e.target.value)}
              />
              {visibleContacts.length === 0 && (
                <div style={{ fontSize: 10, color: '#444', lineHeight: 1.5 }}>
                  No eligible contacts found. People already in the room, lobby, or invite list are hidden.
                </div>
              )}
              {visibleContacts.slice(0, 8).map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {c.avatarUrl ? <img src={c.avatarUrl} alt={c.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ ...S.pav(), width: 24, height: 24, fontSize: 9 }}>{initials(c.name)}</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: 9, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email || c.role || 'ForgeTomorrow contact'}</div>
                  </div>
                  <button disabled={inviteBusy} onClick={() => sendInternalInvite(c)} style={{ ...S.dmBtn, color: ORANGE, borderColor: 'rgba(255,112,67,0.25)' }}>
                    Invite
                  </button>
                </div>
              ))}
            </div>
          )}

{inviteTab === 'external' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
    <input
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        padding: '7px 8px',
        color: '#ccc',
        fontSize: 12,
        fontFamily: 'inherit',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
      }}
      placeholder="Guest name (optional)"
      value={externalName}
      onChange={(e) => setExternalName(e.target.value)}
    />

    <input
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        padding: '7px 8px',
        color: '#ccc',
        fontSize: 12,
        fontFamily: 'inherit',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
      }}
      placeholder="guest@email.com"
      value={externalEmail}
      onChange={(e) => setExternalEmail(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && sendExternalInvite()}
    />

    <button
      disabled={inviteBusy}
      style={S.inviteBtn}
      onClick={sendExternalInvite}
    >
      {inviteBusy ? 'Sending…' : '+ Email external guest'}
    </button>
  </div>
)}

          {inviteTab === 'links' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: '#666', fontWeight: 600, marginBottom: 4 }}>ForgeTomorrow users</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ flex: 1, fontSize: 10, color: '#555', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, padding: '5px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ftLink || 'Unavailable'}</div>
                  <button onClick={() => copyText('ft', ftLink)} style={S.dmBtn}>{copied === 'ft' ? '✓' : 'Copy'}</button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#666', fontWeight: 600, marginBottom: 4 }}>External guests</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ flex: 1, fontSize: 10, color: '#555', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, padding: '5px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guestLink || 'Unavailable'}</div>
                  <button onClick={() => copyText('guest', guestLink)} style={S.dmBtn}>{copied === 'guest' ? '✓' : 'Copy'}</button>
                </div>
              </div>
              {guestCode && (
                <div>
                  <div style={{ fontSize: 10, color: '#666', fontWeight: 600, marginBottom: 4 }}>Guest code</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ flex: 1, fontSize: 10, color: '#777', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, padding: '5px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guestCode}</div>
                    <button onClick={() => copyText('code', guestCode)} style={S.dmBtn}>{copied === 'code' ? '✓' : 'Copy'}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
          <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 11, color: p.micMuted ? '#ef5350' : '#4caf50' }}>{p.micMuted ? '🔇' : '🎤'}</span>
            <span style={{ fontSize: 11, color: p.videoOff ? '#ef5350' : '#4caf50' }}>{p.videoOff ? '📵' : '📹'}</span>
            {!p.local && <button style={S.dmBtn} onClick={() => onDmParticipant(p)}>DM</button>}
            {isHost && !p.local && (
              <>
                <button style={S.dmBtn} onClick={() => onMuteParticipant?.(p)}>Mute</button>
                <button style={S.dmBtn} onClick={() => onStopParticipantShare?.(p)}>Stop share</button>
                <button style={S.dmBtn} onClick={() => onKickParticipant?.(p)}>Kick</button>
                <button style={{ ...S.dmBtn, color: '#ef5350', borderColor: 'rgba(239,83,80,0.25)' }} onClick={() => onBanParticipant?.(p)}>Ban</button>
              </>
            )}
          </div>
        </div>
      ))}
      {isHost && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={S.sectionLabel}>Host controls</div>
          <button style={S.hcBtn} onClick={() => onMuteAll?.()}>🔇 Mute all</button>
          <button style={S.hcBtn} onClick={() => onLockRoom?.()}>{isLocked ? '🔓 Unlock Foundry' : '🔒 Lock Foundry'}</button>
          <button style={{ ...S.hcBtn, color: '#777' }}>Select a participant above to mute, stop share, kick, or ban.</button>
        </div>
      )}
    </div>
  );
}

function FilesTab({ sharedFiles, forgeFiles, onShare, onUpload, onRemoveFile, isHost = false, guestCode = null }) {
  const fileInputRef = useRef(null);

  const handleComputerClick = () => {
    fileInputRef.current?.click();
  };

  const handleComputerFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onUpload?.(file);
    event.target.value = '';
  };

  const openSharedFile = (file, guestCode) => {
    if (!file?.downloadUrl) return;
    const storedGuestCode =
  typeof window !== 'undefined'
    ? sessionStorage.getItem('foundry_guest_code') || ''
    : '';

const effectiveGuestCode = guestCode || storedGuestCode;

const url = effectiveGuestCode
  ? `${file.downloadUrl}&guestCode=${encodeURIComponent(effectiveGuestCode)}`
  : file.downloadUrl;
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name || 'download';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleComputerFile}
      />

      <div style={S.fsec}>
        <div style={S.fsh}>
          <div style={S.fshl}>
            <span style={{ color: '#4caf50', fontSize: 14 }}>⊞</span>
            <span style={S.fshlabel}>Shared</span>
            <span style={S.fshcount}>{sharedFiles.length} {sharedFiles.length === 1 ? 'file' : 'files'}</span>
          </div>
          {isHost && <button style={S.addF(false)} onClick={handleComputerClick}>+ Add</button>}
        </div>
        {sharedFiles.length === 0 ? (
          <div style={{ ...S.emptyDrop, cursor: 'default' }}>Nothing shared yet. Share from Your Forge or Computer.</div>
        ) : (
          sharedFiles.map((f, i) => (
            <div key={f.id || `${f.name}-${i}`} style={{ ...S.fi, cursor: f.hasFile ? 'pointer' : 'default' }}>
              <span style={{ fontSize: 16 }} onClick={() => openSharedFile(f, guestCode)}>📄</span>
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => openSharedFile(f, guestCode)}>
                <div style={S.fname}>{f.name}</div>
                <div style={S.fmeta}>{f.sharedBy || 'Unknown'} · {f.ago || 'just now'}<span style={S.liveBadge}>live</span></div>
              </div>
              {f.hasFile && (
                <span style={{ fontSize: 12, color: '#777', cursor: 'pointer' }} onClick={() => openSharedFile(f, guestCode)}>↗</span>
              )}
              {isHost && f.id && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveFile?.(f); }}
                  style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1 }}
                  title="Remove file"
                >×</button>
              )}
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
          <button style={S.addF(false)} onClick={handleComputerClick}>↑ Upload</button>
        </div>
        <div style={S.emptyDrop} onClick={handleComputerClick}>
          <div style={{ fontSize: 18, marginBottom: 4, color: 'rgba(255,255,255,0.1)' }}>↑</div>
          Drop a file or click to upload
        </div>
      </div>
    </div>
  );
}

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

const TABS_LIST = ['People', 'Chat', 'Files', 'Notes'];

export default function FoundryRightPanel({
  roomId,
  participants = [],
  messages = [],
  sharedFiles = [],
  forgeFiles = [],
  notes = '',
  onNotesChange,
  onSend,
  onShare,
  onUpload,
  onRemoveFile,
  isHost = false,
  initialTab = 'People',
  currentUserId,
  currentUserRole,
  coHostUserId,
  coHostName,
  onCoHostAssigned,
  guestToken = null,
  guestCode = null,
  isLocked = false,
  onMuteAll,
  onMuteParticipant,
  onKickParticipant,
  onBanParticipant,
  onLockRoom,
  onStopParticipantShare,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [chatSub, setChatSub] = useState('meeting');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const handleConvertChatToNotes = (msgs) => {
    const transcript = msgs.map(m => `[${m.time}] ${m.sender}: ${m.text}`).join('\n');
    const appended = notes
      ? `${notes}\n\n--- Meeting Chat ---\n${transcript}`
      : `--- Meeting Chat ---\n${transcript}`;
    onNotesChange(appended);
    setActiveTab('Notes');
  };

  const handleSend = () => {
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
  };

  return (
    <div style={S.panel}>
      <div style={S.tabBar} role="tablist">
        {TABS_LIST.map(tab => (
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

      {/* ── Always-mounted panels — visibility toggled via display:none ── */}
      {/* This prevents React hook count mismatches from conditional rendering */}

      {/* People */}
      <div style={{ ...S.content, display: activeTab === 'People' ? 'flex' : 'none' }}>
        <PeopleTab
          participants={participants}
          isHost={isHost}
          roomId={roomId}
          guestToken={guestToken}
          coHostUserId={coHostUserId}
          coHostName={coHostName}
          onCoHostAssigned={onCoHostAssigned}
          isLocked={isLocked}
          onMuteAll={onMuteAll}
          onMuteParticipant={onMuteParticipant}
          onKickParticipant={onKickParticipant}
          onBanParticipant={onBanParticipant}
          onLockRoom={onLockRoom}
          onStopParticipantShare={onStopParticipantShare}
          onDmParticipant={() => { setActiveTab('Chat'); setChatSub('dms'); }}
        />
      </div>

      {/* Chat — always mounted, sub-tabs switch between meeting chat and Signal */}
      <div style={{ ...S.content, display: activeTab === 'Chat' ? 'flex' : 'none', flexDirection: 'column' }}>
        <div style={S.chatSub}>
          <button style={S.subBtn(chatSub === 'meeting')} onClick={() => setChatSub('meeting')}>Meeting Chat</button>
          <button style={S.subBtn(chatSub === 'dms')} onClick={() => setChatSub('dms')}>Direct Messages</button>
        </div>

        {/* Meeting chat */}
        <div style={{ display: chatSub === 'meeting' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={S.msgs}>
            {messages.length === 0 && (
              <div style={{ fontSize: 11, color: '#444', textAlign: 'center', padding: '20px 0' }}>
                Meeting chat is ephemeral — messages disappear when the Foundry ends.
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
            <button style={S.sendB} onClick={handleSend}>→</button>
          </div>
          {messages.length > 0 && (
            <button style={S.convertBtn} onClick={() => handleConvertChatToNotes(messages)}>
              📝 Convert chat to session notes
            </button>
          )}
        </div>

        {/* Signal DMs — always mounted, hidden when not active */}
        {/* KEY FIX: FoundrySignalPanel is always in the tree so its hooks never change count */}
        <div style={{ display: chatSub === 'dms' ? 'flex' : 'none', flex: 1, minHeight: 0, flexDirection: 'column' }}>
          <FoundrySignalPanel
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            foundryParticipants={participants.filter(p => !p.local)}
          />
        </div>
      </div>

      {/* Files */}
      <div style={{ ...S.content, display: activeTab === 'Files' ? 'flex' : 'none' }}>
        <FilesTab
          sharedFiles={sharedFiles}
          forgeFiles={forgeFiles}
          onShare={onShare}
          onUpload={onUpload}
          onRemoveFile={onRemoveFile}
          isHost={isHost}
          guestCode={guestCode}
        />
      </div>

      {/* Notes */}
      <div style={{ ...S.content, display: activeTab === 'Notes' ? 'flex' : 'none' }}>
        <NotesTab notes={notes} onNotesChange={onNotesChange} />
      </div>
    </div>
  );
}