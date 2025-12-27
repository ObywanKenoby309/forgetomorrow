// pages/roadmap.js
import { useState } from 'react';
import { useRouter } from 'next/router';

import SeekerLayout from '@/components/layouts/SeekerLayout';

import ToolkitLanding from '../components/roadmap/ToolkitLanding';
import ProfileDevelopment from '../components/roadmap/ProfileDevelopment';
import OfferNegotiation from '../components/roadmap/OfferNegotiation';
import OnboardingGrowth from '../components/roadmap/OnboardingGrowth';

function getChromeFromAsPath(asPath) {
  try {
    const s = String(asPath || '');
    if (!s.includes('chrome=')) return '';
    const qIndex = s.indexOf('?');
    if (qIndex === -1) return '';
    const query = s.slice(qIndex + 1);
    const params = new URLSearchParams(query);
    return String(params.get('chrome') || '').toLowerCase();
  } catch {
    return '';
  }
}

export default function CareerRoadmap() {
  const [activeModule, setActiveModule] = useState(null);

  const router = useRouter();

  // IMPORTANT: router.query can be empty on first render.
  // Use asPath fallback so we never lose chrome context.
  const chrome =
    String(router.query.chrome || '').toLowerCase() ||
    getChromeFromAsPath(router.asPath);

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // Match seeker-dashboard behavior: SeekerLayout stays, chrome only influences wrappers/nav.
  const chromeKey = chrome || 'seeker';
  const activeNav =
    chromeKey === 'coach' || chromeKey.startsWith('recruiter')
      ? 'roadmap'
      : 'roadmap';

  // Title card (SeekerLayout expects `header` content like seeker-dashboard)
  const HeaderBox = (
    <section
      aria-label="Career roadmap overview"
      className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm"
    >
      <h1 className="text-2xl md:text-3xl font-bold text-orange-600">
        Your Personalized Career Roadmap
      </h1>
      <p className="text-sm md:text-base text-gray-600 mt-2 max-w-3xl mx-auto">
        A guided, AI-supported path through profile building, offer negotiation, and
        your first year of growth.
      </p>
    </section>
  );

  const RightColumn = (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Page-specific ad slot for Roadmap */}
      <div
        style={{
          background: 'white',
          borderRadius: 10,
          padding: 12,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
          border: '1px solid #eee',
        }}
      >
        <div style={{ fontWeight: 800, color: '#37474F', marginBottom: 4 }}>
          Career Programs Spotlight
        </div>
        <p style={{ margin: 0, color: '#607D8B', fontSize: 13 }}>
          Feature your bootcamp, coaching program, or upskilling course alongside the
          Career Development Toolkit. Email{' '}
          <a
            href="mailto:sales@forgetomorrow.com"
            style={{ color: '#FF7043', fontWeight: 600 }}
          >
            sales@forgetomorrow.com
          </a>{' '}
          for Roadmap placement.
        </p>
      </div>
    </div>
  );

  return (
    <SeekerLayout
      title="Career Development Toolkit | ForgeTomorrow"
      header={HeaderBox}
      right={RightColumn}
      activeNav={activeNav}
    >
      {/* Center column content */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 12,
          border: '1px solid #eee',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
          padding: 24,
          width: '100%',
          display: 'grid',
          gap: 16,
        }}
      >
        {/* LANDING / OVERVIEW */}
        {!activeModule && (
          <>
            <p
              style={{
                color: '#4A5568',
                fontSize: '1.1rem',
                maxWidth: 680,
                margin: '0 auto',
                lineHeight: 1.5,
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              Your Career Development Toolkit is a guided, AI-supported workspace that
              helps you grow at every stage of your career — from sharpening your
              ForgeTomorrow profile to navigating offers and planning your next move.
            </p>

            <ul
              style={{
                color: '#4A5568',
                maxWidth: 680,
                margin: '0 auto',
                lineHeight: 1.5,
                listStyleType: 'disc',
                paddingLeft: 20,
                fontSize: '0.98rem',
                display: 'grid',
                gap: 8,
              }}
            >
              <li>Personalized guidance based on your goals, skills, and experience.</li>
              <li>
                Clear, step-by-step support for job search, negotiations, and career
                transitions.
              </li>
              <li>
                Insights to help you position yourself, strengthen your profile, and move
                into the roles you want.
              </li>
              <li>
                Tools for compensation conversations, internal mobility, and long-term
                growth.
              </li>
            </ul>

            <p
              style={{
                color: '#4A5568',
                fontSize: '1rem',
                maxWidth: 680,
                margin: '0 auto',
                lineHeight: 1.6,
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              <strong>Choose a module below to get started:</strong>
            </p>

            {/* Module chooser */}
            <ToolkitLanding onSelectModule={setActiveModule} />

            {/* Usage note */}
            <p
              style={{
                color: '#718096',
                fontSize: '0.85rem',
                maxWidth: 720,
                margin: '8px auto 0',
                lineHeight: 1.4,
                textAlign: 'center',
              }}
            >
              <strong>Usage note:</strong> Free plan users receive one personalized
              roadmap. Please upload a complete resume using the{' '}
              <a
                href={withChrome('/resume/create')}
                style={{ color: '#FF7043', fontWeight: 600 }}
              >
                Resume Builder
              </a>{' '}
              before starting. Subscribers receive one new roadmap per month and access to
              advanced guidance tools.
            </p>
          </>
        )}

        {/* PROFILE DEVELOPMENT */}
        {activeModule === 'profile' && (
          <>
            <button
              onClick={() => setActiveModule(null)}
              style={{
                marginBottom: 8,
                fontSize: '0.875rem',
                color: '#FF7043',
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              Back to toolkit
            </button>
            <ProfileDevelopment
              onNext={() => setActiveModule('offer')}
              setActiveModule={setActiveModule}
            />
          </>
        )}

        {/* OFFER NEGOTIATION */}
        {activeModule === 'offer' && (
          <>
            <button
              onClick={() => setActiveModule(null)}
              style={{
                marginBottom: 8,
                fontSize: '0.875rem',
                color: '#FF7043',
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              Back to toolkit
            </button>
            <OfferNegotiation
              onNext={() => setActiveModule('onboarding')}
              setActiveModule={setActiveModule}
            />
          </>
        )}

        {/* PLAN GROWTH & PIVOTS */}
        {activeModule === 'onboarding' && (
          <>
            <button
              onClick={() => setActiveModule(null)}
              style={{
                marginBottom: 8,
                fontSize: '0.875rem',
                color: '#FF7043',
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              Back to toolkit
            </button>
            <OnboardingGrowth
              onNext={() => setActiveModule(null)}
              setActiveModule={setActiveModule}
            />
          </>
        )}
      </div>
    </SeekerLayout>
  );
}
