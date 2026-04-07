// pages/the-hearth.js
import React, { useState } from 'react';
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
    <section
      style={{
        ...GLASS,
        padding: 24,
        display: 'grid',
        gap: 16,
      }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: 4,
          fontSize: '0.875rem',
          color: '#FF7043',
          textDecoration: 'underline',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          width: 'fit-content',
          fontWeight: 800,
          padding: 0,
        }}
      >
        ← Return to Main
      </button>

      <div style={{ display: 'grid', gap: 8 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            color: '#FF7043',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            ...ORANGE_HEADING_LIFT,
          }}
        >
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

function MentorshipModule() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <section style={{ ...WHITE_CARD, padding: 18 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#37474F',
            marginBottom: 6,
          }}
        >
          Mentorship programs are not live yet
        </div>
        <p style={{ color: '#607D8B', marginTop: 4, lineHeight: 1.6 }}>
          This space will host verified mentors and structured mentoring programs across roles,
          industries, and regions. You’ll be able to filter by specialty, availability, and style of support.
        </p>
        <p style={{ color: '#607D8B', marginTop: 8, lineHeight: 1.6 }}>
          If you’re interested in mentoring when this launches, please contact our support team using the
          orange support button in the lower-right corner.
        </p>
      </section>
    </div>
  );
}

function EventsModule() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <section style={{ ...WHITE_CARD, padding: 18 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#37474F',
            marginBottom: 6,
          }}
        >
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
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#37474F',
            marginBottom: 6,
          }}
        >
          Forums not enabled yet
        </div>

        <p style={{ color: '#607D8B', marginTop: 4, lineHeight: 1.6 }}>
          We’re finishing moderation tools, spam protection, and reporting workflows so that conversations
          here stay healthy and constructive.
        </p>

        <p style={{ color: '#607D8B', marginTop: 8, lineHeight: 1.6 }}>
          Once everything is ready, this space will open for topic-based threads, replies, and community
          reputation. For now, you can navigate here to see that the Forums area is in place and under review.
        </p>
      </section>
    </div>
  );
}

function ResourcesModule() {
  const sectionCards = [
    {
      title: 'ForgeTomorrow Platform Tutorials',
      blurb:
        'Learn how to use the ForgeTomorrow tools themselves: the resume builder, SmartNetworking, and negotiation support—so the platform works like a co-pilot in your job search.',
    },
    {
      title: 'Job Search Foundations',
      blurb:
        'Start here if you’re restarting your search or feel stuck. Learn how to structure your week, tap into the hidden job market, and avoid burnout while moving forward.',
    },
    {
      title: 'Resumes & Cover Letters',
      blurb:
        'Turn your experience into a high-conversion resume and modern cover letters. Learn the 6-second scan rule, Issue–Action–Outcome bullets, ATS reality, and reusable templates.',
    },
    {
      title: 'Interviews & Preparation',
      blurb:
        'Get ready fast and show up confident. Use prep checklists, STAR story banks, strong questions to ask, and a simple structure for “Tell me about yourself.”',
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
            <div style={{ fontWeight: 800, color: '#263238', marginBottom: 6 }}>
              {card.title}
            </div>
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
            <div
              style={{
                fontSize: 18,
                color: '#FF7043',
                lineHeight: 1.25,
                letterSpacing: '-0.01em',
                ...ORANGE_HEADING_LIFT,
              }}
            >
              Community Guidelines
            </div>
            <Link
              href="/community-guidelines"
              style={{
                color: '#FF7043',
                fontWeight: 800,
                fontSize: 13,
                lineHeight: 1.2,
                textDecoration: 'none',
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