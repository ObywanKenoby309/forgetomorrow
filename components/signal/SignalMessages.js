// components/signal/SignalMessages.js
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import MemberActions from '../member/MemberActions';

export default function SignalMessages() {
  const router = useRouter();
  const { toId, toName, told, chrome } = router.query;

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeTitle, setActiveTitle] = useState('');
  const [activeOtherUserId, setActiveOtherUserId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);

  // 🔹 Local block state for the active conversation
  const [isBlocked, setIsBlocked] = useState(false);

  // 🔹 Inline member menu for conversation list avatars
  const [profileMenu, setProfileMenu] = useState({
    open: false,
    userId: null,
    name: 'Member',
  });
  const menuRef = useRef(null);

  // ✅ Mobile UX: list vs chat view
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

  // ✅ Search (UI polish only)
  const [query, setQuery] = useState('');

  const GLASS = {
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.72)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 14,
  };

  const softCard = 'border border-gray-100 shadow-sm bg-white/70 backdrop-blur';

  const fetchThreads = useCallback(async () => {
    setThreadsLoading(true);
    try {
      const res = await fetch('/api/signal/threads');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (err) {
      console.error('fetchThreads error:', err);
      setThreads([]);
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    setMessagesLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('conversationId', String(conversationId));
      const res = await fetch(`/api/signal/messages?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('fetchMessages error:', err);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const openConversation = async (thread) => {
    setActiveConversationId(thread.id);
    setActiveTitle(thread.title || 'Conversation');
    setActiveOtherUserId(thread.otherUserId || null);
    setIsBlocked(false);
    await fetchMessages(thread.id);

    // ✅ mobile: jump into chat view
    setMobileView('chat');
  };

  // ── Profile menu helpers (left column avatars) ─────────────────────────────
  const openProfileMenu = (userId, name) => {
    if (!userId) return;
    setProfileMenu((prev) => {
      const isSame = prev.open && prev.userId === userId;
      return {
        open: !isSame,
        userId,
        name: name || 'Member',
      };
    });
  };

  const closeProfileMenu = () =>
    setProfileMenu({ open: false, userId: null, name: 'Member' });

  // Close on outside click
  useEffect(() => {
    if (!profileMenu.open) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        closeProfileMenu();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenu.open]);

  // Initial load of threads
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // 🔹 Deep-link handler (select thread after threads load) ───────────────────
  useEffect(() => {
    if (!router.isReady) return;

    const deepLinkIdRaw = Array.isArray(toId || told)
      ? (toId || told)[0]
      : toId || told;

    if (!deepLinkIdRaw) return;
    if (threadsLoading) return;

    const match = threads.find(
      (t) => t.otherUserId && String(t.otherUserId) === String(deepLinkIdRaw)
    );

    if (match) {
      openConversation(match);
    }

    const cleanQuery = {};
    if (chrome) cleanQuery.chrome = chrome;
    router.replace({ pathname: router.pathname, query: cleanQuery }, undefined, {
      shallow: true,
    });
  }, [router.isReady, toId, told, chrome, threads, threadsLoading, fetchMessages]);

  const handleSend = async (e) => {
    e?.preventDefault?.();
    if (!activeConversationId || !composer.trim() || sending || isBlocked) return;

    setSending(true);
    try {
      const res = await fetch('/api/signal/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversationId,
          content: composer.trim(),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('send error payload:', text);
        if (res.status === 403) {
          setIsBlocked(true);
          alert('Messaging is blocked between you and this member.');
          return;
        }
        throw new Error(text);
      }

      const data = await res.json();

      const newMessage = {
        id: data.message.id,
        conversationId: data.message.conversationId,
        senderId: 'me',
        senderName: 'You',
        senderAvatarUrl: null,
        content: data.message.content,
        createdAt: data.message.createdAt,
        isMine: true,
      };

      setMessages((prev) => [...prev, newMessage]);
      setComposer('');
      await fetchThreads();
    } catch (err) {
      console.error('send error:', err);
      alert('We could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // 🔹 Block this member — prompt for reason, send to API, hide conversation, remove from contacts if connected
  const handleBlock = async () => {
    if (!activeOtherUserId) {
      alert('We could not determine which member to block.');
      return;
    }

    const reason = window.prompt(
      'Optional: Why are you blocking this member? (This helps moderation)'
    );

    const confirmed = window.confirm(
      'Are you sure you want to block this member? They will no longer be able to message you, and you will not see new messages from them.'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/signal/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: activeOtherUserId,
          reason: reason?.trim() || null,
        }),
      });

      if (!res.ok) {
        console.error('block error status:', res.status, await res.text());
        alert('We could not block this member. Please try again.');
        return;
      }

      setIsBlocked(true);
      setComposer('');

      // Hide conversation from list
      setThreads((prev) => prev.filter((t) => t.otherUserId !== activeOtherUserId));

      // Remove from contacts if connected
      await fetch('/api/contacts/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactUserId: activeOtherUserId }),
      });
    } catch (err) {
      console.error('block error:', err);
      alert('We could not block this member. Please try again.');
    }
  };

  // 🔹 Report this conversation
  const handleReport = async () => {
    if (!activeConversationId || !activeOtherUserId) {
      alert('We could not determine which conversation to report.');
      return;
    }

    const reason = window.prompt(
      'Tell us briefly what happened. This will go to the ForgeTomorrow support team.'
    );
    if (reason === null) return;

    try {
      const res = await fetch('/api/signal/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversationId,
          targetUserId: activeOtherUserId,
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        console.error('report error status:', res.status, await res.text());
        alert('We could not submit your report. Please try again.');
        return;
      }

      alert('Thank you. Your report has been submitted to our team.');
    } catch (err) {
      console.error('report error:', err);
      alert('We could not submit your report. Please try again.');
    }
  };

  // 🔹 Delete this conversation
  const handleDeleteConversation = async () => {
    if (!activeConversationId) {
      alert('No active conversation selected.');
      return;
    }

    const confirmed = window.confirm(
      'Delete this conversation for both participants? This cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/signal/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConversationId }),
      });

      if (!res.ok) {
        console.error('delete error status:', res.status, await res.text());
        alert('We could not delete this conversation. Please try again.');
        return;
      }

      setActiveConversationId(null);
      setActiveTitle('');
      setActiveOtherUserId(null);
      setMessages([]);
      setIsBlocked(false);
      setMobileView('list');

      await fetchThreads();
    } catch (err) {
      console.error('delete error:', err);
      alert('We could not delete this conversation. Please try again.');
    }
  };

  const filteredThreads = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => {
      const title = String(t.title || '').toLowerCase();
      const last = String(t.lastMessage || '').toLowerCase();
      return title.includes(q) || last.includes(q);
    });
  }, [threads, query]);

  const formatTime = (dt) => {
    try {
      return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isMobileChat = mobileView === 'chat';

  return (
    <div style={{ ...GLASS, padding: 14, marginTop: 14 }}>
      {/* Mobile top bar (only shows in mobile chat view) */}
      <div className="md:hidden flex items-center justify-between mb-3">
        {isMobileChat ? (
          <button
            type="button"
            onClick={() => setMobileView('list')}
            className="text-sm font-semibold text-gray-800 hover:opacity-80"
          >
            ← Back
          </button>
        ) : (
          <div className="text-sm font-semibold text-gray-900">Conversations</div>
        )}

        <div className="text-xs text-gray-500">
          {threadsLoading ? 'Loading…' : `${threads.length} total`}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
        {/* Left: Threads list */}
        <section
          className={`${softCard} rounded-xl p-4 ${isMobileChat ? 'hidden md:block' : 'block'}`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-extrabold text-gray-900">Conversations</h2>
            <button
              type="button"
              onClick={fetchThreads}
              className="text-[11px] px-2 py-1 rounded-md border border-gray-200 hover:bg-white"
              title="Refresh"
            >
              Refresh
            </button>
          </div>

          {/* Search */}
          <div className="mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages…"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
            />
          </div>

          {threadsLoading ? (
            <p className="text-xs text-gray-500">Loading conversations…</p>
          ) : filteredThreads.length === 0 ? (
            <div className="text-xs text-gray-600">
              <div className="font-semibold text-gray-800">No conversations yet.</div>
              <div className="mt-1">
                Start one from a member profile or candidate card.
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredThreads.map((t) => {
                const otherId = t.otherUserId || null;
                const otherName = t.title || 'Member';

                const openMenu = (e) => {
                  e.stopPropagation();
                  if (!otherId) return;
                  openProfileMenu(otherId, otherName);
                };

                const isActive = t.id === activeConversationId;
                const showMenu = profileMenu.open && profileMenu.userId === otherId;

                return (
                  <li
                    key={t.id}
                    className={`relative py-2 px-2 flex items-start gap-3 cursor-pointer rounded-lg ${
                      isActive ? 'bg-[#FFF3E9]' : 'hover:bg-white'
                    }`}
                    onClick={() => openConversation(t)}
                  >
                    {/* Avatar → Member actions menu trigger */}
                    <button
                      type="button"
                      onClick={openMenu}
                      className="flex-shrink-0"
                      aria-label="Open member actions"
                    >
                      {t.otherAvatarUrl ? (
                        <img
                          src={t.otherAvatarUrl}
                          alt={otherName}
                          className="w-9 h-9 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-700 border border-gray-200">
                          {otherName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </button>

                    {/* Inline member actions dropdown */}
                    {showMenu && otherId && (
                      <div
                        ref={menuRef}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute z-20 left-12 top-10 bg-white border border-gray-200 rounded-lg shadow-lg text-sm w-56 overflow-hidden"
                      >
                        <div className="px-3 py-2 border-b font-extrabold text-gray-900">
                          {profileMenu.name}
                        </div>
                        <MemberActions
                          targetUserId={profileMenu.userId}
                          targetName={profileMenu.name}
                          layout="menu"
                          onClose={closeProfileMenu}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-gray-900 truncate">
                            {t.title}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {t.lastMessage || '—'}
                          </p>
                        </div>

                        <div className="text-[10px] text-gray-500 whitespace-nowrap pt-1">
                          {t.lastMessageAt ? formatTime(t.lastMessageAt) : ''}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Right: Active conversation */}
        <section
          className={`${softCard} rounded-xl p-4 flex flex-col ${
            isMobileChat ? 'block' : 'hidden'
          } md:flex`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-gray-900 truncate">
                {activeConversationId
                  ? activeTitle || 'Conversation'
                  : 'Your Signal inbox is ready'}
              </h2>
              {!activeConversationId && (
                <p className="text-xs text-gray-600 mt-1">
                  Start a conversation from a profile, candidate card, or coaching listing.
                </p>
              )}
            </div>

            {activeConversationId && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteConversation}
                  className="text-[11px] px-2 py-1 border border-gray-200 rounded-md text-gray-800 hover:bg-white"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={handleReport}
                  className="text-[11px] px-2 py-1 border border-gray-200 rounded-md text-gray-800 hover:bg-white"
                >
                  Report
                </button>
                <button
                  type="button"
                  onClick={handleBlock}
                  className="text-[11px] px-2 py-1 border border-red-200 rounded-md text-red-700 hover:bg-red-50"
                  disabled={isBlocked}
                >
                  {isBlocked ? 'Blocked' : 'Block'}
                </button>
              </div>
            )}
          </div>

          {activeConversationId && isBlocked && (
            <div className="mb-3 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              You have blocked this member. You will not be able to send new messages.
            </div>
          )}

          {/* Messages list */}
          <div
            className="flex-1 overflow-y-auto border border-gray-100 rounded-lg p-3 space-y-2 bg-white/60"
            style={{
              minHeight: 220,
              maxHeight: 420,
            }}
          >
            {activeConversationId ? (
              messagesLoading ? (
                <p className="text-xs text-gray-500">Loading messages…</p>
              ) : messages.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No messages yet. Say hello to start the conversation.
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[86%] rounded-2xl px-3 py-2 text-xs ${
                        m.isMine
                          ? 'bg-[#FF7043] text-white'
                          : 'bg-white text-gray-900 border border-gray-100'
                      }`}
                    >
                      {!m.isMine && (
                        <div className="font-bold text-[11px] mb-0.5 opacity-90">
                          {m.senderName}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {m.content}
                      </div>
                      <div className="text-[9px] opacity-75 mt-1 text-right">
                        {formatTime(m.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              <p className="text-xs text-gray-500">
                Select a conversation on the left or start a new one from a member profile.
              </p>
            )}
          </div>

          {/* Composer */}
          <form onSubmit={handleSend} className="mt-3 space-y-2">
            <textarea
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              disabled={!activeConversationId || isBlocked}
              placeholder={
                !activeConversationId
                  ? 'Select a conversation to start messaging…'
                  : isBlocked
                  ? 'You have blocked this member.'
                  : `Write a message…`
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[90px] disabled:bg-gray-50 bg-white"
            />
            <div className="flex items-center justify-end gap-2">
              {activeConversationId && (
                <button
                  type="button"
                  onClick={() => {
                    setComposer('');
                  }}
                  className="px-3 py-2 rounded-md border border-gray-200 text-sm hover:bg-white"
                >
                  Clear
                </button>
              )}

              <button
                type="submit"
                disabled={!activeConversationId || !composer.trim() || sending || isBlocked}
                className="px-4 py-2 rounded-md bg-[#ff8a65] text-white text-sm font-extrabold disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* ✅ Desktop-only: keep both columns always visible */}
      <style jsx>{`
        @media (min-width: 768px) {
          .md\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
