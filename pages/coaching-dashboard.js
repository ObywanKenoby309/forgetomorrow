// pages/coaching-dashboard.js
import React from 'react';
import CoachingSidebar from '../components/coaching/CoachingSidebar';

export default function CoachingDashboardPage() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: 20,
        minHeight: '100vh',
        background: '#ECEFF1',
        padding: '100px 20px 20px',
      }}
    >
      <CoachingSidebar active="overview" />

      <main style={{ display: 'grid', gap: 20 }}>
        <Section title="Today">
          <div style={grid3}>
            <Card title="Upcoming Sessions" />
            <Card title="New Client Intakes" />
            <Card title="Follow-ups Due" />
          </div>
        </Section>

        <Section title="Clients">
          <div style={grid3}>
            <Card title="Active Clients" />
            <Card title="At-Risk Clients" />
            <Card title="Conversion Pipeline" />
          </div>
        </Section>

        <Section title="Docs & Tools">
          <div style={grid3}>
            <Card title="Templates & Guides" />
            <Card title="Resource Library" />
            <Card title="Announcements" />
          </div>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #eee',
          color: '#FF7043',
          fontWeight: 700,
        }}
      >
        {title}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </section>
  );
}

function Card({ title, children }) {
  return (
    <div
      style={{
        background: '#FAFAFA',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 16,
        minHeight: 120,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
      {children || <div style={{ color: '#90A4AE' }}>Coming soon…</div>}
    </div>
  );
}

const grid3 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
};
