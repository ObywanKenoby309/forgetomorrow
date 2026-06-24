// pages/demo/hearth.js
import React, { useState } from 'react';
import Head from 'next/head';
import SeekerLayout from '@/components/layouts/SeekerLayout';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 14 };

const POSTS = [
  { author: 'Alexandra Chen', role: 'Senior PM at Stripe', avatar: '👩‍💼', time: '2 hours ago', content: 'Just got the offer I\'ve been working toward for 8 months. ForgeTomorrow\'s WHY score helped me understand exactly why I was a fit — and how to articulate it in the interview. 94/100 match. They said it was one of the strongest applications they\'d seen. 🙌', likes: 47, comments: 12 },
  { author: 'Marcus Johnson', role: 'Engineering Lead', avatar: '🧔', time: '5 hours ago', content: 'Hot take: Most job seekers are marketing their job history, not their career signal. There\'s a massive difference. Your title doesn\'t get you the interview. The story behind it does. What\'s your signal?', likes: 83, comments: 31 },
  { author: 'Priya Sharma', role: 'Career Coach', avatar: '👩', time: 'Yesterday', content: 'Working with a client who went from "no responses" to 3 interviews in 2 weeks. One change: we stopped optimizing for keywords and started building evidence. Profile views up 340%. Resume response rate up from 4% to 28%.', likes: 124, comments: 44 },
  { author: 'James Rivera', role: 'VP Sales', avatar: '🧑‍💼', time: '2 days ago', content: "I was 4 rounds deep into a $280K offer. The negotiation engine showed me I was 18% below market with my specific experience profile. Went back with data, not feelings. Final offer: $334K + equity. Don't leave money on the table.", likes: 201, comments: 67 },
];

const TABS = ['Community Feed', 'Resources', 'Events', 'Mentorship', 'Forums'];

export default function DemoHearth() {
  const [tab, setTab] = useState('Community Feed');

  return (
    <>
      <Head><title>The Hearth — ForgeTomorrow</title></Head>
      <SeekerLayout header={
        <div style={{ ...GLASS, textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontStyle: 'italic', textShadow: '0 2px 8px rgba(255,112,67,0.4)' }}>The Hearth</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Where the ForgeTomorrow community gathers — share wins, swap strategies, and build together.</div>
        </div>
      }>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
          <div>
            {/* Tabs */}
            <div style={{ ...GLASS, padding: 0, marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                {TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{ flex: 1, padding: '13px 8px', fontWeight: tab === t ? 800 : 600, fontSize: 12, color: tab === t ? ORANGE : '#64748B', background: 'none', border: 'none', borderBottom: tab === t ? `2px solid ${ORANGE}` : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Post composer */}
            <div style={{ ...GLASS, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,112,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>👨‍💼</div>
                <div style={{ flex: 1 }}>
                  <textarea placeholder="Share a win, insight, or question with the community..."
                    style={{ width: '100%', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: 12, fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit', background: 'rgba(255,255,255,0.8)', boxSizing: 'border-box' }} rows={3} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '8px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Post</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts */}
            {POSTS.map((post, i) => (
              <div key={i} style={{ ...GLASS, marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,112,67,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{post.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>{post.author}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{post.role} · {post.time}</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.65, marginBottom: 14 }}>{post.content}</div>
                <div style={{ display: 'flex', gap: 16, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12 }}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748B', fontSize: 13, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>👍 {post.likes}</button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748B', fontSize: 13, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>💬 {post.comments}</button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748B', fontSize: 13, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>↗ Share</button>
                </div>
              </div>
            ))}
          </div>

          {/* Right rail */}
          <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
            <div style={{ ...GLASS }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 12 }}>Community Pulse</div>
              {[['👥', '12,847', 'Members'], ['📝', '3,421', 'Posts this month'], ['🤝', '891', 'Mentors available'], ['🎉', '247', 'Wins shared today']].map(([icon, val, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE }}>{val}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ ...GLASS }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 12 }}>Upcoming Events</div>
              {[{ title: 'Resume Review Workshop', date: 'Thu Jun 27 · 2:00 PM', host: 'Sarah K., Career Coach' }, { title: 'Salary Negotiation Masterclass', date: 'Fri Jun 28 · 12:00 PM', host: 'Marcus W., Recruiter' }, { title: 'AI Tools for Job Seekers', date: 'Mon Jul 1 · 3:00 PM', host: 'ForgeTomorrow Team' }].map((ev, i) => (
                <div key={i} style={{ ...WHITE_CARD, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{ev.title}</div>
                  <div style={{ fontSize: 11, color: ORANGE, fontWeight: 600, marginTop: 3 }}>{ev.date}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Hosted by {ev.host}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SeekerLayout>
    </>
  );
}
