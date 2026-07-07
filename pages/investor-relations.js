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
        <section className="relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,93,47,0.22),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_28%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#070B12]/70 to-[#070B12]" />

          <div className="relative mx-auto flex min-h-[78vh] max-w-7xl items-center px-6 py-24 sm:px-8 lg:px-10">
            <div className="max-w-4xl">
              <span className="inline-flex rounded-full border border-[#E85D2F]/40 bg-[#E85D2F]/10 px-4 py-2 text-sm font-semibold tracking-wide text-[#FFB199] shadow-[0_0_30px_rgba(232,93,47,0.18)]">
                Investor Relations
              </span>

              <h1 className="mt-8 max-w-5xl text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Investing in the Future of Professional Intelligence
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                ForgeTomorrow is currently raising its pre-seed round. This page
                provides direct access to investment resources and investor
                contact information.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/FT_Investor_Walkthrough.pdf"
                  className="inline-flex items-center justify-center rounded-xl bg-[#E85D2F] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_50px_rgba(232,93,47,0.32)] transition hover:bg-[#ff7043] focus:outline-none focus:ring-2 focus:ring-[#FFB199] focus:ring-offset-2 focus:ring-offset-[#070B12]"
                >
                  View Investor Deck
                </a>

                <a
                  href="mailto:investors@forgetomorrow.com"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/8 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:border-[#E85D2F]/50 hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-[#FFB199] focus:ring-offset-2 focus:ring-offset-[#070B12]"
                >
                  Contact Investors
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-10">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FFB199]">
                Investment Overview
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                A focused resource for investors.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-300">
                The investor deck contains ForgeTomorrow&apos;s vision, market
                opportunity, product strategy, business model, and funding
                information. This page keeps the overview simple and directs
                investors to the complete materials.
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
            <a
              href="/FT_Investor_Walkthrough.pdf"
              className="group rounded-3xl border border-white/10 bg-white/[0.055] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#E85D2F]/45 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#FFB199] focus:ring-offset-2 focus:ring-offset-[#070B12]"
            >
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E85D2F]/35 bg-[#E85D2F]/12 text-xl">
                📄
              </div>

              <h3 className="text-xl font-bold text-white">Investor Deck</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Review the complete ForgeTomorrow investor walkthrough.
              </p>

              <p className="mt-6 text-sm font-semibold text-[#FFB199]">
                Open deck →
              </p>
            </a>

            <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/8 text-xl">
                ▶
              </div>

              <h3 className="text-xl font-bold text-white">Founder Video</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Coming Soon
              </p>

              <p className="mt-6 text-sm font-semibold text-slate-400">
                Video placeholder
              </p>
            </div>

            <a
              href="mailto:investors@forgetomorrow.com"
              className="group rounded-3xl border border-white/10 bg-white/[0.055] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#E85D2F]/45 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#FFB199] focus:ring-offset-2 focus:ring-offset-[#070B12]"
            >
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E85D2F]/35 bg-[#E85D2F]/12 text-xl">
                ✉
              </div>

              <h3 className="text-xl font-bold text-white">
                Contact Investors
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Reach the ForgeTomorrow investor inbox directly.
              </p>

              <p className="mt-6 break-all text-sm font-semibold text-[#FFB199]">
                investors@forgetomorrow.com
              </p>
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-[#E85D2F]/25 bg-gradient-to-br from-[#E85D2F]/18 via-white/[0.06] to-white/[0.03] p-8 shadow-[0_30px_90px_rgba(232,93,47,0.16)] backdrop-blur-xl sm:p-10">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#E85D2F]/20 blur-3xl" />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Questions about ForgeTomorrow?
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                  Contact the ForgeTomorrow investor team for additional
                  information about the current pre-seed raise.
                </p>
              </div>

              <a
                href="mailto:investors@forgetomorrow.com"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#E85D2F] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_50px_rgba(232,93,47,0.28)] transition hover:bg-[#ff7043] focus:outline-none focus:ring-2 focus:ring-[#FFB199] focus:ring-offset-2 focus:ring-offset-[#070B12]"
              >
                Contact Investors
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}