// pages/demo/messaging.js
import React, { useState } from 'react';
import Head from 'next/head';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

const ORANGE = '#FF7043';
const SLATE  = '#1E293B';
const MUTED  = '#64748B';

const GLASS = {
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.68)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  borderRadius: 18,
};
const ORANGE_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};

// Avatar images — approved three only
const AVATARS = {
  a: '/profile-avatars/avatar-professional-path.png',
  b: '/profile-avatars/avatar-tech-nexus.png',
  c: '/profile-avatars/demo-avatar.png',
};

const THREADS = [
  {
    id: 'ted',
    name: 'Ted Sitz',
    avatar: AVATARS.a,
    role: 'Head of UX Testing',
    time: '03:21 AM',
    preview: "Dangit Eric! I'm going to send you an email",
    unread: 4,
    messages: [
      { from: 'Ted Sitz', text: 'I really need a raise.', time: '03:10 AM', mine: false },
      { from: 'Ted Sitz', text: 'Eric, I need to talk to you about getting a raise.', time: '03:11 AM', mine: false },
      { from: 'Ted Sitz', text: "Eric are you even there? You better not be ignoring me.", time: '03:08 PM', mine: false },
      { from: 'Ted Sitz', text: "Dangit Eric! I'm going to send you an email", time: '04:57 AM', mine: false },
    ],
  },
  {
    id: 'jessica',
    name: 'Jessica Chen',
    avatar: AVATARS.b,
    role: 'Senior Recruiter',
    time: '11:42 AM',
    preview: "We'd love to move forward with your application.",
    unread: 2,
    messages: [
      { from: 'Jessica Chen', text: "Hi! I came across your ForgeTomorrow profile and was really impressed by your background.", time: '10:30 AM', mine: false },
      { from: 'Me', text: "Thank you Jessica! I'd love to learn more about the opportunity.", time: '10:45 AM', mine: true },
      { from: 'Jessica Chen', text: "We'd love to move forward with your application. Are you available for a call this week?", time: '11:42 AM', mine: false },
    ],
  },
  {
    id: 'marcus',
    name: 'Marcus Webb',
    avatar: AVATARS.c,
    role: 'Talent Lead',
    time: 'Yesterday',
    preview: 'Your WHY score was 96/100 for this role...',
    unread: 0,
    messages: [
      { from: 'Marcus Webb', text: "Hi! Your WHY score was 96/100 for our VP of Product role. That's one of the highest we've seen.", time: 'Yesterday', mine: false },
      { from: 'Me', text: "That's great to hear! I'd love to learn more.", time: 'Yesterday', mine: true },
    ],
  },
];

function Avatar({ src, name, size = 36 }) {
  return (
    <img
      src={src}
      alt={name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block' }}
    />
  );
}

export default function DemoMessaging() {
  const [threads, setThreads] = useState(THREADS);
  const [activeThread, setActiveThread] = useState(THREADS[0]);
  const [input, setInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleDeleteRequest() {
    setMenuOpen(false);
    setConfirmDelete(true);
  }

  function handleConfirmDelete() {
    const remaining = threads.filter(t => t.id !== activeThread.id);
    setThreads(remaining);
    setActiveThread(remaining[0] || null);
    setConfirmDelete(false);
  }

  const titleCard = (
    <div style={{ ...GLASS, padding: '16px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>GOOD MORNING</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontStyle: 'italic', ...ORANGE_LIFT }}>The Signal</div>
      <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
        Chat with coaches, recruiters, and peers all in one place. New conversations are started from user profile and candidate cards. Once you send a message from someone's profile, the thread will appear here so you can pick it up any time.
      </div>
    </div>
  );

  const confirmModal = confirmDelete && (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'rgba(255,255,255,0.96)', borderRadius: 18, padding: 28, maxWidth: 380, width: '90%', boxShadow: '0 24px 48px rgba(0,0,0,0.22)', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: SLATE, marginBottom: 10 }}>Delete Conversation?</div>
        <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginBottom: 24 }}>
          Are you sure you want to delete your conversation with <strong>{activeThread?.name}</strong>? This cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => setConfirmDelete(false)} style={{ padding: '10px 24px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.15)', background: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 700, color: SLATE, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleConfirmDelete} style={{ padding: '10px 24px', borderRadius: 999, border: 'none', background: '#DC2626', fontSize: 13, fontWeight: 800, color: 'white', cursor: 'pointer' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {confirmModal}
      <SeekerLayout
        header={titleCard}
        right={<RightRailPlacementManager surfaceId="the_signal" />}
        rightVariant="light"
        activeNav="messages"
      >
        {/* Messaging panel */}
        <div style={{
          ...GLASS,
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          height: 560,
          borderRadius: 18,
          padding: 0,
        }}>

          {/* Thread list */}
          <div style={{ borderRight: '1px solid rgba(0,0,0,0.07)', overflowY: 'auto', background: 'rgba(255,255,255,0.72)' }}>
            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: SLATE }}>Messages</div>
              <button style={{ fontSize: 11, color: ORANGE, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Refresh</button>
            </div>

            {/* Search */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <input
                placeholder="Search messages..."
                style={{ width: '100%', border: '1px solid rgba(0,0,0,0.10)', borderRadius: 999, padding: '7px 14px', fontSize: 12, outline: 'none', background: 'rgba(255,255,255,0.9)', boxSizing: 'border-box', color: SLATE }}
              />
            </div>

            {/* Threads */}
            {threads.map(t => (
              <div
                key={t.id}
                onClick={() => setActiveThread(t)}
                style={{
                  padding: '12px 14px',
                  cursor: 'pointer',
                  background: activeThread.id === t.id ? 'rgba(255,112,67,0.07)' : 'transparent',
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                  borderLeft: activeThread.id === t.id ? `3px solid ${ORANGE}` : '3px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Avatar src={t.avatar} name={t.name} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: SLATE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8', flexShrink: 0, marginLeft: 6 }}>{t.time}</div>
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.preview}</div>
                </div>
                {t.unread > 0 && (
                  <div style={{ minWidth: 18, height: 18, borderRadius: 999, background: ORANGE, color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {t.unread}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Active thread */}
          <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.55)' }}>

            {/* Thread header */}
            <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.80)', position: 'relative' }}>
              <Avatar src={activeThread.avatar} name={activeThread.name} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: SLATE }}>{activeThread.name}</div>
                <div style={{ fontSize: 11, color: MUTED }}>{activeThread.role}</div>
              </div>

              {/* 3-dot menu */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(p => !p)}
                  style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: SLATE, fontWeight: 900 }}
                >
                  ⋮
                </button>
                {menuOpen && (
                  <div style={{ position: 'absolute', top: 40, right: 0, zIndex: 99, background: 'white', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.16)', border: '1px solid rgba(0,0,0,0.08)', minWidth: 160, overflow: 'hidden' }}>
                    {[
                      { label: 'Delete', color: SLATE, action: () => { setMenuOpen(false); handleDeleteRequest(); } },
                      { label: 'Report', color: SLATE, action: () => setMenuOpen(false) },
                      { label: 'Block',  color: '#DC2626', action: () => setMenuOpen(false) },
                    ].map(item => (
                      <button key={item.label} onClick={item.action} style={{ display: 'block', width: '100%', padding: '13px 18px', textAlign: 'left', background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: item.color, cursor: 'pointer', borderBottom: item.label !== 'Block' ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeThread.messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.mine ? 'flex-end' : 'flex-start' }}>
                  {!msg.mine && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, marginBottom: 3, paddingLeft: 2 }}>{msg.from}</div>
                  )}
                  <div style={{
                    maxWidth: '68%',
                    background: msg.mine ? ORANGE : 'rgba(255,255,255,0.92)',
                    color: msg.mine ? '#fff' : SLATE,
                    borderRadius: msg.mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    padding: '10px 14px',
                    fontSize: 13,
                    lineHeight: 1.5,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3, paddingLeft: 2, paddingRight: 2 }}>{msg.time}</div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 10, background: 'rgba(255,255,255,0.80)' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message..."
                style={{ flex: 1, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 999, padding: '10px 18px', fontSize: 13, outline: 'none', background: 'rgba(255,255,255,0.95)', color: SLATE }}
              />
              <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '10px 22px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                Send
              </button>
            </div>
          </div>
        </div>
      </SeekerLayout>
    </>
  );
}