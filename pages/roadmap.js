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

      <main className="max-w-7xl mx-auto px-6 min-h-[80vh] bg-[#ECEFF1] text-[#212121]">
        <div className="pt-[100px]">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Left Column – Placeholder for Navigation/Sidebar */}
            <aside className="md:col-span-1">
              {/* Optional navigation or future sidebar can go here */}
            </aside>

            {/* Middle Column – Main Content */}
            <section className="md:col-span-3 space-y-10">
              <div className="bg-white rounded-lg shadow p-8 space-y-6">
                <h1 className="text-4xl font-bold text-[#FF7043] text-center">
                  Career Development Toolkit
                </h1>

                {!activeModule && (
                  <>
                    <p className="text-lg text-gray-700 text-center max-w-2xl mx-auto space-y-4">
                      <span>
                        Welcome to your Career Development Toolkit! This powerful AI-driven resource is designed to guide you through every stage of your job search and early career growth. From personalized insights on your resume and professional background, to expert advice on job offers and onboarding success, we’re here to help you build the career you deserve.
                      </span>
                      <br />
                      <span>
                        Here’s what you can expect:
                      </span>
                      <ul className="list-disc list-inside text-gray-700 text-left max-w-xl mx-auto my-4">
                        <li>Tailored recommendations based on your unique skills and goals</li>
                        <li>Step-by-step guidance through Profile Development, Offer Negotiation, and Onboarding & Growth</li>
                        <li>Practical tools to help you land your ideal job and thrive in your new role</li>
                        <li>Flexibility to take these results and work on your plan independently—or collaborate with a trainer, mentor, or coach to maximize your success</li>
                      </ul>
                      <br />
                      <span>
                        Please note: Free accounts receive one full roadmap experience to help you get started. Additional usage and advanced features are available through our subscription plans, designed to provide ongoing support as your career grows.
                      </span>
                      <br />
                      <span>
                        If you’re ready, choose a module below to begin shaping your future!
                      </span>
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
              </div>
            </section>

            {/* Right Column – Placeholder for Saved Docs or other tools */}
            <aside className="md:col-span-1">
              {/* Could add quick links, saved plans, or related tools here */}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
