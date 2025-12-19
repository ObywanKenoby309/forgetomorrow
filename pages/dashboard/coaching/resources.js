import React from 'react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';

// 🔹 NEW: dynamic spotlight card (logic lives here, not in this page)
import SpotlightResourceCard from '@/components/spotlight/SpotlightResourceCard';

export default function CoachingResourcesPage() {
  // --- No fake recent data at launch ---
  const recent = [];

  const card = (href, title, desc) => (
    <div
      onClick={() => (window.location.href = href)}
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
    </div>
  );

  return (
    <CoachingLayout
      title="Docs & Tools | ForgeTomorrow"
      activeNav="resources"
      headerDescription="Templates, guides, announcements, and quick links for coaches."
      right={<CoachingRightColumn />}
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      {/* Center column content */}
      <div style={{ display: 'grid', gap: 16, width: '100%' }}>
        {/* Top cards */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            border: '1px solid #eee',
          }}
        >
          <h2
            style={{
              color: '#FF7043',
              marginTop: 0,
              marginBottom: 12,
              fontWeight: 'bold',
            }}
          >
            Docs & Tools
          </h2>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {card(
              '#templates',
              'Templates',
              'Standard documents for repeatable coaching workflows.'
            )}
            {card(
              '#library',
              'Resource Library',
              'Guides, checklists, and curated materials.'
            )}
            {card(
              '#announcements',
              'Announcements',
              'What’s new and important this week.'
            )}
            {card(
              '/dashboard/coaching/newsletter',
              'Newsletter',
              'Compose and send a broadcast message to clients.'
            )}

            {/* 🔹 Spotlight card is now dynamic */}
            <SpotlightResourceCard />
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
          <h2
            style={{
              color: '#FF7043',
              marginTop: 0,
              marginBottom: 12,
            }}
          >
            Recently Added
          </h2>

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
                {recent.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: 16,
                        color: '#90A4AE',
                        textAlign: 'center',
                      }}
                    >
                      No resources have been added yet. When you publish templates
                      or guides, they will appear here.
                    </td>
                  </tr>
                ) : (
                  recent.map((r) => (
                    <tr key={r.title} style={{ borderTop: '1px solid #eee' }}>
                      <Td strong>{r.title}</Td>
                      <Td>{r.type}</Td>
                      <Td>{r.owner}</Td>
                      <Td>{r.updated}</Td>
                      <Td>
                        <span
                          onClick={() => (window.location.href = r.link)}
                          style={{
                            color: '#FF7043',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          View
                        </span>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Simple note */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            border: '1px solid #eee',
          }}
        >
          <h3 style={{ color: '#FF7043', marginTop: 0 }}>Coming Soon</h3>
          <p style={{ color: '#607D8B', marginTop: 0 }}>
            As we roll out more coaching materials, shared assets and key links will be
            listed here for quick access.
          </p>
        </section>
      </div>
    </CoachingLayout>
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
