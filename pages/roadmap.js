import Head from 'next/head';
import { useState } from 'react';

import SeekerSidebar from '../components/SeekerSidebar';
import ToolkitLanding from '../components/roadmap/ToolkitLanding';
import ProfileDevelopment from '../components/roadmap/ProfileDevelopment';
import OfferNegotiation from '../components/roadmap/OfferNegotiation';
import OnboardingGrowth from '../components/roadmap/OnboardingGrowth';

export default function CareerRoadmap() {
  const [activeModule, setActiveModule] = useState(null);

  return (
    <>
      <Head>
        <title>Career Development Toolkit | ForgeTomorrow</title>
      </Head>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px minmax(0, 1fr) 300px',
          gap: '20px',
          padding: '120px 20px 20px',
          minHeight: '100vh',
          backgroundColor: '#ECEFF1',
        }}
      >
        <SeekerSidebar />

        <main
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              padding: '32px',
              maxWidth: '800px',
              width: '100%',
            }}
          >
            <h1
              style={{
                color: '#FF7043',
                fontSize: '2.25rem',
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: '24px',
              }}
            >
              Your Personalized Career Roadmap
            </h1>

            {!activeModule && (
              <>
                <p
                  style={{
                    color: '#4A5568',
                    fontSize: '1.125rem',
                    maxWidth: '600px',
                    margin: '0 auto 24px auto',
                    lineHeight: '1.5',
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  Welcome to your Career Development Toolkit! This powerful AI-driven resource
                  guides you through every stage of your job search and early career growth.
                  Get personalized insights on your resume, job offers, and onboarding success
                  to help build the career you deserve.
                </p>

                <ul
                  style={{
                    color: '#4A5568',
                    maxWidth: '600px',
                    margin: '0 auto 32px auto',
                    lineHeight: '1.5',
                    listStyleType: 'disc',
                    paddingLeft: '20px',
                    fontSize: '1rem',
                  }}
                >
                  <li>Tailored recommendations based on your unique skills and goals</li>
                  <li>
                    Step-by-step guidance through Profile Development, Offer Negotiation, and
                    Onboarding & Growth
                  </li>
                  <li>Practical tools to help you land your ideal job and thrive in your new role</li>
                  <li>
                    Flexibility to work independently or collaborate with a trainer, mentor,
                    or coach to maximize your success
                  </li>
                </ul>

                <p
                  style={{
                    color: '#4A5568',
                    fontSize: '1rem',
                    maxWidth: '600px',
                    margin: '0 auto 16px auto',
                    lineHeight: '1.4',
                    fontStyle: 'italic',
                    textAlign: 'center',
                  }}
                >
                  <strong>Usage Note:</strong> Free users receive one full roadmap experience.  
                  Please upload a complete resume via our AI-powered resume builder to get started.  
                  Subscribers enjoy up to one personalized roadmap per month and access to advanced features.
                </p>

                <p
                  style={{
                    color: '#4A5568',
                    fontSize: '1.125rem',
                    maxWidth: '600px',
                    margin: '0 auto 32px auto',
                    lineHeight: '1.6',
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
                    marginBottom: '16px',
                    fontSize: '0.875rem',
                    color: '#FF7043',
                    textDecoration: 'underline',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
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
                    marginBottom: '16px',
                    fontSize: '0.875rem',
                    color: '#FF7043',
                    textDecoration: 'underline',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
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
                    marginBottom: '16px',
                    fontSize: '0.875rem',
                    color: '#FF7043',
                    textDecoration: 'underline',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  ← Back to toolkit
                </button>
                <OnboardingGrowth />
              </>
            )}
          </div>
        </main>

        {/* Right Column – Empty placeholder for future content */}
        <aside
          style={{
            backgroundColor: '#ECEFF1',
            borderRadius: '8px',
            width: '300px',
          }}
        />
      </div>
    </>
  );
}
