// pages/the-hearth.js
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import HearthCenter from '@/components/community/HearthCenter';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import Link from 'next/link';
import SupportFloatingButton from '@/components/SupportFloatingButton';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import { getTimeGreeting } from '@/lib/dashboardGreeting';
import SpotlightFilters from '@/components/spotlights/SpotlightFilters';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const WHITE_CARD = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
};

const ORANGE_HEADING_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};

function HearthModuleShell({ title, subtitle, children, onBack }) {
  return (
    <section style={{ ...GLASS, padding: 24, display: 'grid', gap: 16 }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: 4, fontSize: '0.875rem', color: '#FF7043',
          textDecoration: 'underline', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', width: 'fit-content',
          fontWeight: 800, padding: 0,
        }}
      >
        ← Return to Main
      </button>
      <div style={{ display: 'grid', gap: 8 }}>
        <h2 style={{
          margin: 0, fontSize: 22, color: '#FF7043',
          lineHeight: 1.2, letterSpacing: '-0.01em', ...ORANGE_HEADING_LIFT,
        }}>
          {title}
        </h2>
        <p style={{ margin: 0, color: '#546E7A', fontSize: 15, lineHeight: 1.6 }}>
          {subtitle}
        </p>
      </div>
      {children}
    </section>
  );
}

// ─── Mentorship Module — full SpotlightFilters + list/detail inline ──────────
function MentorshipModule() {
  const [spotlights, setSpotlights] = useState([]);
  const [selected, setSelected]     = useState(null);
  const [filters, setFilters]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/hearth/spotlights');
        if (!res.ok) throw new Error('Failed to load spotlights');
        const data = await res.json();
        const list =
          (Array.isArray(data?.spotlights) && data.spotlights) ||
          (Array.isArray(data?.items)      && data.items)      ||
          (Array.isArray(data)             && data)            ||
          [];
        if (!mounted) return;
        const normalized = list.map((a) => ({
          id:           a.id,
          name:         a.name         || '',
          headline:     a.headline     || '',
          summary:      a.summary      || '',
          specialties:  Array.isArray(a.specialties) ? a.specialties : [],
          rate:         a.rate         || '',
          availability: a.availability || '',
          contactEmail: a.contactEmail || '',
          contactLink:  a.contactLink  || '',
          createdAt:    a.createdAt    || null,
        }));
        setSpotlights(normalized);
        if (normalized.length > 0) setSelected(normalized[0]);
      } catch (e) {
        if (mounted) setError('Unable to load mentors right now. Please try again shortly.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Mirror the exact filter logic from /hearth/spotlights/index.js
  const filtered = useMemo(() => {
    let arr = [...spotlights];
    if (!filters) return arr;
    const term = (filters.q || '').trim().toLowerCase();
    if (term) {
      arr = arr.filter((a) =>
        [a.name, a.headline, a.summary, (a.specialties || []).join(' ')]
          .join(' ').toLowerCase().includes(term)
      );
    }
    if (filters.specialties?.length) {
      arr = arr.filter((a) =>
        (a.specialties || []).some((s) => filters.specialties.includes(s))
      );
    }
    if (filters.availability && filters.availability !== 'Any') {
      arr = arr.filter((a) => (a.availability || '') === filters.availability);
    }
    if (filters.rate?.length) {
      arr = arr.filter((a) => filters.rate.includes(a.rate));
    }
    if (filters.sort === 'Name A–Z') {
      arr.sort((x, y) => (x.name || '').localeCompare(y.name || ''));
    } else if (filters.sort === 'Newest') {
      arr.sort((x, y) => {
        const ax = x.createdAt ? new Date(x.createdAt).getTime() : 0;
        const by = y.createdAt ? new Date(y.createdAt).getTime() : 0;
        return by - ax;
      });
    }
    return arr;
  }, [spotlights, filters]);

  if (loading) {
    return (
      <div style={{ color: '#90A4AE', fontSize: 13, padding: 8 }}>Loading mentors…</div>
    );
  }

  if (error) {
    return (
      <div style={{ ...WHITE_CARD, padding: 16, color: '#C62828', fontSize: 13 }}>{error}</div>
    );
  }

  if (spotlights.length === 0) {
    return (
      <div style={{ ...WHITE_CARD, padding: 24, textAlign: 'center' }}>
        <div style={{ fontWeight: 800, color: '#37474F', marginBottom: 6 }}>
          No mentors in the Hearth Spotlight yet
        </div>
        <p style={{ color: '#607D8B', margin: 0, lineHeight: 1.6, fontSize: 13 }}>
          As coaches and mentors opt in, they'll appear here. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Full filter bar — identical to standalone spotlights page */}
      <SpotlightFilters onChange={setFilters} />

      {filtered.length === 0 ? (
        <div style={{ ...WHITE_CARD, padding: 16, color: '#90A4AE', fontSize: 13 }}>
          No mentors match your filters.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.5fr)',
          gap: 16,
          alignItems: 'flex-start',
        }}>
          {/* Scrollable list */}
          <div style={{
            maxHeight: '60vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            paddingRight: 4,
          }}>
            {filtered.map((a) => {
              const isSelected = selected?.id === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => setSelected(a)}
                  style={{
                    ...WHITE_CARD,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    border: isSelected
                      ? '2px solid #FF7043'
                      : '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#263238', fontSize: 14 }}>
                    {a.headline || 'Mentor'}
                  </div>
                  <div style={{ color: '#607D8B', fontSize: 12, marginTop: 2 }}>
                    {a.name}
                  </div>
                  {a.summary && (
                    <div style={{ color: '#455A64', fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
                      {a.summary.length > 120 ? `${a.summary.slice(0, 120)}…` : a.summary}
                    </div>
                  )}
                  {a.specialties?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {a.specialties.slice(0, 3).map((s) => (
                        <span key={s} style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 20,
                          background: '#FAECE7', color: '#993C1D', fontWeight: 600,
                        }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sticky detail panel */}
          <div style={{
            ...WHITE_CARD,
            padding: '18px 20px',
            position: 'sticky',
            top: 0,
            maxHeight: '60vh',
            overflowY: 'auto',
          }}>
            {selected ? (
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <div style={{ fontWeight: 900, color: '#263238', fontSize: 17, lineHeight: 1.2 }}>
                    {selected.headline || 'Mentor'}
                  </div>
                  <div style={{ color: '#607D8B', fontSize: 13, marginTop: 3 }}>
                    {selected.name}
                  </div>
                </div>

                {selected.summary && (
                  <p style={{ margin: 0, color: '#455A64', fontSize: 13, lineHeight: 1.65 }}>
                    {selected.summary}
                  </p>
                )}

                {selected.specialties?.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: '#90A4AE',
                      textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8,
                    }}>
                      Specialties
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
                      {selected.specialties.map((s) => (
                        <li key={s} style={{ fontSize: 13, color: '#37474F' }}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: 'grid', gap: 6 }}>
                  {selected.rate && (
                    <div style={{ fontSize: 13 }}>
                      <span style={{ fontWeight: 700, color: '#546E7A' }}>Rate: </span>
                      <span style={{ color: '#455A64' }}>{selected.rate}</span>
                    </div>
                  )}
                  {selected.availability && (
                    <div style={{ fontSize: 13 }}>
                      <span style={{ fontWeight: 700, color: '#546E7A' }}>Availability: </span>
                      <span style={{ color: '#455A64' }}>{selected.availability}</span>
                    </div>
                  )}
                </div>

                {(selected.contactEmail || selected.contactLink) && (
                  <div style={{
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    paddingTop: 12, display: 'grid', gap: 8,
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: '#90A4AE',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      Contact
                    </div>
                    {selected.contactEmail && (
                      <div style={{ fontSize: 13, color: '#455A64' }}>
                        {selected.contactEmail}
                      </div>
                    )}
                    {selected.contactLink && (
                      <a
                        href={selected.contactLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block', padding: '8px 14px', borderRadius: 10,
                          border: '1px solid #FF7043', color: '#FF7043', fontWeight: 700,
                          textDecoration: 'none', background: 'white', fontSize: 13,
                          width: 'fit-content',
                        }}
                      >
                        Open contact link
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#90A4AE', fontSize: 13 }}>
                Select a mentor to view details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EventsModule() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <section style={{ ...WHITE_CARD, padding: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#37474F', marginBottom: 6 }}>
          Event calendar not enabled yet
        </div>
        <p style={{ color: '#607D8B', marginTop: 4, lineHeight: 1.6 }}>
          Live resume clinics, recruiter AMAs, and networking sessions will appear here once we finish
          setting up scheduling and moderation.
        </p>
        <p style={{ color: '#607D8B', marginTop: 8, lineHeight: 1.6 }}>
          For now, you can keep an eye on this space to see when events are live for the community.
        </p>
      </section>
    </div>
  );
}

function ForumsModule() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <section style={{ ...WHITE_CARD, padding: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#37474F', marginBottom: 6 }}>
          Forums not enabled yet
        </div>
        <p style={{ color: '#607D8B', marginTop: 4, lineHeight: 1.6 }}>
          We're finishing moderation tools, spam protection, and reporting workflows so that conversations
          here stay healthy and constructive.
        </p>
        <p style={{ color: '#607D8B', marginTop: 8, lineHeight: 1.6 }}>
          Once everything is ready, this space will open for topic-based threads, replies, and community
          reputation.
        </p>
      </section>
    </div>
  );
}

function ResourcesModule() {
  const sectionCards = [
    {
      title: 'ForgeTomorrow Platform Tutorials',
      blurb: 'Learn how to use the ForgeTomorrow tools themselves: the resume builder, SmartNetworking, and negotiation support—so the platform works like a co-pilot in your job search.',
    },
    {
      title: 'Job Search Foundations',
      blurb: "Start here if you're restarting your search or feel stuck. Learn how to structure your week, tap into the hidden job market, and avoid burnout while moving forward.",
    },
    {
      title: 'Resumes & Cover Letters',
      blurb: 'Turn your experience into a high-conversion resume and modern cover letters. Learn the 6-second scan rule, Issue–Action–Outcome bullets, ATS reality, and reusable templates.',
    },
    {
      title: 'Interviews & Preparation',
      blurb: 'Get ready fast and show up confident. Use prep checklists, STAR story banks, strong questions to ask, and a simple structure for "Tell me about yourself."',
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <section style={{ ...WHITE_CARD, padding: 18 }}>
        <p style={{ color: '#607D8B', margin: 0, lineHeight: 1.6 }}>
          Browse core learning sections now. Articles and guides today; paid certs and courses later,
          once we finish moderation and curation workflows.
        </p>
      </section>
      <div style={{ display: 'grid', gap: 12 }}>
        {sectionCards.map((card) => (
          <section key={card.title} style={{ ...WHITE_CARD, padding: 16 }}>
            <div style={{ fontWeight: 800, color: '#263238', marginBottom: 6 }}>{card.title}</div>
            <p style={{ color: '#455A64', margin: 0, lineHeight: 1.55 }}>{card.blurb}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function TheHearth() {
  const router = useRouter();
  const chromeRaw = String(router.query.chrome || 'seeker').toLowerCase();

  const [activeModule, setActiveModule] = useState(null);

  let Layout = SeekerLayout;
  let activeNav = 'the-hearth';

  if (chromeRaw === 'coach') {
    Layout = CoachingLayout;
    activeNav = 'hearth';
  } else if (chromeRaw === 'recruiter-smb' || chromeRaw === 'recruiter-ent') {
    Layout = RecruiterLayout;
    activeNav = 'hearth';
  }

  const greeting = getTimeGreeting();

  const renderModule = () => {
    if (activeModule === 'mentorship') {
      return (
        <HearthModuleShell
          title="Mentorship Programs"
          subtitle="Discover mentors by specialty, experience, and availability."
          onBack={() => setActiveModule(null)}
        >
          <MentorshipModule />
        </HearthModuleShell>
      );
    }

    if (activeModule === 'events') {
      return (
        <HearthModuleShell
          title="Community Events"
          subtitle="Workshops, webinars, and networking for professional growth."
          onBack={() => setActiveModule(null)}
        >
          <EventsModule />
        </HearthModuleShell>
      );
    }

    if (activeModule === 'forums') {
      return (
        <HearthModuleShell
          title="Discussion Forums"
          subtitle="Topic-based community conversation, moderation, and reputation."
          onBack={() => setActiveModule(null)}
        >
          <ForumsModule />
        </HearthModuleShell>
      );
    }

    if (activeModule === 'resources') {
      return (
        <HearthModuleShell
          title="Resource Library"
          subtitle="Articles, guides, and learning paths to support career growth."
          onBack={() => setActiveModule(null)}
        >
          <ResourcesModule />
        </HearthModuleShell>
      );
    }

    return <HearthCenter activeModule={activeModule} setActiveModule={setActiveModule} />;
  };

  return (
    <Layout
      title="ForgeTomorrow — The Hearth"
      header={
        <SeekerTitleCard
          greeting={greeting}
          title="The Hearth"
          subtitle="Your central place to build connections, find mentors, and grow your professional network with purpose and authenticity."
        />
      }
      headerCard={false}
      activeNav={activeNav}
      rightVariant="light"
      right={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RightRailPlacementManager slot="right_rail_1" />
          <div style={{ ...GLASS, padding: 12, display: 'grid', gap: 8, boxSizing: 'border-box' }}>
            <div style={{
              fontSize: 18, color: '#FF7043',
              lineHeight: 1.25, letterSpacing: '-0.01em', ...ORANGE_HEADING_LIFT,
            }}>
              Community Guidelines
            </div>
            <Link
              href="/community-guidelines"
              style={{
                color: '#FF7043', fontWeight: 800, fontSize: 13,
                lineHeight: 1.2, textDecoration: 'none',
              }}
            >
              Read the guidelines →
            </Link>
          </div>
        </div>
      }
    >
      <>
        {renderModule()}
        <SupportFloatingButton />
      </>
    </Layout>
  );
}