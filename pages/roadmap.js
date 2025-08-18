// pages/roadmap.js
import { useState } from 'react';
import Link from 'next/link';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import ToolkitLanding from '../components/roadmap/ToolkitLanding';
import ProfileDevelopment from '../components/roadmap/ProfileDevelopment';
import OfferNegotiation from '../components/roadmap/OfferNegotiation';
import OnboardingGrowth from '../components/roadmap/OnboardingGrowth';

export default function CareerRoadmap() {
  const [activeModule, setActiveModule] = useState(null);

  const RightColumn = (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ color: 'white', fontWeight: 700, marginBottom: 4 }}>Shortcuts</div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        <li>
          <button
            onClick={() => setActiveModule(null)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#FF7043', fontWeight: 600 }}
          >
            Toolkit Overview
          </button>
        </li>
        <li>
          <button
            onClick={() => setActiveModule('profile')}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#FF7043', fontWeight: 600 }}
          >
            Profile Development
          </button>
        </li>
        <li>
          <button
            onClick={() => setActiveModule('offer')}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#FF7043', fontWeight: 600 }}
          >
            Offer Negotiation
          </button>
        </li>
        <li>
          <button
            onClick={() => setActiveModule('onboarding')}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#FF7043', fontWeight: 600 }}
          >
            Onboarding & Growth
          </button>
        </li>
      </ul>
    </div>
  );

  return (
    <SeekerLayout
      title="Career Development Toolkit | ForgeTomorrow"
      headerTitle="Your Personalized Career Roadmap"
      headerDescription="A guided, AI-driven path through profile building, offer negotiation, and your first 90 days."
      right={RightColumn}
    >
      {/* Center column content spans the full center width */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 12,
          border: '1px solid #eee',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          padding: 24,
          width: '100%',            // <-- full width of center column
          display: 'grid',
          gap: 16,
        }}
      >
        {!activeModule && (
          <>
            <p
              style={{
                color: '#4A5568',
                fontSize: '1.125rem',
                maxWidth: 680,
                margin: '0 auto',
                lineHeight: 1.5,
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              Welcome to your Career Development Toolkit! This powerful AI-driven resource guides you through every stage
              of your job search and early career growth. Get personalized insights on your resume, job offers, and
              onboarding success to help build the career you deserve.
            </p>

            <ul
              style={{
                color: '#4A5568',
                maxWidth: 680,
                margin: '0 auto',
                lineHeight: 1.5,
                listStyleType: 'disc',
                paddingLeft: 20,
                fontSize: '1rem',
                display: 'grid',
                gap: 8,
              }}
            >
              <li>Tailored recommendations based on your unique skills and goals</li>
              <li>Step-by-step guidance through Profile Development, Offer Negotiation, and Onboarding & Growth</li>
              <li>Practical tools to help you land your ideal job and thrive in your new role</li>
              <li>Flexibility to work independently or collaborate with a trainer, mentor, or coach</li>
            </ul>

            <p
              style={{
                color: '#4A5568',
                fontSize: '1rem',
                maxWidth: 680,
                margin: '0 auto',
                lineHeight: 1.4,
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              <strong>Usage Note:</strong> Free users receive one full roadmap experience. Please upload a complete resume
              via our AI-powered resume builder to get started. Subscribers enjoy up to one personalized roadmap per month
              and access to advanced features.
            </p>

            <p
              style={{
                color: '#4A5568',
                fontSize: '1.125rem',
                maxWidth: 680,
                margin: '0 auto',
                lineHeight: 1.6,
                textAlign: 'center',
              }}
            >
              When you’re ready, choose a module below to begin shaping your future!
            </p>

            <ToolkitLanding onSelectModule={setActiveModule} />
          </>
        )}

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
              ← Back to toolkit
            </button>
            <ProfileDevelopment />
          </>
        )}

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
              ← Back to toolkit
            </button>
            <OfferNegotiation />
          </>
        )}

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
              ← Back to toolkit
            </button>
            <OnboardingGrowth />
          </>
        )}
      </div>
    </SeekerLayout>
  );
}
