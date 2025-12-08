// components/signal/SignalMessages.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';

export default function SignalMessages() {
  const router = useRouter();
  const { toId, toName } = router.query;

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeTitle, setActiveTitle] = useState('');
  const [activeOtherUserId, setActiveOtherUserId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);

  // Fetch list of threads for left panel
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

  // Fetch messages for an active conversation
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
    if (!thread?.id) return;
    setActiveConversationId(thread.id);
    setActiveTitle(thread.title || 'Conversation');
    setActiveOtherUserId(thread.otherUserId || null);
    await fetchMessages(thread.id);
  };

  // Initial load of threads
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Deep link handler: /seeker/messages?toId=...&toName=...
  useEffect(() => {
    if (!router.isReady) return;

    const rawToId = Array.isArray(toId) ? toId[0] : toId;
    const rawToName = Array.isArray(toName) ? toName[0] : toName;

    if (!rawToId) return;

    async function start() {
      try {
        const res = await fetch('/api/signal/start-or-get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toUserId: rawToId }),
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        const convo = data.conversation;
        const otherUser = data.otherUser;

        if (!convo?.id) return;

        const title =
          otherUser?.name ||
          rawToName ||
          convo?.title ||
          'Conversation';

        setActiveConversationId(convo.id);
        setActiveTitle(title);
        setActiveOtherUserId(otherUser?.id || rawToId);

        // Refresh threads list and messages for this conversation
        await fetchThreads();
        await fetchMessages(convo.id);
      } catch (err) {
        console.error('start-or-get error:', err);
      }
    }

    start();
  }, [router.isReady, toId, toName, fetchThreads, fetchMessages]);

  const handleSend = async (e) => {
    e?.preventDefault?.();
    if (!activeConversationId || !composer.trim() || sending) return;

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

      if (!res.ok) throw new Error(await res.text());
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

      // Update thread preview (lastMessage, lastMessageAt, etc.)
      await fetchThreads();
    } catch (err) {
      console.error('send error:', err);
      alert('We could not send your message. Please try again.');
    } finally {
      setSending(false);
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
        <h2 className="text-sm font-semibold text-gray-800 mb-2">
          {activeConversationId
            ? activeTitle || 'Conversation'
            : 'Your Signal inbox is ready'}
        </h2>

        {!activeConversationId && (
          <p className="text-xs text-gray-600 mb-3">
            Start a conversation from a profile, candidate card, or coaching
            listing. Once you send a message, the thread will appear here.
          </p>
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
            disabled={!activeConversationId}
            placeholder={
              activeConversationId
                ? `Write a message to ${activeTitle || 'this member'}…`
                : 'Select a conversation to start messaging…'
            }
            className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px] disabled:bg-gray-50"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!activeConversationId || !composer.trim() || sending}
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
