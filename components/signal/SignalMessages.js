// components/signal/SignalMessages.js
import React, { useMemo, useState, useEffect } from 'react';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import MessageComposer from './MessageComposer';
import ConversationHeader from './ConversationHeader';

// === FAKE USER — NO AUTH NEEDED ===
const fakeSession = {
  user: { id: 'user_123', name: 'Eric James', email: 'eric@forgetomorrow.com' }
};

const seedConversations = [
  { id: 'c1', name: 'Jane Doe', avatar: 'https://via.placeholder.com/80?text=J', lastMessage: 'Do you have time to chat today?', time: '09:31 AM', unread: 0, muted: false, subtitle: 'Last seen 1h ago' },
  { id: 'c2', name: 'John Smith', avatar: 'https://via.placeholder.com/80?text=J', lastMessage: 'Sounds good—tomorrow 2pm…', time: '10:32 AM', unread: 0, muted: false, subtitle: 'Online' },
  { id: 'c3', name: 'Samantha Lee', avatar: 'https://via.placeholder.com/80?text=S', lastMessage: 'Following up on that resume.', time: '10:26 AM', unread: 0, muted: false, subtitle: 'Online' },
];

const seedMessages = {
  c1: [
    { id: 'm1', from: 'them', text: 'Hey! How’s the job hunt?', time: '09:30 AM' },
    { id: 'm2', from: 'me', text: 'Good! Just updated my resume.', time: '09:31 AM' }
  ],
  c2: [
    { id: 'm3', from: 'them', text: 'Can we meet tomorrow?', time: '10:30 AM' }
  ],
  c3: [
    { id: 'm4', from: 'them', text: 'Thanks for the resume!', time: '10:25 AM' },
    { id: 'm5', from: 'me', text: 'Any feedback?', time: '10:26 AM' }
  ]
};

export default function SignalMessages() {
  const session = fakeSession; // No auth, always logged in
  const [convos, setConvos] = useState(seedConversations);
  const [messagesByConv, setMessagesByConv] = useState(seedMessages);
  const [activeId, setActiveId] = useState('c3');

  // === AUTO-LOAD MESSAGES ON SELECT ===
  useEffect(() => {
    if (activeId && !messagesByConv[activeId]?.length) {
      setMessagesByConv(prev => ({ ...prev, [activeId]: seedMessages[activeId] || [] }));
    }
  }, [activeId]);

  // === CLEAR UNREAD ===
  useEffect(() => {
    if (activeId) {
      setConvos(prev => prev.map(c => c.id === activeId ? { ...c, unread: 0 } : c));
    }
  }, [activeId]);

  const active = useMemo(() => convos.find(c => c.id === activeId) || null, [convos, activeId]);
  const activeMessages = active ? messagesByConv[active.id] || [] : [];

  const onSend = (text, attachments = []) => {
    if (!activeId || !text.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: `m_${now.getTime()}`,
      from: 'me',
      text,
      attachments,
      time,
      timestamp: now.toISOString()
    };

    setMessagesByConv(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMsg]
    }));

    setConvos(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, lastMessage: text.slice(0, 30) + (text.length > 30 ? '...' : ''), time }
        : c
    ));
  };

  const handleViewProfile = () => active && alert(`Profile: ${active.name}`);
  const handleToggleMute = (nextMuted) => {
    if (active) {
      setConvos(prev => prev.map(c => c.id === active.id ? { ...c, muted: nextMuted } : c));
    }
  };
  const handleDeleteConversation = () => {
    if (active) {
      setConvos(prev => prev.filter(c => c.id !== active.id));
      const copy = { ...messagesByConv };
      delete copy[active.id];
      setMessagesByConv(copy);
      setActiveId(convos.find(c => c.id !== active.id)?.id || '');
    }
  };

  // === LAYOUT — 100% VALID, NO HYDRATION ERRORS ===
  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 32%) 1fr',
    gap: '16px', // ← FIXED: was invalid number
    minHeight: '520px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f9fafb'
  };

  return (
    <div style={containerStyle}>
      {/* LEFT: CONVERSATION LIST */}
      <ConversationList
        conversations={convos}
        activeId={activeId}
        onSelect={setActiveId}
      />

      {/* RIGHT: CHAT WINDOW */}
      <section style={{
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        gap: '0px',
        minHeight: '0',
        border: '1px solid #eee',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {active ? (
          <>
            <ConversationHeader
              name={active.name}
              status={active.subtitle || '—'}
              isMuted={!!active.muted}
              onViewProfile={handleViewProfile}
              onToggleMute={handleToggleMute}
              onDelete={handleDeleteConversation}
            />
            <div style={{ minHeight: 0, overflowY: 'auto', padding: '0 16px' }}>
              <MessageThread messages={activeMessages} />
            </div>
            <MessageComposer onSend={onSend} />
          </>
        ) : (
          <div style={{
            display: 'grid',
            placeItems: 'center',
            color: '#607D8B',
            padding: '24px',
            fontSize: '16px'
          }}>
            Select a conversation to begin.
          </div>
        )}
      </section>
    </div>
  );
}