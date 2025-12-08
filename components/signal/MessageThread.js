// components/signal/SignalMessages.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import ConversationList from './ConversationList';
import ConversationHeader from './ConversationHeader';
import MessageThread from './MessageThread';
import MessageComposer from './MessageComposer';

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
    await fetchMessages(thread.id);
  };

  // Initial load
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Deep-link handling (?toId=&toName=)
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

        const title =
          otherUser?.name || rawToName || convo?.title || 'Conversation';

        setActiveConversationId(convo.id);
        setActiveTitle(title);
        setActiveOtherUserId(otherUser?.id || rawToId);

        await fetchThreads();
        await fetchMessages(convo.id);
      } catch (err) {
        console.error('start-or-get error:', err);
      }
    }

    start();
  }, [router.isReady, toId, toName, fetchThreads, fetchMessages]);

  const handleSend = async () => {
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
      await fetchThreads();
    } catch (err) {
      console.error('send error:', err);
      alert('We could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const hasActive = !!activeConversationId;

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
      {/* Left: conversation list */}
      <ConversationList
        threads={threads}
        loading={threadsLoading}
        activeConversationId={activeConversationId}
        onSelect={openConversation}
      />

      {/* Right: active conversation */}
      <section className="bg-white rounded-lg shadow p-4 border border-gray-100 flex flex-col">
        <ConversationHeader hasActive={hasActive} title={activeTitle} />

        <MessageThread
          messages={messages}
          loading={messagesLoading}
          hasActive={hasActive}
        />

        <MessageComposer
          disabled={!hasActive}
          value={composer}
          onChange={setComposer}
          onSend={handleSend}
          sending={sending}
          placeholder={
            hasActive
              ? `Write a message to ${activeTitle || 'this member'}…`
              : 'Select a conversation to start messaging…'
          }
        />
      </section>
    </div>
  );
}
