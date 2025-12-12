// components/signal/SignalMessages.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';

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
  };

  // Initial load of threads
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // 🔹 Deep-link handler:
  // Use ?toId / ?told purely to select a thread AFTER threads are loaded.
  useEffect(() => {
    if (!router.isReady) return;

    const deepLinkIdRaw = Array.isArray(toId || told)
      ? (toId || told)[0]
      : (toId || told);

    if (!deepLinkIdRaw) return;
    if (threadsLoading) return;

    // Find a thread where otherUserId matches the deep-link target
    const match = threads.find(
      (t) =>
        t.otherUserId &&
        String(t.otherUserId) === String(deepLinkIdRaw)
    );

    if (match) {
      openConversation(match);
    }

    // Clean the URL (keep chrome only)
    const cleanQuery = {};
    if (chrome) cleanQuery.chrome = chrome;

    router.replace(
      { pathname: router.pathname, query: cleanQuery },
      undefined,
      { shallow: true }
    );
  }, [router.isReady, toId, told, chrome, threads, threadsLoading, fetchMessages]); // openConversation uses fetchMessages

  const handleSend = async (e) => {
    e?.preventDefault?.();
    if (!activeConversationId || !composer.trim() || sending || isBlocked)
      return;

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

  // 🔹 Block this member
  const handleBlock = async () => {
    if (!activeOtherUserId) {
      alert('We could not determine which member to block.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to block this member? ' +
        'They will no longer be able to message you, and you will not see new messages from them.'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/signal/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: activeOtherUserId }),
      });

      if (!res.ok) {
        console.error('block error status:', res.status, await res.text());
        alert('We could not block this member. Please try again.');
        return;
      }

      setIsBlocked(true);
      setComposer('');
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

      // Clear active state and refresh threads
      setActiveConversationId(null);
      setActiveTitle('');
      setActiveOtherUserId(null);
      setMessages([]);
      setIsBlocked(false);

      await fetchThreads();
    } catch (err) {
      console.error('delete error:', err);
      alert('We could not delete this conversation. Please try again.');
    }
  };

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
      {/* Left: Threads list */}
      <section className="bg-white rounded-lg shadow p-4 border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">
          Conversations
        </h2>

        {threadsLoading ? (
          <p className="text-xs text-gray-500">Loading conversations…</p>
        ) : threads.length === 0 ? (
          <p className="text-xs text-gray-600">
            No conversations in The Signal yet.
            <br />
            Start a conversation from a member profile or candidate card.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {threads.map((t) => (
              <li
                key={t.id}
                className={`py-2 px-1 flex items-start gap-3 cursor-pointer rounded-md ${
                  t.id === activeConversationId
                    ? 'bg-[#FFF3E9]'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => openConversation(t)}
              >
                <div className="flex-shrink-0">
                  {t.otherAvatarUrl ? (
                    <img
                      src={t.otherAvatarUrl}
                      alt={t.title}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                      {t.title?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {t.title}
                    </p>
                    {t.lastMessageAt && (
                      <span className="text-[10px] text-gray-500 whitespace-nowrap">
                        {new Date(t.lastMessageAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  {t.lastMessage && (
                    <p className="text-xs text-gray-600 truncate">
                      {t.lastMessage}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Right: Active conversation */}
      <section className="bg-white rounded-lg shadow p-4 border border-gray-100 flex flex-col">
        <div className="flex items-center justify-between mb-2 gap-2">
          <h2 className="text-sm font-semibold text-gray-800">
            {activeConversationId
              ? activeTitle || 'Conversation'
              : 'Your Signal inbox is ready'}
          </h2>

          {activeConversationId && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteConversation}
                className="text-[11px] px-2 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Delete chat
              </button>
              <button
                type="button"
                onClick={handleReport}
                className="text-[11px] px-2 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Report
              </button>
              <button
                type="button"
                onClick={handleBlock}
                className="text-[11px] px-2 py-1 border border-red-300 rounded-md text-red-700 hover:bg-red-50"
              >
                Block
              </button>
            </div>
          )}
        </div>

        {!activeConversationId && (
          <p className="text-xs text-gray-600 mb-3">
            Start a conversation from a profile, candidate card, or coaching
            listing. Once you send a message, the thread will appear here.
          </p>
        )}

        {activeConversationId && isBlocked && (
          <div className="mb-3 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            You have blocked this member. You will not be able to send new
            messages in this conversation.
          </div>
        )}

        {/* Messages list */}
        <div className="flex-1 min-h-[180px] max-h-[360px] overflow-y-auto border border-gray-100 rounded-md p-3 mb-3 space-y-2">
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
                  className={`flex ${
                    m.isMine ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                      m.isMine
                        ? 'bg-[#FF7043] text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {!m.isMine && (
                      <div className="font-semibold mb-0.5">
                        {m.senderName}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    <div className="text-[9px] opacity-80 mt-1 text-right">
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            <p className="text-xs text-gray-500">
              Select a conversation on the left or start a new one from a
              member&apos;s profile.
            </p>
          )}
        </div>

        {/* Composer */}
        <form onSubmit={handleSend} className="space-y-2">
          <textarea
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            disabled={!activeConversationId || isBlocked}
            placeholder={
              !activeConversationId
                ? 'Select a conversation to start messaging…'
                : isBlocked
                ? 'You have blocked this member.'
                : `Write a message to ${activeTitle || 'this member'}…`
            }
            className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px] disabled:bg-gray-50"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={
                !activeConversationId || !composer.trim() || sending || isBlocked
              }
              className="px-4 py-2 rounded-md bg-[#ff8a65] text-white text-sm font-semibold disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
