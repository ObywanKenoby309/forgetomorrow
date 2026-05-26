// components/foundry/FoundrySignalPanel.js
// Full Signal inbox inside the Foundry right panel.
// Styled to match the Foundry dark UI — not the platform's light Signal page.
// Coaches and recruiters get a channel switcher (seeker / coach|recruiter).
// Seekers see one inbox.
// Meeting participants are surfaced at the top with a "In Foundry" badge.
// Contact request flow fires inline before opening a thread with a non-contact.

import { useState, useEffect, useCallback, useRef } from 'react';

const ORANGE = '#FF7043';

const S = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 },

  // Channel switcher (coaches/recruiters only)
  channelBar: {
    display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)',
    borderRadius: 5, padding: 2, marginBottom: 10, flexShrink: 0,
  },
  channelBtn: (active) => ({
    flex: 1, background: active ? 'rgba(255,255,255,0.07)' : 'none',
    border: 'none', color: active ? '#ccc' : '#555', cursor: 'pointer',
    fontSize: 10, fontWeight: 500, padding: '4px 6px', borderRadius: 3,
    transition: 'all 0.15s', fontFamily: 'inherit', textAlign: 'center',
  }),

  // Thread list
  threadList: { flex: 1, overflowY: 'auto', minHeight: 0 },
  threadItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 5px',
    borderRadius: 7, cursor: 'pointer',
    background: active ? 'rgba(255,112,67,0.08)' : 'none',
    transition: 'background 0.12s',
  }),
  avatar: (url) => ({
    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
    background: url ? `url(${url}) center/cover` : '#5C6BC0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 600, color: '#fff',
  }),
  threadInfo: { flex: 1, minWidth: 0 },
  threadName: { fontSize: 11, color: '#ccc', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  threadPreview: { fontSize: 10, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 },
  threadMeta: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 },
  threadTime: { fontSize: 9, color: '#444' },
  unreadBadge: {
    background: ORANGE, color: '#fff', fontSize: 8, fontWeight: 700,
    width: 14, height: 14, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  foundryBadge: {
    background: 'rgba(255,112,67,0.15)', color: ORANGE,
    fontSize: 8, padding: '1px 4px', borderRadius: 3, fontWeight: 600,
  },
  sectionLabel: {
    fontSize: 9, color: '#444', textTransform: 'uppercase',
    letterSpacing: '0.08em', fontWeight: 600, margin: '8px 0 4px', padding: '0 5px',
  },
  empty: { fontSize: 11, color: '#444', textAlign: 'center', padding: '20px 10px', lineHeight: 1.6 },
  loading: { fontSize: 11, color: '#444', textAlign: 'center', padding: '16px 0' },

  // Active thread view
  threadView: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 },
  threadHeader: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 10px',
    borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8, flexShrink: 0,
  },
  backBtn: {
    background: 'none', border: 'none', color: '#666', cursor: 'pointer',
    fontSize: 16, padding: '2px 6px 2px 0', fontFamily: 'inherit',
  },
  threadHeaderName: { fontSize: 12, fontWeight: 600, color: '#ccc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  messages: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 },
  msgWrap: (mine) => ({
    display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start',
  }),
  msgBubble: (mine) => ({
    maxWidth: '80%', background: mine ? 'rgba(255,112,67,0.2)' : 'rgba(255,255,255,0.07)',
    border: mine ? '1px solid rgba(255,112,67,0.25)' : '1px solid rgba(255,255,255,0.06)',
    borderRadius: mine ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
    padding: '7px 10px', fontSize: 11, color: mine ? '#ffccb3' : '#ccc', lineHeight: 1.5,
  }),
  msgTime: { fontSize: 9, color: '#444', marginTop: 2, textAlign: 'right' },
  composer: {
    display: 'flex', alignItems: 'flex-end', gap: 6, paddingTop: 8,
    borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
  },
  composerInput: {
    flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 7, padding: '7px 10px', color: '#ccc', fontSize: 11, resize: 'none',
    outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 80,
  },
  sendBtn: {
    background: ORANGE, border: 'none', color: '#fff', borderRadius: 6,
    padding: '7px 10px', cursor: 'pointer', fontSize: 13, flexShrink: 0,
    fontFamily: 'inherit', transition: 'background 0.15s',
  },

  // Contact request prompt
  contactPrompt: {
    background: 'rgba(255,112,67,0.06)', border: '1px solid rgba(255,112,67,0.2)',
    borderRadius: 8, padding: 12, margin: '8px 0',
  },
  promptText: { fontSize: 11, color: '#aaa', lineHeight: 1.6, marginBottom: 10 },
  promptBtns: { display: 'flex', gap: 6 },
  promptBtn: (primary) => ({
    flex: 1, background: primary ? 'rgba(255,112,67,0.15)' : 'rgba(255,255,255,0.05)',
    border: primary ? '1px solid rgba(255,112,67,0.3)' : '1px solid rgba(255,255,255,0.08)',
    color: primary ? ORANGE : '#666', fontSize: 11, padding: '6px 10px',
    borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
  }),

  // Incoming contact request
  incomingRequest: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: 10, marginBottom: 6,
  },
  incomingText: { fontSize: 11, color: '#bbb', lineHeight: 1.5, marginBottom: 8 },
  incomingBtns: { display: 'flex', gap: 6 },
  acceptBtn: {
    flex: 1, background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.25)',
    color: '#66bb6a', fontSize: 11, padding: '5px 8px', borderRadius: 5,
    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
  },
  declineBtn: {
    flex: 1, background: 'none', border: '1px solid rgba(255,255,255,0.08)',
    color: '#555', fontSize: 11, padding: '5px 8px', borderRadius: 5,
    cursor: 'pointer', fontFamily: 'inherit',
  },

  // Toast
  toast: {
    position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
    background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, padding: '8px 16px', fontSize: 12, color: '#ccc',
    zIndex: 9999, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
  },
};

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Toast ──────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);
  if (!msg) return null;
  return <div style={S.toast}>{msg}</div>;
}

// ── Thread View ────────────────────────────────────────────────
function ThreadView({ thread, currentUserId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/signal/messages?conversationId=${thread.id}&markRead=true`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch {}
  }, [thread.id]);

  useEffect(() => {
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));
    // Poll every 4 seconds while thread is open
    pollRef.current = setInterval(fetchMessages, 4000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    const content = draft.trim();
    setDraft('');
    try {
      await fetch('/api/signal/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: thread.id, content }),
      });
      await fetchMessages();
    } catch {
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={S.threadView}>
      <div style={S.threadHeader}>
        <button style={S.backBtn} onClick={onBack} aria-label="Back to inbox">←</button>
        {thread.otherAvatarUrl ? (
          <img src={thread.otherAvatarUrl} alt={thread.title} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#5C6BC0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: '#fff' }}>
            {initials(thread.title)}
          </div>
        )}
        <span style={S.threadHeaderName}>{thread.title}</span>
        {thread.isFoundryParticipant && <span style={S.foundryBadge}>In Foundry</span>}
      </div>

      <div style={S.messages}>
        {loading && <div style={S.loading}>Loading…</div>}
        {!loading && messages.length === 0 && (
          <div style={S.empty}>No messages yet. Say hello!</div>
        )}
        {messages.map(msg => {
          const mine = msg.senderId === currentUserId || msg.isMine;
          return (
            <div key={msg.id} style={S.msgWrap(mine)}>
              <div>
                <div style={S.msgBubble(mine)}>{msg.content}</div>
                <div style={S.msgTime}>{relativeTime(msg.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={S.composer}>
        <textarea
          style={S.composerInput}
          placeholder={`Message ${thread.title}…`}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          rows={2}
          aria-label="Message input"
        />
        <button style={S.sendBtn} onClick={handleSend} disabled={!draft.trim() || sending} aria-label="Send">→</button>
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────
export default function FoundrySignalPanel({
  currentUserId,
  currentUserRole,
  foundryParticipants = [], // [{id, name, avatarUrl}] — people currently in the Foundry
}) {
  // Channel switcher for coaches/recruiters
  const isMultiChannel = ['COACH', 'RECRUITER', 'ADMIN'].includes(currentUserRole?.toUpperCase());
  const secondChannel = currentUserRole?.toUpperCase() === 'COACH' ? 'coach' : 'recruiter';

  const [channel, setChannel] = useState('seeker');
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState(null);

  // Contact request state
  const [contactPrompt, setContactPrompt] = useState(null); // { thread }
  const [sendingRequest, setSendingRequest] = useState(false);

  // Incoming contact requests from Foundry participants
  const [incomingRequests, setIncomingRequests] = useState([]);

  // Toast
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); };

  // Fetch threads for current channel
  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch(`/api/signal/threads?channel=${channel}`);
      const data = await res.json();
      if (data.threads) setThreads(data.threads);
    } catch {}
  }, [channel]);

  useEffect(() => {
    setLoading(true);
    setActiveThread(null);
    fetchThreads().finally(() => setLoading(false));
    const poll = setInterval(fetchThreads, 8000);
    return () => clearInterval(poll);
  }, [fetchThreads]);

  // Check for incoming contact requests from Foundry participants
  useEffect(() => {
    if (!foundryParticipants.length) return;
    async function checkRequests() {
      try {
        const res = await fetch('/api/contacts/request?incoming=true');
        const data = await res.json();
        if (data.requests) {
          // Filter to only show requests from people in this Foundry
          const foundryIds = new Set(foundryParticipants.map(p => p.id));
          setIncomingRequests(data.requests.filter(r => foundryIds.has(r.fromUserId)));
        }
      } catch {}
    }
    checkRequests();
    const poll = setInterval(checkRequests, 5000);
    return () => clearInterval(poll);
  }, [foundryParticipants]);

  // Mark Foundry participants in thread list
  const foundryParticipantIds = new Set(foundryParticipants.map(p => p.id).filter(Boolean));

  const threadsWithFoundryFlag = threads.map(t => ({
    ...t,
    isFoundryParticipant: foundryParticipantIds.has(t.otherUserId),
  }));

  // Sort: Foundry participants first, then by lastMessageAt
  const sortedThreads = [...threadsWithFoundryFlag].sort((a, b) => {
    if (a.isFoundryParticipant && !b.isFoundryParticipant) return -1;
    if (!a.isFoundryParticipant && b.isFoundryParticipant) return 1;
    return new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
  });

  const foundryThreads = sortedThreads.filter(t => t.isFoundryParticipant);
  const otherThreads = sortedThreads.filter(t => !t.isFoundryParticipant);

  // Handle clicking a thread — check contact status first
  const handleThreadClick = async (thread) => {
    if (!thread.otherUserId) { setActiveThread(thread); return; }

    // Try start-or-get — it handles the contact gate server-side
    const res = await fetch('/api/signal/start-or-get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId: thread.otherUserId, channel }),
    });
    const data = await res.json();

    if (data.blocked && data.blockReason === 'ROLE_GATE') {
      // Not contacts yet — show inline contact request prompt
      setContactPrompt({ thread });
      return;
    }

    setActiveThread(thread);
  };

  // Handle DM from a Foundry participant not in threads yet
  const handleNewDm = async (participant) => {
    const res = await fetch('/api/signal/start-or-get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId: participant.id, channel }),
    });
    const data = await res.json();

    if (data.blocked && data.blockReason === 'ROLE_GATE') {
      setContactPrompt({
        thread: {
          otherUserId: participant.id,
          title: participant.name,
          otherAvatarUrl: participant.avatarUrl,
        },
      });
      return;
    }

    if (data.conversation) {
      const thread = {
        id: data.conversation.id,
        title: data.otherUser?.name || participant.name,
        otherUserId: data.otherUser?.id || participant.id,
        otherAvatarUrl: data.otherUser?.avatarUrl || participant.avatarUrl,
        isFoundryParticipant: true,
      };
      setActiveThread(thread);
      fetchThreads();
    }
  };

  // Send contact request
  const handleSendContactRequest = async () => {
    if (!contactPrompt?.thread?.otherUserId || sendingRequest) return;
    setSendingRequest(true);
    try {
      const res = await fetch('/api/contacts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: contactPrompt.thread.otherUserId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Contact request sent to ${contactPrompt.thread.title}. They'll be notified.`);
        setContactPrompt(null);
      } else {
        showToast(data.error || 'Could not send request.');
      }
    } catch {
      showToast('Network error. Please try again.');
    } finally {
      setSendingRequest(false);
    }
  };

  // Accept incoming contact request
  const handleAcceptRequest = async (request) => {
    try {
      const res = await fetch('/api/contacts/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id, action: 'ACCEPT' }),
      });
      if (res.ok) {
        setIncomingRequests(prev => prev.filter(r => r.id !== request.id));
        showToast(`You're now connected with ${request.fromName}. Opening chat…`);
        // Open the thread
        setTimeout(() => handleNewDm({ id: request.fromUserId, name: request.fromName, avatarUrl: request.fromAvatarUrl }), 500);
      }
    } catch {}
  };

  // Decline incoming request
  const handleDeclineRequest = async (request) => {
    try {
      await fetch('/api/contacts/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id, action: 'DECLINE' }),
      });
      setIncomingRequests(prev => prev.filter(r => r.id !== request.id));
    } catch {}
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={S.wrap}>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}

      {activeThread ? (
        <ThreadView
          thread={activeThread}
          currentUserId={currentUserId}
          onBack={() => { setActiveThread(null); fetchThreads(); }}
        />
      ) : (
        <>
          {/* Channel switcher — coaches/recruiters only */}
          {isMultiChannel && (
            <div style={S.channelBar}>
              <button style={S.channelBtn(channel === 'seeker')} onClick={() => setChannel('seeker')}>
                Seekers
              </button>
              <button style={S.channelBtn(channel === secondChannel)} onClick={() => setChannel(secondChannel)}>
                {secondChannel === 'coach' ? 'Coaches' : 'Recruiters'}
              </button>
            </div>
          )}

          {/* Incoming contact requests from Foundry participants */}
          {incomingRequests.map(req => (
            <div key={req.id} style={S.incomingRequest}>
              <div style={S.incomingText}>
                <strong style={{ color: '#ddd' }}>{req.fromName}</strong> wants to connect with you so you can message each other during and after this Foundry.
              </div>
              <div style={S.incomingBtns}>
                <button style={S.acceptBtn} onClick={() => handleAcceptRequest(req)}>Accept</button>
                <button style={S.declineBtn} onClick={() => handleDeclineRequest(req)}>Decline</button>
              </div>
            </div>
          ))}

          {/* Contact request prompt */}
          {contactPrompt && (
            <div style={S.contactPrompt}>
              <div style={S.promptText}>
                You and <strong style={{ color: '#ddd' }}>{contactPrompt.thread.title}</strong> aren't contacts yet. Send a request so you can message each other during and after this Foundry.
              </div>
              <div style={S.promptBtns}>
                <button
                  style={S.promptBtn(true)}
                  onClick={handleSendContactRequest}
                  disabled={sendingRequest}
                >
                  {sendingRequest ? 'Sending…' : 'Send Request'}
                </button>
                <button style={S.promptBtn(false)} onClick={() => setContactPrompt(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Thread list */}
          <div style={S.threadList}>
            {loading && <div style={S.loading}>Loading…</div>}

            {!loading && (
              <>
                {/* Foundry participants section */}
                {foundryThreads.length > 0 && (
                  <>
                    <div style={S.sectionLabel}>In this Foundry</div>
                    {foundryThreads.map(t => (
                      <ThreadRow
                        key={t.id}
                        thread={t}
                        active={activeThread?.id === t.id}
                        onClick={() => handleThreadClick(t)}
                      />
                    ))}
                  </>
                )}

                {/* Foundry participants not yet in threads */}
                {foundryParticipants
                  .filter(p => p.id !== currentUserId && !foundryParticipantIds.has(p.id) || !threads.find(t => t.otherUserId === p.id))
                  .filter(p => p.id !== currentUserId && !threads.find(t => t.otherUserId === p.id))
                  .map(p => (
                    <div key={p.id} style={{ ...S.threadItem(false), opacity: 0.7 }} onClick={() => handleNewDm(p)}>
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt={p.name} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#5C6BC0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                          {initials(p.name)}
                        </div>
                      )}
                      <div style={S.threadInfo}>
                        <div style={S.threadName}>{p.name}</div>
                        <div style={S.threadPreview}>Tap to message</div>
                      </div>
                      <span style={S.foundryBadge}>In Foundry</span>
                    </div>
                  ))
                }

                {/* Other threads */}
                {otherThreads.length > 0 && (
                  <>
                    <div style={S.sectionLabel}>All messages</div>
                    {otherThreads.map(t => (
                      <ThreadRow
                        key={t.id}
                        thread={t}
                        active={activeThread?.id === t.id}
                        onClick={() => handleThreadClick(t)}
                      />
                    ))}
                  </>
                )}

                {!loading && threads.length === 0 && foundryParticipants.filter(p => p.id !== currentUserId).length === 0 && (
                  <div style={S.empty}>No Signal messages yet.<br />Tap a participant to start a conversation.</div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Thread Row ─────────────────────────────────────────────────
function ThreadRow({ thread, active, onClick }) {
  return (
    <div style={S.threadItem(active)} onClick={onClick}>
      {thread.otherAvatarUrl ? (
        <img src={thread.otherAvatarUrl} alt={thread.title} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#5C6BC0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
          {initials(thread.title)}
        </div>
      )}
      <div style={S.threadInfo}>
        <div style={S.threadName}>
          {thread.title}
          {thread.isFoundryParticipant && <span style={{ ...S.foundryBadge, marginLeft: 5 }}>In Foundry</span>}
        </div>
        {thread.lastMessage && <div style={S.threadPreview}>{thread.lastMessage}</div>}
      </div>
      <div style={S.threadMeta}>
        {thread.lastMessageAt && <span style={S.threadTime}>{relativeTime(thread.lastMessageAt)}</span>}
        {thread.unreadCount > 0 && <div style={S.unreadBadge}>{thread.unreadCount}</div>}
      </div>
    </div>
  );
}