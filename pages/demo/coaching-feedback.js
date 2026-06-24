// pages/demo/coaching-feedback.js
import React, { useState } from 'react';
import Head from 'next/head';
import CoachingLayout from '@/components/layouts/CoachingLayout';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 14 };

const REVIEWS = [
  { client: 'Sarah Mitchell', avatar: '👩', date: 'Jun 20, 2026', satisfaction: 5, timeliness: 5, quality: 5, comment: "Working with this coach has been transformative. I went from 0 interviews to 3 in 2 weeks after we rebuilt my resume and LinkedIn. The WHY score analysis was eye-opening — I finally understand why I wasn't getting responses. 10/10 would recommend to anyone serious about their career.", session: 'Strategy Session' },
  { client: 'Marcus Thompson', avatar: '🧔', date: 'Jun 18, 2026', satisfaction: 5, timeliness: 4, quality: 5, comment: 'Incredible insight into salary negotiation. I was about to accept an offer $40K below my market value. After one session I went back with data and got $334K total comp vs the original $290K offer. This coaching paid for itself 100x over.', session: 'Salary Negotiation' },
  { client: 'Jennifer Park', avatar: '👩‍💼', date: 'Jun 15, 2026', satisfaction: 5, timeliness: 5, quality: 5, comment: "I came in wanting to pivot from marketing to product management. Seemed impossible. 3 months later I have 2 product role offers on the table. The structured approach and ForgeTomorrow tools made all the difference. Forever grateful.", session: 'Career Pivot Planning' },
  { client: 'David Chen', avatar: '🧑‍💼', date: 'Jun 12, 2026', satisfaction: 4, timeliness: 5, quality: 4, comment: 'Very helpful session on executive presence and stakeholder communication. Gave me concrete frameworks I could apply immediately. Would have liked more time on the specific examples but overall really valuable.', session: 'Executive Coaching' },
  { client: 'Alex Rivera', avatar: '🧑', date: 'May 28, 2026', satisfaction: 5, timeliness: 4, quality: 5, comment: "Returning to the workforce after 2 years was terrifying. This coach helped me reframe my 'gap' as a strength and position my caregiving experience as leadership. Got 3 callbacks in the first week of applying. Phenomenal.", session: 'Career Reentry' },
  { client: 'Ted Sitz', avatar: '🧔', date: 'May 15, 2026', satisfaction: 1, timeliness: 2, quality: 1, comment: "I asked for a 40% raise and was told I wasn't being realistic. Coach didn't support my vision. I prepared a 47-slide deck and everything. Would not recommend. I'm taking my business elsewhere and I'm also writing a strongly-worded blog post about this.", session: 'Salary Negotiation' },
];

const avg = (key) => (REVIEWS.reduce((s, r) => s + r[key], 0) / REVIEWS.length).toFixed(1);

export default function DemoCoachingFeedback() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? REVIEWS : REVIEWS.filter(r => {
    const avg = (r.satisfaction + r.timeliness + r.quality) / 3;
    return filter === 'positive' ? avg >= 4 : avg < 4;
  });

  return (
    <>
      <Head><title>Feedback — ForgeTomorrow Coaching</title></Head>
      <CoachingLayout>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ ...GLASS, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: ORANGE, fontStyle: 'italic' }}>Client Feedback</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Review session ratings, testimonials, and areas for growth.</div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[['Overall Rating', `${avg('satisfaction')}/5`, '⭐'], ['Timeliness', `${avg('timeliness')}/5`, '⏱'], ['Quality', `${avg('quality')}/5`, '💎'], ['Total Reviews', REVIEWS.length, '📝']].map(([label, val, icon]) => (
              <div key={label} style={{ ...GLASS, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: ORANGE }}>{val}</div>
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[['all', 'All Reviews'], ['positive', 'Positive'], ['negative', 'Needs Attention']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                style={{ padding: '8px 18px', borderRadius: 999, border: filter === val ? 'none' : '1px solid rgba(0,0,0,0.12)', background: filter === val ? ORANGE : 'transparent', color: filter === val ? '#fff' : '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Reviews */}
          <div style={{ display: 'grid', gap: 14 }}>
            {filtered.map((r, i) => {
              const overall = ((r.satisfaction + r.timeliness + r.quality) / 3).toFixed(1);
              const isLow = overall < 4;
              return (
                <div key={i} style={{ ...GLASS, border: isLow ? '1px solid rgba(220,38,38,0.2)' : '1px solid rgba(0,0,0,0.08)', background: isLow ? 'rgba(254,242,242,0.85)' : 'rgba(255,255,255,0.78)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: isLow ? 'rgba(220,38,38,0.1)' : 'rgba(255,112,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{r.avatar}</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>{r.client}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{r.session} · {r.date}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: isLow ? '#DC2626' : '#16A34A' }}>{overall}/5</div>
                      <div style={{ display: 'flex', gap: 6, fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
                        <span>Satisfaction: {r.satisfaction}</span>
                        <span>·</span>
                        <span>Timeliness: {r.timeliness}</span>
                        <span>·</span>
                        <span>Quality: {r.quality}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: isLow ? '#7F1D1D' : '#334155', lineHeight: 1.7, fontStyle: 'italic' }}>"{r.comment}"</div>
                  {isLow && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <button style={{ fontSize: 12, padding: '6px 14px', borderRadius: 999, background: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Respond to Review</button>
                      <button style={{ fontSize: 12, padding: '6px 14px', borderRadius: 999, background: 'none', border: '1px solid rgba(220,38,38,0.3)', color: '#DC2626', cursor: 'pointer', fontWeight: 700 }}>Schedule Follow-Up</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CoachingLayout>
    </>
  );
}
