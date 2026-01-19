// pages/index.js ← UPDATED per main-page lock (hero + 3 CTAs + calmer paths + remove orange bar)
// Keep forge image. Remove plan-language. No bottom orange section.
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
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              The career system after algorithms.
              <br />
              <span className="text-[#FF7043]">This is where futures are forged.</span>
            </h1>

            <p className="text-xl md:text-2xl lg:text-3xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
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

        {/* THE PROBLEM / THE FIX — DIRECT */}
        <section className="py-24 bg-gradient-to-b from-[#0f0f0f] to-[#141414] text-gray-100">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                The current career system is misaligned with human outcomes
              </h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Most platforms optimize for volume, engagement, and opacity. That creates noise, delays,
                and career damage for real people, and it wastes time and money for employers.
                ForgeTomorrow exists to replace that system end-to-end with clarity, proof, and accountability.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-start">
              {/* WHAT'S HAPPENING */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-[#F4511E]">What’s happening right now</h3>
                <div className="space-y-4 text-gray-300">
                  <p className="flex items-start gap-3">
                    <span className="text-[#F4511E] mt-1 font-black">×</span>
                    <span>
                      Keyword parsing and resume filters that discard real capability and real potential
                    </span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-[#F4511E] mt-1 font-black">×</span>
                    <span>
                      Opaque decisioning, where people are rejected with zero explanation and no path forward
                    </span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-[#F4511E] mt-1 font-black">×</span>
                    <span>
                      Platforms engineered to keep you scrolling, not to get you hired, promoted, or stable
                    </span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-[#F4511E] mt-1 font-black">×</span>
                    <span>
                      Guesswork around fit, expectations, culture, compensation, and what the role truly needs
                    </span>
                  </p>
                </div>
              </div>

              {/* WHAT WE BUILT */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-[#FF7043]">What ForgeTomorrow replaces it with</h3>
                <div className="space-y-4 text-gray-300">
                  <p className="flex items-start gap-3">
                    <span className="text-[#FF7043] mt-1 font-black">✓</span>
                    <span>
                      Proof-based signals that show what people have actually built, done, and delivered
                    </span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-[#FF7043] mt-1 font-black">✓</span>
                    <span>
                      Transparent alignment that explains why something fits (or doesn’t) and what to do next
                    </span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-[#FF7043] mt-1 font-black">✓</span>
                    <span>
                      Tools designed for outcomes, not engagement: prepare, align, act, and move forward
                    </span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-[#FF7043] mt-1 font-black">✓</span>
                    <span>
                      A complete system for seekers, recruiters, and coaches to operate with clarity and accountability
                    </span>
                  </p>
                </div>

                <div className="pt-4">
                  <Link
                    href="/features"
                    className="inline-block border border-white/15 bg-white/5 hover:bg-white/10 text-gray-100 font-semibold px-6 py-3 rounded-xl transition focus:outline-none focus:ring-4 focus:ring-white/30 focus:ring-offset-2"
                  >
                    See the system in action →
                  </Link>
                </div>
              </div>
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

        {/* FINAL CTA — CINEMATIC CLOSE */}
        <section className="py-24 bg-gradient-to-b from-[#141414] to-[#0f0f0f] text-gray-100">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              If the system is failing people, we rebuild the system.
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              ForgeTomorrow is built to move careers and hiring forward with proof, clarity, and accountability.
              Not a patch. Not a feature. A complete system designed around human outcomes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/pricing"
                className="inline-block bg-[#FF7043] hover:bg-[#f46036] text-white font-bold text-xl px-12 py-5 rounded-full shadow-2xl transition transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#FF7043] focus:ring-offset-2"
              >
                Enter the Forge
              </Link>

              <Link
                href="/features"
                className="inline-block border-2 border-white/20 text-gray-100 hover:bg-white/10 font-bold text-xl px-12 py-5 rounded-full transition focus:outline-none focus:ring-4 focus:ring-white/30 focus:ring-offset-2"
              >
                Explore the Forge
              </Link>
            </div>
          </div>
        </section>

        {/* Bottom orange bar removed intentionally. No replacement. */}
      </main>
    </>
  );
}
