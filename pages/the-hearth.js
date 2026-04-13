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
import { SpotlightCard, SpotlightDetail } from '@/components/spotlights/SpotlightCardUI';
import SpotlightResourceCard from '@/components/spotlights/SpotlightResourceCard';

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

function HearthModuleShell({ title, subtitle, children, onBack, coachAction = null }) {
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: coachAction ? 'minmax(0,1fr) 280px' : '1fr',
          gap: 16,
          alignItems: 'start',
        }}
      >
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

        {coachAction ? (
          <div style={{ minWidth: 0 }}>
            {coachAction}
          </div>
        ) : null}
      </div>

      {children}
    </section>
  );
}

// ─── Mentorship Module — uses shared SpotlightCard + SpotlightDetail ────────
function MentorshipModule() {
  const [spotlights, setSpotlights] = useState([]);
  const [selected, setSelected]     = useState(null);
  const [filters, setFilters]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true); setError('');
      try {
        const res = await fetch('/api/hearth/spotlights');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        const list =
          (Array.isArray(data?.spotlights) && data.spotlights) ||
          (Array.isArray(data?.items)      && data.items)      ||
          (Array.isArray(data)             && data)            ||
          [];
        if (!mounted) return;
        const normalized = list.map(a => ({
          id:           a.id,
          userId:       a.userId       || '',
          userSlug:     a.userSlug     || null,
          userAvatarUrl: a.userAvatarUrl || '',
          name:         a.name         || '',
          headline:     a.headline     || '',
          hook:         a.hook         || null,
          summary:      a.summary      || '',
          whyICoach:    a.whyICoach    || null,
          specialties:  Array.isArray(a.specialties) ? a.specialties : [],
          rate:         a.rate         || '',
          availability: a.availability || '',
          contactEmail: a.contactEmail || '',
          contactLink:  a.contactLink  || '',
          createdAt:    a.createdAt    || null,
          csat:         a.csat         || { sessions: 0, overall: null, satisfaction: null, timeliness: null, quality: null },
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

  const filtered = useMemo(() => {
    let arr = [...spotlights];
    if (!filters) return arr;
    const term = (filters.q || '').trim().toLowerCase();
    if (term) {
      arr = arr.filter(a =>
        [a.name, a.headline, a.hook || '', a.summary, (a.specialties || []).join(' ')]
          .join(' ').toLowerCase().includes(term)
      );
    }
    if (filters.specialties?.length) {
      arr = arr.filter(a => (a.specialties || []).some(s => filters.specialties.includes(s)));
    }
    if (filters.availability && filters.availability !== 'Any') {
      arr = arr.filter(a => a.availability === filters.availability);
    }
    if (filters.rate?.length) {
      arr = arr.filter(a => filters.rate.includes(a.rate));
    }
    if (filters.csatMin && filters.csatMin !== 'Any') {
      const min = parseFloat(filters.csatMin);
      arr = arr.filter(a => a.csat?.overall != null && a.csat.overall >= min);
    }
    if (filters.sort === 'Name A\u2013Z') {
      arr.sort((x, y) => (x.name || '').localeCompare(y.name || ''));
    } else if (filters.sort === 'Highest rated') {
      arr.sort((x, y) => (y.csat?.overall || 0) - (x.csat?.overall || 0));
    } else if (filters.sort === 'Most sessions') {
      arr.sort((x, y) => (y.csat?.sessions || 0) - (x.csat?.sessions || 0));
    } else {
      arr.sort((x, y) => {
        const ax = x.createdAt ? new Date(x.createdAt).getTime() : 0;
        const ay = y.createdAt ? new Date(y.createdAt).getTime() : 0;
        return ay - ax;
      });
    }
    return arr;
  }, [spotlights, filters]);

  // Keep selected in sync after filter changes
  useEffect(() => {
    if (filtered.length > 0 && !filtered.find(s => s.id === selected?.id)) {
      setSelected(filtered[0]);
    }
  }, [filtered, selected]);

  if (loading) return <div style={{ color: '#90A4AE', fontSize: 13, padding: 8 }}>Loading mentors…</div>;
  if (error)   return <div style={{ ...WHITE_CARD, padding: 16, color: '#C62828', fontSize: 13 }}>{error}</div>;

  if (spotlights.length === 0) {
    return (
      <div style={{ ...WHITE_CARD, padding: 24, textAlign: 'center' }}>
        <div style={{ fontWeight: 800, color: '#37474F', marginBottom: 6 }}>No mentors in the Hearth Spotlight yet</div>
        <p style={{ color: '#607D8B', margin: 0, lineHeight: 1.6, fontSize: 13 }}>
          As coaches and mentors opt in, they'll appear here. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <SpotlightFilters onChange={setFilters} />

      {filtered.length === 0 ? (
        <div style={{ ...WHITE_CARD, padding: 14, color: '#90A4AE', fontSize: 13 }}>
          No mentors match your filters.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: '#90A4AE' }}>
            {filtered.length} {filtered.length === 1 ? 'mentor' : 'mentors'} available
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.8fr) minmax(0,1.5fr)',
            gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{
              maxHeight: '60vh', overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4,
            }}>
              {filtered.map(s => (
                <SpotlightCard
                  key={s.id}
                  spotlight={s}
                  selected={selected?.id === s.id}
                  onSelect={setSelected}
                />
              ))}
            </div>
            <div style={{ position: 'sticky', top: 0 }}>
              {selected
                ? <SpotlightDetail spotlight={selected} />
                : <div style={{ ...WHITE_CARD, padding: 16, color: '#90A4AE', fontSize: 13 }}>Select a mentor to view details.</div>
              }
            </div>
          </div>
        </>
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
          coachAction={chromeRaw === 'coach' ? <SpotlightResourceCard /> : null}
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