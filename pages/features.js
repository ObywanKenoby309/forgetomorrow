// pages/features.js
import Head from 'next/head';
import FeaturesList from '../components/FeaturesList';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

export default function Features() {
  const features = [
    'Human-centered networking: Prioritizing real connections over algorithms.',
    'AI-powered job search: Tailored recommendations and assistance with integrity.',
    'Real job boards: Verified listings without spam or bots.',
    'Flexible membership plans: Options for seekers, freelancers, recruiters, and small businesses.',
    'Dedicated human support: Real tech support that shows up when you need it.',
    'Secure messaging: Connect instantly with your network through private chats.',
    'Transparency and fairness: No gatekeeping or hidden costs.',
    'Mobile-friendly design: Access ForgeTomorrow anywhere, anytime.',
  ];

  return (
    <>
      <Head>
        <title>ForgeTomorrow - Features</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <LandingHeader />

      <main
        role="main"
        aria-label="Features of ForgeTomorrow"
        className="max-w-3xl mx-auto p-6 space-y-8 min-h-[80vh] bg-[#1a1a1a] text-[#f5f5f5] rounded-lg shadow my-20 sm:my-24"
      >
        <section>
          <h1 className="text-4xl font-bold text-[#ff9900] text-center mb-6">Features</h1>
          <h2 className="text-2xl font-semibold text-[#ff9900] text-center mb-4">Empowering Everyone</h2>
          <FeaturesList features={features} />
        </section>
      </main>

      <LandingFooter />
    </>
  );
}
