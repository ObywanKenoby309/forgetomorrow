// pages/index.js ← FINAL, BUSINESS-SMART, ACCESSIBLE, WORKING
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow — Real Tools. Real Help. Right Now.</title>
        <meta
          name="description"
          content="Free resume builder (3/mo), job tracking, salary data, coaching directory, and community. Upgrade any time for unlimited use + pro features."
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] text-gray-100">

        {/* HERO */}
        <section className="relative min-h-screen flex items-center justify-center px-6 text-center">
          <div
            className="absolute inset-0 bg-[url('/images/forge-bg-bw.png')] opacity-20 bg-cover bg-center"
            aria-hidden="true"
          />
          <div className="relative z-10 max-w-5xl">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              The forge is open.
              <br />
              <span className="text-[#FF7043]">Walk in.</span>
            </h1>

            <p className="text-xl md:text-2xl lg:text-3xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
              Whether you’re hunting your next job, hiring great people, or coaching others through the fire — 
              this place was built for <strong>you</strong>.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/pricing"
                className="inline-block bg-[#FF7043] hover:bg-[#f46036] text-white font-bold text-xl px-12 py-5 rounded-full shadow-2xl transition transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#FF7043] focus:ring-offset-2"
              >
                See Plans & Get Started
              </Link>
              <Link
                href="/about"
                className="inline-block border-2 border-[#FF7043] text-[#FF7043] hover:bg-[#FF7043] hover:text-white font-bold text-xl px-12 py-5 rounded-full transition focus:outline-none focus:ring-4 focus:ring-[#FF7043] focus:ring-offset-2"
              >
                Read the Promise
              </Link>
            </div>
          </div>
        </section>

        {/* THREE PATHS — ALL POINT TO PRICING */}
        <section className="py-24 bg-white text-gray-900">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-12 text-center">

            {/* Job Seekers */}
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-[#FF7043] rounded-full flex items-center justify-center text-4xl font-black text-white">
                S
              </div>
              <h3 className="text-3xl font-bold text-[#FF7043]">Job Seekers</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Free forever: job postings, coaching directory, community, see who viewed your profile.
                <br /><br />
                Start with <strong>3 résumés/mo</strong>, 1 incentive plan, 1 roadmap — upgrade any time for unlimited + analytics.
              </p>
              <Link href="/pricing" className="text-[#FF7043] font-bold hover:underline text-lg">
                See free vs. Seeker Pro →
              </Link>
            </div>

            {/* Recruiters & Employers */}
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-emerald-600 rounded-full flex items-center justify-center text-4xl font-black text-white">
                R
              </div>
              <h3 className="text-3xl font-bold text-emerald-600">Recruiters & Employers</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Post jobs free. Reach motivated talent.
                <br /><br />
                Upgrade for unlimited searches, direct messaging, profile analytics, and priority visibility.
              </p>
              <Link href="/pricing" className="text-emerald-600 font-bold hover:underline text-lg">
                View Recruiter Plans →
              </Link>
            </div>

            {/* Coaches & Mentors */}
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-purple-600 rounded-full flex items-center justify-center text-4xl font-black text-white">
                C
              </div>
              <h3 className="text-3xl font-bold text-purple-600">Coaches & Mentors</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                List your services free. Be found by people who need you.
                <br /><br />
                Upgrade for booking tools, group sessions, premium placement, and future resource library access.
              </p>
              <Link href="/pricing" className="text-purple-600 font-bold hover:underline text-lg">
                Explore Coach Plans →
              </Link>
            </div>

          </div>
        </section>

        {/* FINAL INVITATION — PROFESSIONAL & ACCESSIBLE */}
        <section className="py-24 bg-[#FF7043] text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-8">
              More than jobs. More than networking.
            </h2>
            <p className="text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto">
              ForgeTomorrow isn’t just a platform with some tools — we provide everything you need at every stage of your career journey. 
              Join us today and start forging your tomorrow.
            </p>
            <div className="mt-10">
              <Link
                href="/pricing"
                className="inline-block bg-white text-[#FF7043] font-bold text-xl px-12 py-5 rounded-full hover:bg-gray-100 transition shadow-2xl focus:outline-none focus:ring-4 focus:ring-white focus:ring-offset-2"
              >
                Choose Your Plan
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
