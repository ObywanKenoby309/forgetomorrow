// pages/company.js
import Head from 'next/head';
import Link from 'next/link';

export default function CompanyHub() {
  return (
    <>
      <Head>
        <title>Company | ForgeTomorrow</title>
        <meta
          name="description"
          content="Learn who ForgeTomorrow is, how we operate, and what we stand for."
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a] text-gray-100">
        {/* HERO / ORIENTATION */}
        <section className="relative px-6 pt-28 pb-16 text-center overflow-hidden">
          {/* Forge background */}
          <div
            className="absolute inset-0 bg-[url('/images/forge-bg-bw.png')] bg-cover bg-center opacity-10"
            aria-hidden="true"
          />

          {/* Cinematic overlays (subtle embers + depth) */}
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full blur-3xl opacity-30 bg-gradient-to-r from-[#FF7043]/40 via-[#FF7043]/10 to-transparent animate-[ftGlow_10s_ease-in-out_infinite]" />
            <div className="absolute -bottom-32 right-[-6rem] h-72 w-72 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-[#FF7043]/35 to-transparent animate-[ftGlow_12s_ease-in-out_infinite]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/60" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF7043]" />
              Built with clarity • Humans first
            </div>

            <h1 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight">
              Company
            </h1>

            <p className="mt-4 text-lg md:text-xl text-gray-200 leading-relaxed">
              Who we are, how we operate, and what we stand for.
              <span className="text-[#FF7043] font-semibold"> Less noise. More truth.</span>
            </p>

            {/* Micro-actions (quiet, not salesy) */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-100 hover:bg-white/10 hover:border-white/25 transition focus:outline-none focus:ring-4 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black"
              >
                Contact us
              </Link>
              <span className="text-xs text-gray-400">
                Prefer details? Use the links below. No fluff.
              </span>
            </div>
          </div>
        </section>

        {/* PHILOSOPHY */}
        <section className="px-6 pb-10">
          <div className="max-w-3xl mx-auto text-left text-gray-200 leading-relaxed">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <p className="text-base md:text-[17px]">
                ForgeTomorrow is built by people who believe careers should be guided by clarity, not guesswork.
                We operate with transparency, accountability, and respect for the people who trust us with their futures.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-300">
                  Proof over keywords
                </span>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-300">
                  Explain decisions
                </span>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-300">
                  Protect dignity
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* LINKS GRID */}
        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
            <Link
              href="/about"
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#FF7043]/20 focus:ring-offset-2 focus:ring-offset-black"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">About Us</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Our mission, values, and the reason ForgeTomorrow exists.
                  </p>
                </div>
                <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-[#FF7043] group-hover:border-[#FF7043]/30 transition">
                  →
                </span>
              </div>
              <div className="mt-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="mt-4 text-xs text-gray-400">Start here if you want the “why.”</div>
            </Link>

            <Link
              href="/careers"
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#FF7043]/20 focus:ring-offset-2 focus:ring-offset-black"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Careers</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Join the build. Help replace the broken system with something better.
                  </p>
                </div>
                <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-[#FF7043] group-hover:border-[#FF7043]/30 transition">
                  →
                </span>
              </div>
              <div className="mt-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="mt-4 text-xs text-gray-400">Open roles and how we work.</div>
            </Link>

            <Link
              href="/press"
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#FF7043]/20 focus:ring-offset-2 focus:ring-offset-black"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Press Kit</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Brand assets, company facts, and media-friendly references.
                  </p>
                </div>
                <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-[#FF7043] group-hover:border-[#FF7043]/30 transition">
                  →
                </span>
              </div>
              <div className="mt-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="mt-4 text-xs text-gray-400">For partners, media, and community.</div>
            </Link>

            <Link
              href="/blog"
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#FF7043]/20 focus:ring-offset-2 focus:ring-offset-black"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Blog</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Updates, insights, and hard-earned lessons from the work.
                  </p>
                </div>
                <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-[#FF7043] group-hover:border-[#FF7043]/30 transition">
                  →
                </span>
              </div>
              <div className="mt-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="mt-4 text-xs text-gray-400">If you want the thinking behind the build.</div>
            </Link>
          </div>
        </section>

        {/* Local-only styles (keeps changes contained to this page) */}
        <style jsx>{`
          @keyframes ftGlow {
            0% {
              transform: translate(-50%, 0) scale(1);
              opacity: 0.22;
            }
            50% {
              transform: translate(-50%, 10px) scale(1.04);
              opacity: 0.32;
            }
            100% {
              transform: translate(-50%, 0) scale(1);
              opacity: 0.22;
            }
          }
        `}</style>
      </main>
    </>
  );
}
