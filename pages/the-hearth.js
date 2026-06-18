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

// ─── SSR-safe mobile hook ────────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth < breakpoint
  );
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

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


const HEARTH_MODULES = [
  { id: 'mentorship', label: 'Spotlights' },
  { id: 'forums', label: 'Forums' },
  { id: 'events', label: 'Events' },
  { id: 'resources', label: 'Resources' },
];

const MOBILE_PANEL = {
  ...WHITE_CARD,
  borderRadius: 16,
  boxShadow: '0 8px 20px rgba(15,23,42,0.10)',
  boxSizing: 'border-box',
};

function HearthHeroCard({ greeting }) {
  return (
    <div
      style={{
        ...GLASS,
        padding: 18,
        display: 'grid',
        gap: 10,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: '#607D8B' }}>{greeting}</div>
      <div style={{ display: 'grid', gap: 6 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            color: '#FF7043',
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            ...ORANGE_HEADING_LIFT,
          }}
        >
          The Hearth
        </h1>
        <p style={{ margin: 0, color: '#546E7A', fontSize: 14, lineHeight: 1.55 }}>
          Your central place to build connections, find mentors, and grow your professional network with purpose and authenticity.
        </p>
      </div>
      <Link
        href="/community-guidelines"
        style={{
          justifySelf: 'start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 12px',
          borderRadius: 999,
          border: '1px solid rgba(255,112,67,0.26)',
          background: 'rgba(255,255,255,0.82)',
          color: '#FF7043',
          fontSize: 12,
          fontWeight: 900,
          textDecoration: 'none',
          boxShadow: '0 3px 10px rgba(15,23,42,0.08)',
        }}
      >
        Community Guidelines →
      </Link>
    </div>
  );
}

function HearthMobileModuleNav({ activeModule, setActiveModule }) {
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  return (
    <div
      style={{
        ...MOBILE_PANEL,
        padding: 8,
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      {HEARTH_MODULES.map((item) => {
        const active = activeModule === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveModule(item.id)}
            style={{
              flexShrink: 0,
              padding: '8px 12px',
              borderRadius: 999,
              border: active ? '1px solid rgba(255,112,67,0.34)' : '1px solid rgba(15,23,42,0.08)',
              background: active ? 'linear-gradient(135deg, #FF7043, #FF8A65)' : 'rgba(255,255,255,0.78)',
              color: active ? 'white' : '#37474F',
              fontSize: 12,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: active ? '0 5px 14px rgba(255,112,67,0.22)' : 'none',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function MobileSpotlightSearchSheet({ open, onClose, value, onChange }) {
  const inputRef = React.useRef(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 80,
          background: 'rgba(10,12,18,0.50)',
          backdropFilter: 'blur(4px)',
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 90,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          background: 'rgba(255,255,255,0.98)',
          boxShadow: '0 -24px 70px rgba(15,23,42,0.28)',
          border: '1px solid rgba(255,255,255,0.54)',
          padding: '14px 16px calc(18px + env(safe-area-inset-bottom))',
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ justifySelf: 'center', width: 42, height: 4, borderRadius: 999, background: 'rgba(15,23,42,0.16)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#263238' }}>Search Spotlights</div>
            <div style={{ fontSize: 12, color: '#607D8B', marginTop: 2 }}>Search mentors, specialties, industries, or keywords.</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: '1px solid rgba(15,23,42,0.10)',
              background: 'white',
              color: '#607D8B',
              fontWeight: 900,
              cursor: 'pointer',
            }}
            aria-label="Close search"
          >
            ✕
          </button>
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by name, skill, focus, or topic..."
          style={{
            width: '100%',
            boxSizing: 'border-box',
            borderRadius: 14,
            border: '1px solid rgba(15,23,42,0.12)',
            background: 'rgba(248,250,252,0.96)',
            padding: '13px 14px',
            fontSize: 16,
            color: '#263238',
            outline: 'none',
          }}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              justifySelf: 'start',
              border: 'none',
              background: 'transparent',
              color: '#FF7043',
              fontSize: 12,
              fontWeight: 900,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Clear search
          </button>
        ) : null}
      </div>
    </>
  );
}

function HearthModuleShell({ title, subtitle, children, onBack, coachAction = null, activeModule, setActiveModule }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <section style={{ display: 'grid', gap: 12 }}>
        <HearthMobileModuleNav activeModule={activeModule} setActiveModule={setActiveModule} />
        {coachAction ? (
          <div
            style={{
              ...MOBILE_PANEL,
              padding: 12,
              display: 'grid',
              gap: 8,
            }}
          >
            {coachAction}
          </div>
        ) : null}
        {children}
      </section>
    );
  }

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
  const isMobile = useIsMobile();
  const [spotlights, setSpotlights] = useState([]);
  const [selected, setSelected]     = useState(null);
  const [filters, setFilters]       = useState(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState('');
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
    const term = ((isMobile ? mobileSearch : filters?.q) || '').trim().toLowerCase();
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
  }, [spotlights, filters, isMobile, mobileSearch]);

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
    <div style={{ display: 'grid', gap: isMobile ? 10 : 14 }}>
      {isMobile ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              style={{
                flex: 1,
                minWidth: 0,
                textAlign: 'left',
                padding: '11px 13px',
                borderRadius: 14,
                border: '1px solid rgba(15,23,42,0.10)',
                background: 'rgba(255,255,255,0.92)',
                color: mobileSearch ? '#263238' : '#90A4AE',
                fontSize: 13,
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                cursor: 'pointer',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {mobileSearch ? `Search: ${mobileSearch}` : '🔍 Search Spotlights'}
            </button>
            {mobileSearch ? (
              <button
                type="button"
                onClick={() => setMobileSearch('')}
                style={{
                  flexShrink: 0,
                  border: '1px solid rgba(255,112,67,0.22)',
                  background: 'rgba(255,255,255,0.88)',
                  color: '#FF7043',
                  borderRadius: 999,
                  padding: '9px 11px',
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            ) : null}
          </div>
          <MobileSpotlightSearchSheet
            open={mobileSearchOpen}
            onClose={() => setMobileSearchOpen(false)}
            value={mobileSearch}
            onChange={setMobileSearch}
          />
        </>
      ) : (
        <SpotlightFilters onChange={setFilters} />
      )}

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
            gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1.8fr) minmax(0,1.5fr)',
            gap: isMobile ? 10 : 14, alignItems: 'flex-start',
          }}>
            <div style={{
              maxHeight: isMobile ? 'none' : '60vh', overflowY: isMobile ? 'visible' : 'auto',
              display: 'flex', flexDirection: 'column', gap: 10, paddingRight: isMobile ? 0 : 4,
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
            <div style={{ position: isMobile ? 'static' : 'sticky', top: 0 }}>
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
  const threads = [
    {
      id: 1,
      title: 'How do I explain a career pivot without sounding scattered?',
      author: 'Forge Member',
      channel: 'Career Pivots',
      replies: 18,
      views: 126,
      age: '2h',
    },
    {
      id: 2,
      title: 'What makes a recruiter actually respond to a message?',
      author: 'Community Question',
      channel: 'Networking',
      replies: 9,
      views: 84,
      age: '5h',
    },
    {
      id: 3,
      title: 'Resume feedback: operations leader moving toward customer success',
      author: 'Peer Review',
      channel: 'Resume Help',
      replies: 23,
      views: 210,
      age: '1d',
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <section style={{ ...MOBILE_PANEL, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: '#FF7043', marginBottom: 5 }}>
          Discussion Forums Preview
        </div>
        <p style={{ color: '#607D8B', margin: 0, lineHeight: 1.55, fontSize: 13 }}>
          A Forge-style discussion space is coming soon: topic-based threads, healthy moderation, and useful peer support without noise.
        </p>
      </section>

      <section style={{ ...MOBILE_PANEL, padding: 0, overflow: 'hidden' }}>
        {threads.map((thread, index) => (
          <button
            key={thread.id}
            type="button"
            onClick={() => alert('Forums are coming soon.')}
            style={{
              width: '100%',
              border: 'none',
              borderBottom: index < threads.length - 1 ? '1px solid rgba(15,23,42,0.08)' : 'none',
              background: 'rgba(255,255,255,0.78)',
              padding: '13px 14px',
              textAlign: 'left',
              display: 'grid',
              gap: 7,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#FF7043' }}>{thread.channel}</span>
              <span style={{ color: '#B0BEC5', fontSize: 11 }}>•</span>
              <span style={{ fontSize: 11, color: '#78909C', fontWeight: 800 }}>{thread.age}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#263238', lineHeight: 1.32 }}>
              {thread.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12, color: '#607D8B', fontWeight: 700 }}>
              <span>{thread.author}</span>
              <span>•</span>
              <span>{thread.replies} replies</span>
              <span>•</span>
              <span>{thread.views} views</span>
            </div>
          </button>
        ))}
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
  useEffect(() => {
  const mod = router.query.module;
  if (mod === 'mentorship' || mod === 'events' || mod === 'forums' || mod === 'resources') {
    setActiveModule(mod);
  }
}, [router.isReady, router.query.module]);

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
          activeModule={activeModule}
          setActiveModule={setActiveModule}
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
          activeModule={activeModule}
          setActiveModule={setActiveModule}
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
          activeModule={activeModule}
          setActiveModule={setActiveModule}
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
          activeModule={activeModule}
          setActiveModule={setActiveModule}
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
      header={<HearthHeroCard greeting={greeting} />}
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