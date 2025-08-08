import Head from 'next/head';
import { useState } from 'react';

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

      <main className="max-w-4xl mx-auto p-10 space-y-10 min-h-[80vh] bg-[#ECEFF1] text-[#212121]">
        <section className="bg-white rounded-lg shadow p-8 space-y-6">
          <h1 className="text-4xl font-bold text-[#FF7043] text-center">
            Career Development Toolkit
          </h1>

          {!activeModule && (
            <>
              <p className="text-lg text-gray-700 text-center max-w-2xl mx-auto">
                This AI-powered experience will analyze your resume and professional history
                to generate a personalized roadmap with your best-fit roles, a 30/60/90 day plan
                for growth, and recommended certifications to help you succeed.
              </p>

              <ToolkitLanding onSelectModule={setActiveModule} />
            </>
          )}

          {activeModule === 'profile' && (
            <>
              <button
                className="mb-4 text-sm text-[#FF7043] underline"
                onClick={() => setActiveModule(null)}
              >
                ← Back to toolkit
              </button>
              <ProfileDevelopment />
            </>
          )}

          {activeModule === 'offer' && (
            <>
              <button
                className="mb-4 text-sm text-[#FF7043] underline"
                onClick={() => setActiveModule(null)}
              >
                ← Back to toolkit
              </button>
              <OfferNegotiation />
            </>
          )}

          {activeModule === 'onboarding' && (
            <>
              <button
                className="mb-4 text-sm text-[#FF7043] underline"
                onClick={() => setActiveModule(null)}
              >
                ← Back to toolkit
              </button>
              <OnboardingGrowth />
            </>
          )}
        </section>
      </main>
    </>
  );
}

