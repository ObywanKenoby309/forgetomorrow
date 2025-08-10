// pages/dashboard/coaching.js
import React from 'react';
import Link from 'next/link';

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
      <aside
        style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          border: '1px solid #eee',
        }}
      >
        <div style={{ fontWeight: 700, color: '#FF7043', fontSize: 18, marginBottom: 6 }}>
          Coaching
        </div>
        <NavItem href="/dashboard/coaching" label="Overview" active />
        <NavItem href="/dashboard/coaching/clients" label="Clients" />
        <NavItem href="/dashboard/coaching/sessions" label="Sessions" />
        <NavItem href="/dashboard/coaching/resources" label="Resources" />
        <div style={{ height: 1, background: '#eee', margin: '8px 0' }} />
        <NavItem href="/applications" label="Applications Tracker" />
        <NavItem href="/resume/create" label="Resume Builder" />
      </aside>

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

function NavItem({ href, label, active = false }) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: '10px 12px',
        borderRadius: 8,
        textDecoration: 'none',
        color: active ? '#FF7043' : '#455A64',
        background: active ? 'rgba(255,112,67,0.08)' : 'transparent',
        fontWeight: active ? 700 : 500,
        border: active ? '1px solid rgba(255,112,67,0.25)' : '1px solid transparent',
      }}
    >
      {label}
    </Link>
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
