// pages/dashboard/coaching/resources.js
import React from 'react';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';

export default function CoachingResourcesPage() {
  // --- Mock data ---
  const recent = [
    { title: 'Client Intake Template', type: 'Template', owner: 'Ops',      updated: 'Aug 10, 2025', link: '#templates' },
    { title: 'Resume Review Checklist', type: 'Guide',    owner: 'Coaching', updated: 'Aug 09, 2025', link: '#library' },
    { title: 'Announcement: New Scheduler', type: 'Announcement', owner: 'Product', updated: 'Aug 08, 2025', link: '#announcements' },
  ];
  // ------------------

  const CardLink = ({ href, title, desc }) => (
    <Link
      href={href}
      style={{
        display: 'block',
        background: '#F5F5F5',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 16,
        textDecoration: 'none',
        color: '#263238',
        cursor: 'pointer',
        flex: '1 1 18%',
        minWidth: 150,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ color: '#607D8B' }}>{desc}</div>
    </Link>
  );

  return (
    <CoachingLayout
      title="Resources | ForgeTomorrow"
      headerTitle="Coaching Resources"
      headerDescription="Templates, guides, announcements, and tools to streamline your coaching."
      activeNav="resources"
      right={<CoachingRightColumn />}
    >
      <div style={{ display: 'grid', gap: 16, maxWidth: 860 }}>
        {/* Top cards linking to anchors and tools */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            border: '1px solid #eee',
          }}
        >
          <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: 12, fontWeight: 'bold' }}>
            Docs & Tools
          </h2>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <CardLink href="#templates" title="Templates" desc="Standard documents for repeatable coaching workflows." />
            <CardLink href="#library" title="Resource Library" desc="Guides, checklists, and curated materials." />
            <CardLink href="#announcements" title="Announcements" desc="What’s new and important this week." />
            <CardLink href="/dashboard/coaching/newsletter" title="Newsletter" desc="Compose and send a broadcast message to clients." />
            <CardLink href="/resources/mentors/spotlight/new" title="Create a Spotlight Card" desc="Highlight a mentor with a custom spotlight." />
          </div>
        </section>

        {/* Anchored sections */}
        <Section id="templates" title="Templates">
          <p style={{ color: '#607D8B', marginTop: 0 }}>Coming soon…</p>
        </Section>

        <Section id="library" title="Resource Library">
          <p style={{ color: '#607D8B', marginTop: 0 }}>Coming soon…</p>
        </Section>

        <Section id="announcements" title="Announcements">
          <p style={{ color: '#607D8B', marginTop: 0 }}>Coming soon…</p>
        </Section>

        {/* Recently added */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            border: '1px solid #eee',
          }}
        >
          <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: 12 }}>Recently Added</h2>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                background: 'white',
                border: '1px solid #eee',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <thead>
                <tr style={{ background: '#FAFAFA' }}>
                  <Th>Title</Th>
                  <Th>Type</Th>
                  <Th>Owner</Th>
                  <Th>Updated</Th>
                  <Th>Link</Th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.title} style={{ borderTop: '1px solid #eee' }}>
                    <Td strong>{r.title}</Td>
                    <Td>{r.type}</Td>
                    <Td>{r.owner}</Td>
                    <Td>{r.updated}</Td>
                    <Td>
                      <Link href={r.link} style={{ color: '#FF7043', fontWeight: 600 }}>
                        View
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </CoachingLayout>
  );
}

/* ---------- Shared helpers (local) ---------- */
function Section({ id, title, children }) {
  return (
    <section
      id={id}
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
      }}
    >
      <div
        style={{
          marginBottom: 12,
          color: '#FF7043',
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        {title}
      </div>
      <div>{children}</div>
    </section>
  );
}

function Th({ children }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '10px 12px',
        fontSize: 13,
        color: '#546E7A',
        borderBottom: '1px solid #eee',
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, strong = false }) {
  return (
    <td
      style={{
        padding: '10px 12px',
        fontSize: 14,
        color: '#37474F',
        fontWeight: strong ? 600 : 400,
        background: 'white',
      }}
    >
      {children}
    </td>
  );
}
