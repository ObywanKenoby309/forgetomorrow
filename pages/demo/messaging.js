// pages/demo/messaging.js
// Demo — Signal messaging with fake conversations
import React, { useState } from 'react';
import Head from 'next/head';
import SeekerLayout from '@/components/layouts/SeekerLayout';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18 };

const THREADS = [
  {
    id: 'ted', name: 'Ted Sitz', avatar: '🧔', role: 'Head of UX Testing', time: '2:14 PM',
    preview: 'I need to talk to you about my salary...', unread: 3,
    messages: [
      { from: 'Ted Sitz', text: 'Hey, do you have a minute? I need to talk about something important.', time: '2:08 PM', mine: false },
      { from: 'Ted Sitz', text: "I've been doing a lot of research and I think I deserve a raise. I've been here 2 years and my performance has been exceptional.", time: '2:09 PM', mine: false },
      { from: 'Me', text: 'Hi Ted, sure. What did you have in mind?', time: '2:11 PM', mine: true },
      { from: 'Ted Sitz', text: "I'm thinking 40%. I've benchmarked against the market and I'm significantly underpaid for the value I bring.", time: '2:12 PM', mine: false },
      { from: 'Ted Sitz', text: 'Also I prepared a 47-slide deck to support my case. Should I send it?', time: '2:14 PM', mine: false },
    ]
  },
  {
    id: 'wife', name: 'Sarah James', avatar: '💁‍♀️', role: 'Your better half', time: '1:30 PM',
    preview: "Don't forget dinner tonight. And the kids.", unread: 1,
    messages: [
      { from: 'Sarah James', text: "Hey, are you coming home for dinner tonight or are you 'working late' again?", time: '12:15 PM', mine: false },
      { from: 'Me', text: 'Yes! I promise. 6pm.', time: '12:22 PM', mine: true },
      { from: "Sarah James", text: "Good. Also the kids have practice at 5. And your mom called. And we're out of milk.", time: '1:28 PM', mine: false },
      { from: 'Sarah James', text: "Don't forget dinner tonight. And the kids.", time: '1:30 PM', mine: false },
    ]
  },
  {
    id: 'recruiter1', name: 'Jessica Chen', avatar: '👩‍💼', role: 'Senior Recruiter at Stripe', time: '11:42 AM',
    preview: "We'd love to move forward with your application.", unread: 0,
    messages: [
      { from: 'Jessica Chen', text: 'Hi! I came across your ForgeTomorrow profile and was really impressed by your background.', time: '10:30 AM', mine: false },
      { from: 'Me', text: "Thank you, Jessica! I've been following Stripe's growth closely.", time: '10:45 AM', mine: true },
      { from: 'Jessica Chen', text: "We'd love to move forward with your application. Are you available for a call this week?", time: '11:42 AM', mine: false },
    ]
  },
  {
    id: 'recruiter2', name: 'Marcus Webb', avatar: '🧑‍💼', role: 'Talent Lead at Airbnb', time: 'Yesterday',
    preview: 'Your WHY score was 96/100 for this role...', unread: 0,
    messages: [
      { from: 'Marcus Webb', text: "Hi! Your WHY score was 96/100 for our VP of Product role. That's one of the highest we've seen.", time: 'Yesterday', mine: false },
      { from: 'Me', text: "That's great to hear! I'd love to learn more about the role.", time: 'Yesterday', mine: true },
    ]
  },
];

export default function DemoMessaging() {
  const [activeThread, setActiveThread] = useState(THREADS[0]);
  const [input, setInput] = useState('');

  return (
    <>
      <Head><title>Messages — ForgeTomorrow</title></Head>
      <SeekerLayout hideDesktopRightRail header={
        <div style={{ ...GLASS, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: ORANGE, fontStyle: 'italic' }}>The Signal</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Your professional inbox — keep it signal, cut the noise.</div>
        </div>
      }>
        <div style={{ ...GLASS, overflow: 'hidden', display: 'grid', gridTemplateColumns: '280px 1fr', height: 600 }}>
          {/* Thread list */}
          <div style={{ borderRight: '1px solid rgba(0,0,0,0.07)', overflowY: 'auto' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)', fontWeight: 800, fontSize: 13, color: '#334155' }}>Messages</div>
            {THREADS.map((t) => (
              <div key={t.id} onClick={() => setActiveThread(t)}
                style={{ padding: '12px 14px', cursor: 'pointer', background: activeThread.id === t.id ? 'rgba(255,112,67,0.07)' : 'transparent', borderBottom: '1px solid rgba(0,0,0,0.04)', borderLeft: activeThread.id === t.id ? `3px solid ${ORANGE}` : '3px solid transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,112,67,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{t.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8', flexShrink: 0, marginLeft: 4 }}>{t.time}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{t.preview}</div>
                  </div>
                  {t.unread > 0 && <div style={{ minWidth: 18, height: 18, borderRadius: 999, background: ORANGE, color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{t.unread}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Active thread */}
          <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.6)' }}>
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,112,67,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{activeThread.avatar}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>{activeThread.name}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{activeThread.role}</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeThread.messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.mine ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '70%', background: msg.mine ? ORANGE : 'rgba(255,255,255,0.9)', color: msg.mine ? '#fff' : '#0F172A', borderRadius: msg.mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '10px 14px', fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <div>{msg.text}</div>
                    <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: 'right' }}>{msg.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 10 }}>
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..."
                style={{ flex: 1, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 999, padding: '10px 16px', fontSize: 13, outline: 'none', background: 'rgba(255,255,255,0.9)' }} />
              <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '10px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Send</button>
            </div>
          </div>
        </div>
      </SeekerLayout>
    </>
  );
}
