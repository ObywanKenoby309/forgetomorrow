'use client';

import React, { useMemo, useState } from 'react';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import MessageComposer from './MessageComposer';
import ConversationHeader from './ConversationHeader';

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

    const newMsg = {
      id: `m_${now.getTime()}`,
      from: 'me',
      text,
      attachments,
      time,
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
