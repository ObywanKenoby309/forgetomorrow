import Head from "next/head";
import Link from "next/link";

export default function InvestorRelations() {
  return (
    <>
      <Head>
        <title>Investor Relations | ForgeTomorrow</title>
        <meta
          name="description"
          content="ForgeTomorrow investor relations resources, including the investor deck and direct investor contact."
        />
      </Head>

      <main className="min-h-screen overflow-hidden bg-[#070B12] text-white">
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/images/investor-hero.png')",
            }}
          />

          <div className="absolute inset-0 bg-black/60" />

          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 20%, rgba(255,112,67,.12), transparent 60%)",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-[#070B12]" />

          <div className="relative mx-auto flex min-h-[82vh] max-w-7xl items-center px-6 py-24 sm:px-8 lg:px-10">
            <div className="max-w-5xl">
              <div className="mb-6 inline-flex items-center rounded-full border border-[#F07F52]/30 bg-[#F07F52]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FFB199]">
                Pre-Seed Investment Opportunity
              </div>

              <h1 className="text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">
                The market called for
                <br />
                <span className="text-[#F07F52]">explainability.</span>
              </h1>

              <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                ForgeTomorrow answered.
              </h2>

              <p className="mt-10 max-w-3xl text-lg leading-9 text-slate-300 sm:text-xl">
                ForgeTomorrow has built the professional intelligence infrastructure behind the future of hiring.
                <br />
                <span className="font-medium text-white">
                  And that's just the beginning.
                </span>
              </p>

              <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-300 sm:text-xl">
                We are currently raising our pre-seed round and are looking for partners who believe professional opportunity should be earned through verified career evidence, not keyword matching, social signaling, or hidden algorithms.
              </p>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-10">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FFB199]">
                Why We Built ForgeTomorrow
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Building the professional intelligence layer.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-300">
                The investor deck explores the vision, strategy, market opportunity, and execution behind ForgeTomorrow in greater detail. We believe the future of hiring will be built on trusted career evidence, explainable evaluation, and professional intelligence that benefits the entire hiring ecosystem.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24 sm:px-8 lg:px-10">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FFB199]">
              Resources
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Investor materials
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <a href="/FT_Investor_Walkthrough.pdf" className="group rounded-3xl border border-white/10 bg-white/[0.055] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#E85D2F]/45 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#FFB199] focus:ring-offset-2 focus:ring-offset-[#070B12]">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E85D2F]/35 bg-[#E85D2F]/12 text-xl">📄</div>
              <h3 className="text-xl font-bold text-white">Investor Deck</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">Review the complete ForgeTomorrow investor walkthrough.</p>
              <p className="mt-6 text-sm font-semibold text-[#FFB199]">Open deck →</p>
            </a>

            <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/8 text-xl">▶</div>
              <h3 className="text-xl font-bold text-white">Founder Video</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">Coming Soon</p>
              <p className="mt-6 text-sm font-semibold text-slate-400">Video placeholder</p>
            </div>

            <a href="mailto:investors@forgetomorrow.com" className="group rounded-3xl border border-white/10 bg-white/[0.055] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#E85D2F]/45 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#FFB199] focus:ring-offset-2 focus:ring-offset-[#070B12]">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E85D2F]/35 bg-[#E85D2F]/12 text-xl">✉</div>
              <h3 className="text-xl font-bold text-white">Contact Investors</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">Reach the ForgeTomorrow investor inbox directly.</p>
              <p className="mt-6 break-all text-sm font-semibold text-[#FFB199]">investors@forgetomorrow.com</p>
            </a>
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FFB199]">
              The Future
            </p>

            <h2 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-6xl">
              Hiring is moving from
              <br />
              keyword-matching
              <br />
              <span className="text-[#F07F52]">to capability-verification.</span>
            </h2>
          </div>
        </section>
      </main>
    </>
  );
}
