// pages/seeker/the-hearth/resources.js
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import { SECTION_DETAILS } from '@/lib/resourceSections';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

function makeLayout(chromeRaw) {
  let Layout = SeekerLayout;
  let activeNav = 'the-hearth';

  if (chromeRaw === 'coach') {
    Layout = CoachingLayout;
    activeNav = 'hearth';
  } else if (chromeRaw === 'recruiter-smb' || chromeRaw === 'recruiter-ent') {
    Layout = RecruiterLayout;
    activeNav = 'hearth';
  }

  return { Layout, activeNav };
}

const Header = (
  <section
    style={{
      background: 'white',
      border: '1px solid #eee',
      borderRadius: 12,
      padding: 16,
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      textAlign: 'center',
    }}
  >
    <h1
      style={{
        margin: 0,
        color: '#FF7043',
        fontSize: 24,
        fontWeight: 800,
      }}
    >
      Resource Library
    </h1>
    <p
      style={{
        margin: '6px auto 0',
        color: '#607D8B',
        maxWidth: 720,
      }}
    >
      Browse core learning sections now. Articles and guides today; paid certs and
      courses later, once we finish moderation and curation workflows.
    </p>
  </section>
);

// Left-side card metadata (titles + blurbs only)
const SECTION_CARDS = [
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
  {
    title: 'Negotiation & Compensation',
    blurb:
      'Research your market value, anchor your range, and negotiate with confidence. Includes counteroffer scripts, benefits phrasing, and how to respond to fixed-budget offers.',
  },
  {
    title: 'Networking & Personal Branding',
    blurb:
      'Network without feeling awkward and build a simple, consistent professional brand in 10 minutes a day. Includes ready-made outreach and follow-up scripts.',
  },
  {
    title: 'Career Development & Skill Growth',
    blurb:
      'Choose your next direction, map transferable skills, and build a six-month growth plan. Focus on small, compounding wins instead of trying to reinvent yourself overnight.',
  },
  {
    title: 'Special Situations & Tough Scenarios',
    blurb:
      'Handle job gaps, layoffs, and career pivots with confidence. Learn how to talk about your story honestly while staying future-focused and resilient.',
  },
];

// ─────────────────────────────────────────────
// Viewer component with expandable + scroll-to articles
// ─────────────────────────────────────────────
function SectionViewer({ selectedSection }) {
  const [expandedIndex, setExpandedIndex] = useState(0);
  const articleRefs = useRef([]);

  useEffect(() => {
    setExpandedIndex(0);
  }, [selectedSection]);

  const cardStyle = {
    background: 'white',
    border: '1px solid #eee',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    minHeight: 200,
  };

  if (!selectedSection) {
    return (
      <div style={cardStyle}>
        <div style={{ fontWeight: 800, color: '#263238', marginBottom: 8 }}>
          Pick a learning section
        </div>
        <p style={{ color: '#455A64', marginTop: 6 }}>
          Select a section on the left to see what is inside. Each area includes focused
          guides, checklists, and scripts designed to move your career forward without
          overwhelm.
        </p>
      </div>
    );
  }

  const details = SECTION_DETAILS[selectedSection];

  if (!details) {
    return (
      <div style={cardStyle}>
        <div style={{ fontWeight: 800, color: '#263238', marginBottom: 8 }}>
          {selectedSection}
        </div>
        <p style={{ color: '#455A64', marginTop: 6 }}>
          Content for this section is coming soon.
        </p>
      </div>
    );
  }

  const hasArticles = details.articles && details.articles.length > 0;

  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: 800, color: '#263238', marginBottom: 8 }}>
        {selectedSection}
      </div>

      {details.description && (
        <p style={{ color: '#455A64', marginTop: 6 }}>{details.description}</p>
      )}

      {details.items && details.items.length > 0 && (
        <ul style={{ marginTop: 10, paddingLeft: 18, color: '#455A64' }}>
          {details.items.map((item, idx) => (
            <li key={idx} style={{ marginBottom: 4 }}>
              {item}
            </li>
          ))}
        </ul>
      )}

      {hasArticles && (
        <div style={{ marginTop: 14 }}>
          {details.articles.map((article, idx) => {
            const isOpen = expandedIndex === idx;
            const ArticleComponent = article.Component || null;

            return (
              <div
                key={idx}
                ref={(el) => {
                  articleRefs.current[idx] = el;
                }}
                style={{
                  marginTop: idx === 0 ? 0 : 12,
                  borderTop: '1px solid #ECEFF1',
                  paddingTop: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const nextIndex = isOpen ? -1 : idx;
                    setExpandedIndex(nextIndex);

                    if (!isOpen && articleRefs.current[idx]) {
                      try {
                        articleRefs.current[idx].scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      } catch {
                        // ignore
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#263238' }}>
                    {article.title}
                  </div>
                  <span style={{ fontSize: 12, color: '#90A4AE', flexShrink: 0 }}>
                    {isOpen ? 'Hide' : 'Show'}
                  </span>
                </button>

                {isOpen && (
                  <>
                    {ArticleComponent ? (
                      <ArticleComponent />
                    ) : (
                      article.paragraphs &&
                      article.paragraphs.map((para, pIdx) => (
                        <p key={pIdx} style={{ color: '#455A64', marginTop: 6 }}>
                          {para}
                        </p>
                      ))
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────
export default function HearthResourcesPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const { Layout, activeNav } = makeLayout(chrome);

  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <RightRailPlacementManager surfaceId="seeker/the-hearth/resources" slot="right_rail_1" />
    </div>
  );

  const [selectedSection, setSelectedSection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCards = SECTION_CARDS.filter((card) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      card.title.toLowerCase().includes(term) ||
      card.blurb.toLowerCase().includes(term)
    );
  });

  const Item = ({ title, blurb, isActive, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        background: isActive ? '#FFF3E0' : 'white',
        border: isActive ? '1px solid #FFB74D' : '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontWeight: 800, color: '#263238' }}>{title}</div>
      <p style={{ color: '#455A64', marginTop: 6 }}>{blurb}</p>
      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: '#FF7043' }}>
        View details →
      </div>
    </button>
  );

  return (
    <Layout
      title="Resources | ForgeTomorrow"
      header={Header}
      right={RightRail}
      activeNav={activeNav}
    >
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.6fr)',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        {/* Left: filter + section list */}
        <div style={{ display: 'grid', gap: 12 }}>
          <div
            style={{
              background: 'white',
              border: '1px solid #eee',
              borderRadius: 12,
              padding: 12,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              display: 'grid',
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: '#263238' }}>
              Filter resources
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sections..."
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #CFD8DC',
                fontSize: 13,
              }}
            />

            <div style={{ fontSize: 11, color: '#90A4AE' }}>
              Showing {filteredCards.length} of {SECTION_CARDS.length} sections
            </div>

            <div style={{ marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href={withChrome('/seeker/the-hearth/events')} style={{ color: '#FF7043', fontWeight: 800, fontSize: 12 }}>
                Events
              </Link>
              <span style={{ color: '#B0BEC5' }}>•</span>
              <Link href={withChrome('/seeker/the-hearth/forums')} style={{ color: '#FF7043', fontWeight: 800, fontSize: 12 }}>
                Forums
              </Link>
              <span style={{ color: '#B0BEC5' }}>•</span>
              <Link href={withChrome('/hearth/spotlights')} style={{ color: '#FF7043', fontWeight: 800, fontSize: 12 }}>
                Spotlights
              </Link>
            </div>
          </div>

          {filteredCards.map((card) => (
            <Item
              key={card.title}
              title={card.title}
              blurb={card.blurb}
              isActive={selectedSection === card.title}
              onClick={() => setSelectedSection(card.title)}
            />
          ))}
        </div>

        {/* Right: viewer pane */}
        <SectionViewer selectedSection={selectedSection} />
      </section>
    </Layout>
  );
}
