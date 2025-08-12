// pages/dashboard/coaching/resources.js
import React from 'react';
import CoachingSidebar from '../../../components/coaching/CoachingSidebar';

export default function CoachingResourcesPage() {
  // --- Mock data ---
  const recent = [
    { title: 'Client Intake Template', type: 'Template', owner: 'Ops', updated: 'Aug 10, 2025', link: '#templates' },
    { title: 'Resume Review Checklist', type: 'Guide', owner: 'Coaching', updated: 'Aug 09, 2025', link: '#library' },
    { title: 'Announcement: New Scheduler', type: 'Announcement', owner: 'Product', updated: 'Aug 08, 2025', link: '#announcements' },
  ];
  // ------------------

  const card = (href, title, desc) => (
    <a
      href={href}
      style={{
        display: 'block',
        background: '#FAFAFA',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 16,
        textDecoration: 'none',
        color: '#263238',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ color: '#607D8B' }}>{desc}</div>
    </a>
  );

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
          {/* Top cards linking to anchors */}
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
            }}
          >
            <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: 12 }}>Docs & Tools</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              {card('#templates', 'Templates', 'Standard documents for repeatable coaching workflows.')}
              {card('#library', 'Resource Library', 'Guides, checklists, and curated materials.')}
              {card('#announcements', 'Announcements', 'What’s new and important this week.')}
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
                        <a href={r.link} style={{ color: '#FF7043', fontWeight: 600 }}>
                          View
                        </a>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

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
