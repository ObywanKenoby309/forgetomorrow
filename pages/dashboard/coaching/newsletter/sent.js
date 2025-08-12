// pages/dashboard/coaching/newsletter/sent.js
import React, { useEffect, useState } from 'react';
import CoachingSidebar from '../../../../components/coaching/CoachingSidebar';

const STORAGE_KEY = 'coachNewsletters_v1';

export default function CoachingNewsletterSentPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setItems(existing);
    } catch {
      setItems([]);
    }
  }, []);

  const fmt = (iso) => new Date(iso).toLocaleString();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '20px',
        padding: '120px 20px 20px',
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      }}
    >
      <CoachingSidebar active="resources" />

      <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ maxWidth: 860 }}>
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: '#FF7043', margin: 0 }}>Sent Newsletters</h2>
              <a href="/dashboard/coaching/newsletter" style={{ color: '#FF7043', fontWeight: 700 }}>
                + Compose New
              </a>
            </div>
          </section>

          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
            }}
          >
            {items.length === 0 && (
              <div style={{ color: '#90A4AE' }}>No newsletters sent yet.</div>
            )}

            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((n) => (
                <div
                  key={n.id}
                  style={{
                    background: '#FAFAFA',
                    border: '1px solid #eee',
                    borderRadius: 10,
                    padding: 12,
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 800 }}>{n.subject}</div>
                    <div style={{ fontSize: 12, color: '#607D8B' }}>{fmt(n.createdAt)}</div>
                  </div>
                  <div style={{ color: '#455A64', whiteSpace: 'pre-wrap' }}>{n.body}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#607D8B' }}>
                    <span><strong>Delivered:</strong> {n.stats?.delivered ?? 0}</span>
                    <span><strong>Read:</strong> {n.stats?.read ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
