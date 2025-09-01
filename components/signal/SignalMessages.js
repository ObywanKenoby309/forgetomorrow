// components/signal/SignalMessages.js
import React, { useMemo, useState } from 'react';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import MessageComposer from './MessageComposer';
import ConversationHeader from './ConversationHeader';

// --- mock data for now ---
const seedConversations = [
  {
    id: 'c1',
    name: 'Jane Doe',
    avatar: 'https://via.placeholder.com/80?text=J',
    lastMessage: 'Do you have time to chat today?',
    time: '09:31 AM',
    unread: 0,
    muted: false,
    subtitle: 'Last seen 1h ago',
  },
  {
    id: 'c2',
    name: 'John Smith',
    avatar: 'https://via.placeholder.com/80?text=J',
    lastMessage: 'Sounds good—tomorrow 2pm…',
    time: '10:32 AM',
    unread: 1,
    muted: false,
    subtitle: 'Online',
  },
  {
    id: 'c3',
    name: 'Samantha Lee',
    avatar: 'https://via.placeholder.com/80?text=S',
    lastMessage: 'Following up on that resume.',
    time: '10:26 AM',
    unread: 0,
    muted: false,
    subtitle: 'Online',
  },
];

const seedMessages = {
  c3: [
    { id: 'm1', from: 'them', text: 'Thanks for the update!', time: '10:26 AM' },
    { id: 'm2', from: 'them', text: 'Following up on that resume.', time: '10:26 AM' },
  ],
  c1: [{ id: 'm3', from: 'them', text: 'Do you have time to chat today?', time: '09:31 AM' }],
  c2: [{ id: 'm4', from: 'them', text: 'Sounds good—tomorrow 2pm works.', time: '10:32 AM' }],
};

export default function SignalMessages() {
  const [convos, setConvos] = useState(seedConversations);
  const [messagesByConv, setMessagesByConv] = useState(seedMessages);
  const [activeId, setActiveId] = useState('c3');

  const active = useMemo(
    () => convos.find((c) => c.id === activeId) || null,
    [convos, activeId]
  );

  const activeMessages = active ? messagesByConv[active.id] || [] : [];

  const onSend = (text, attachments = []) => {
    if (!active) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessagesByConv((prev) => {
      const next = { ...prev };
      const newMsg = {
        id: `m_${now.getTime()}`,
        from: 'me',
        text,
        time,
        attachments,
      };
      next[active.id] = [...(next[active.id] || []), newMsg];
      return next;
    });

    // update preview line & time
    setConvos((prev) =>
      prev.map((c) =>
        c.id === active.id ? { ...c, lastMessage: text || 'Attachment', time } : c
      )
    );
  };

  // ---- Header actions ----
  const handleViewProfile = () => {
    if (!active) return;
    alert(`Open profile for ${active.name}`);
  };

  const handleToggleMute = (nextMuted) => {
    if (!active) return;
    setConvos((prev) =>
      prev.map((c) => (c.id === active.id ? { ...c, muted: nextMuted } : c))
    );
  };

  const handleDeleteConversation = () => {
    if (!active) return;
    setConvos((prev) => {
      const nextList = prev.filter((c) => c.id !== active.id);
      // choose next active: next item in list or previous one
      const currentIdx = prev.findIndex((c) => c.id === active.id);
      const fallbackIdx =
        currentIdx < nextList.length ? currentIdx : Math.max(0, nextList.length - 1);
      setActiveId(nextList[fallbackIdx]?.id || '');
      return nextList;
    });
    setMessagesByConv((prev) => {
      const copy = { ...prev };
      delete copy[active.id];
      return copy;
    });
  };

  const layout = {
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 32%) 1fr',
    gap: 16,
    minHeight: 520,
  };

  return (
    <div style={layout}>
      <ConversationList conversations={convos} activeId={activeId} onSelect={setActiveId} />

      <section
        style={{
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto', // header + thread + composer
          gap: 0,
          minHeight: 0,
          border: '1px solid #eee',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {active ? (
          <>
            <ConversationHeader
              name={active.name}
              status={active.subtitle || '—'} // map subtitle -> status
              isMuted={!!active.muted}        // map muted -> isMuted
              onViewProfile={handleViewProfile}
              onToggleMute={handleToggleMute}
              onDelete={handleDeleteConversation}
            />

            <div style={{ minHeight: 0 }}>
              <MessageThread partnerName={active.name} messages={activeMessages} />
            </div>

            <MessageComposer onSend={onSend} />
          </>
        ) : (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              color: '#607D8B',
              padding: 24,
            }}
          >
            Select a conversation to begin.
          </div>
        )}
      </section>
    </div>
  );
}
