// pages/index.js ← UPDATED hero typography only (calmer hierarchy, intentional emphasis)
// Keep forge image. No layout refactor. No new sections.
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow — The career system after algorithms.</title>
        <meta
          name="description"
          content="ForgeTomorrow is a career platform built for clarity, alignment, and human dignity. Proof over keywords. Clarity over guesswork."
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
              The career system <span className="text-[#FF7043]">after</span> algorithms.
            </h1>

            <div className="mt-6">
              <p className="text-2xl md:text-3xl lg:text-4xl font-medium text-gray-200">
                This is where futures are <span className="text-[#FF7043] font-semibold">forged</span>.
              </p>
            </div>

            <p className="mt-8 text-lg md:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Proof over keywords. Clarity over guesswork. Designed to treat people like people.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/pricing"
                className="inline-block bg-[#FF7043] hover:bg-[#f46036] text-white font-bold text-xl px-12 py-5 rounded-full shadow-2xl transition transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#FF7043] focus:ring-offset-2"
              >
                Enter the Forge
              </Link>

              <Link
                href="/about"
                className="inline-block border-2 border-[#FF7043] text-[#FF7043] hover:bg-[#FF7043] hover:text-white font-bold text-xl px-12 py-5 rounded-full transition focus:outline-none focus:ring-4 focus:ring-[#FF7043] focus:ring-offset-2"
              >
                Our Promise
              </Link>

              <Link
                href="/features"
                className="inline-block text-gray-200 hover:text-white font-semibold text-lg underline underline-offset-4 decoration-white/30 hover:decoration-white transition focus:outline-none focus:ring-4 focus:ring-white focus:ring-offset-2"
              >
                Explore the Forge
              </Link>
            </div>
          </div>
        </section>

        {/* ORIENTATION STRIP */}
        <section className="py-16 bg-[#0f0f0f] text-gray-100">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-6">
              Built for how careers and hiring actually work
            </h2>
            <div className="grid md:grid-cols-4 gap-6 text-left max-w-6xl mx-auto">
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="font-bold mb-2">Prepare with intent</div>
                <div className="text-gray-200">
                  Strengthen your signal before pressure hits. Build with purpose, not panic.
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="font-bold mb-2">Understand alignment</div>
                <div className="text-gray-200">
                  Reduce guesswork. See what matters and why, without keyword theater.
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="font-bold mb-2">Get real support</div>
                <div className="text-gray-200">
                  Coaching and guidance live inside the platform, built for outcomes.
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="font-bold mb-2">Move with clarity</div>
                <div className="text-gray-200">
                  Tools and systems that explain themselves so people can act confidently.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THREE PATHS — DESCRIPTIVE, NOT SALESY */}
        <section className="py-24 bg-white text-gray-900">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-12 text-center">
            {/* Job Seekers */}
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-[#FF7043] rounded-full flex items-center justify-center text-4xl font-black text-white">
                S
              </div>
              <h3 className="text-3xl font-bold text-[#FF7043]">Job Seekers</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Build and refine your career signal, understand fit before you apply, and move forward
                without guessing what hidden systems want.
              </p>
              <Link href="/features" className="text-[#FF7043] font-bold hover:underline text-lg">
                Explore Seeker Tools →
              </Link>
            </div>

            {/* Recruiters & Employers */}
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-emerald-600 rounded-full flex items-center justify-center text-4xl font-black text-white">
                R
              </div>
              <h3 className="text-3xl font-bold text-emerald-600">Recruiters & Employers</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Hire with clarity and accountability. Review candidates with visible reasoning,
                compare side by side, and communicate without opaque filters.
              </p>
              <Link href="/features" className="text-emerald-600 font-bold hover:underline text-lg">
                Explore Recruiter Tools →
              </Link>
            </div>

            {/* Coaches & Mentors */}
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto bg-purple-600 rounded-full flex items-center justify-center text-4xl font-black text-white">
                C
              </div>
              <h3 className="text-3xl font-bold text-purple-600">Coaches & Mentors</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Support professionals inside a system built for outcomes. Offer services transparently,
                organize clients, schedule sessions, and gather feedback with accountability.
              </p>
              <Link href="/features" className="text-purple-600 font-bold hover:underline text-lg">
                Explore Coaching Tools →
              </Link>
            </div>
          </div>
        </section>

        {/* Bottom orange bar intentionally removed */}
      </main>
    </>
  );
}
