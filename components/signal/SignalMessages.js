<<<<<<< HEAD
'use client';

import React, { useMemo, useState } from 'react';
=======
// components/signal/SignalMessages.js
import React, { useMemo, useState, useEffect } from 'react';
>>>>>>> 6ee98c0 (Add privacy delete user data system)
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import MessageComposer from './MessageComposer';
import ConversationHeader from './ConversationHeader';

<<<<<<< HEAD
/**
 * The Signal – personal inbox
 * ---------------------------
 * For now this is a local-only shell:
 * - No fake users / messages
 * - Shows a clear empty state when there are no conversations
 * - Keeps the full 2-column layout so the page doesn't feel broken
 *
 * Later we can hydrate `convos` and `messagesByConv` from your
 * conversations/messages API for the "personal" / default channel.
 */

export default function SignalMessages() {
  // When we wire the real API, this will be loaded from the server.
  const [convos, setConvos] = useState([]);
  const [messagesByConv, setMessagesByConv] = useState({});
  const [activeId, setActiveId] = useState('');

  const active = useMemo(
    () => convos.find((c) => c.id === activeId) || null,
    [convos, activeId]
  );

  const activeMessages = useMemo(
    () => (active ? messagesByConv[active.id] || [] : []),
    [messagesByConv, active]
  );

  const onSend = (text, attachments = []) => {
    if (!activeId || !text.trim()) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

=======
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
>>>>>>> 6ee98c0 (Add privacy delete user data system)
    const newMsg = {
      id: `m_${now.getTime()}`,
      from: 'me',
      text,
      attachments,
      time,
<<<<<<< HEAD
      timestamp: now.toISOString(),
    };

    setMessagesByConv((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMsg],
    }));

    setConvos((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              lastMessage:
                text.length > 30 ? `${text.slice(0, 30)}…` : text,
              time,
            }
          : c
      )
    );
  };

  const handleViewProfile = () => {
    if (!active) return;
    // Placeholder for now; later we can push to /profile/[slug] etc.
    alert(`Profile: ${active.name || 'Member'}`);
  };

  const handleToggleMute = (nextMuted) => {
    if (!active) return;
    setConvos((prev) =>
      prev.map((c) =>
        c.id === active.id ? { ...c, muted: !!nextMuted } : c
      )
    );
  };

  const handleDeleteConversation = () => {
    if (!active) return;
    setConvos((prev) => prev.filter((c) => c.id !== active.id));
    setMessagesByConv((prev) => {
      const copy = { ...prev };
      delete copy[active.id];
      return copy;
    });
    setActiveId('');
  };

  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 32%) 1fr',
    gap: '16px',
    minHeight: '520px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f9fafb',
  };

  const hasConversations = convos.length > 0;

  return (
    <div style={containerStyle}>
      {/* LEFT: conversation list / empty state */}
      <section
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: 12,
          background: '#ffffff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {hasConversations ? (
          <ConversationList
            conversations={convos}
            activeId={activeId}
            onSelect={setActiveId}
          />
        ) : (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: '#607D8B',
              fontSize: 14,
            }}
          >
            <p style={{ marginBottom: 4 }}>
              No conversations in The Signal yet.
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.5 }}>
              New chats are started from user profiles, candidate cards, or
              coaching listings. Once you send a message to someone, their
              thread will appear here.
            </p>
          </div>
        )}
      </section>

      {/* RIGHT: chat window / empty prompt */}
      <section
        style={{
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          gap: 0,
          minHeight: 0,
          border: '1px solid #eee',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {active ? (
          <>
            <ConversationHeader
              name={active.name || 'Conversation'}
=======
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
>>>>>>> 6ee98c0 (Add privacy delete user data system)
              status={active.subtitle || '—'}
              isMuted={!!active.muted}
              onViewProfile={handleViewProfile}
              onToggleMute={handleToggleMute}
              onDelete={handleDeleteConversation}
            />
<<<<<<< HEAD
            <div
              style={{
                minHeight: 0,
                overflowY: 'auto',
                padding: '0 16px',
              }}
            >
=======
            <div style={{ minHeight: 0, overflowY: 'auto', padding: '0 16px' }}>
>>>>>>> 6ee98c0 (Add privacy delete user data system)
              <MessageThread messages={activeMessages} />
            </div>
            <MessageComposer onSend={onSend} />
          </>
        ) : (
<<<<<<< HEAD
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              padding: 24,
              textAlign: 'center',
              color: '#607D8B',
              fontSize: 14,
            }}
          >
            {hasConversations ? (
              <span>Select a conversation to begin.</span>
            ) : (
              <div>
                <p style={{ marginBottom: 4 }}>
                  Your Signal inbox is ready.
                </p>
                <p style={{ fontSize: 13 }}>
                  Start a conversation from a profile or candidate card and
                  it will appear here automatically.
                </p>
              </div>
            )}
=======
          <div style={{
            display: 'grid',
            placeItems: 'center',
            color: '#607D8B',
            padding: '24px',
            fontSize: '16px'
          }}>
            Select a conversation to begin.
>>>>>>> 6ee98c0 (Add privacy delete user data system)
          </div>
        )}
      </section>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 6ee98c0 (Add privacy delete user data system)
