// pages/product.js
import Head from 'next/head';
import Link from 'next/link';

export default function ProductHub() {
  return (
    <>
      <Head>
        <title>Product | ForgeTomorrow</title>
        <meta
          name="description"
          content="Explore ForgeTomorrow’s product philosophy, tools, and systems."
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a] text-gray-100">
        {/* HERO */}
        <section className="relative px-6 pt-28 pb-16 text-center overflow-hidden">
          <div
            className="absolute inset-0 bg-[url('/images/forge-bg-bw.png')] bg-cover bg-center opacity-10"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF7043]" />
              Built with clarity · Humans first
            </div>

            <h1 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight">
              Product
            </h1>

            <p className="mt-4 text-lg md:text-xl text-gray-200 leading-relaxed">
              A complete career system — designed to explain itself.
            </p>
          </div>
        </section>

        {/* PHILOSOPHY */}
        <section className="px-6 pb-10">
          <div className="max-w-3xl mx-auto text-left text-gray-200 leading-relaxed">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-7">
              <p className="text-base md:text-[17px]">
                ForgeTomorrow is not a feature set or a marketplace.
                It is a connected system designed to reduce guesswork,
                surface alignment, and make career decisions explainable —
                for job seekers, recruiters, and coaches alike.
              </p>
            </div>
          </div>
        </section>

        {/* LINKS */}
        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
            <Link
              href="/features"
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
            >
              <h3 className="text-xl font-semibold mb-2">Features Overview</h3>
              <p className="text-gray-300 text-sm">
                A high-level view of the tools and systems inside ForgeTomorrow.
              </p>
            </Link>

            <Link
              href="/pricing"
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
            >
              <h3 className="text-xl font-semibold mb-2">Pricing</h3>
              <p className="text-gray-300 text-sm">
                Transparent plans with no dark patterns or surprise gates.
              </p>
            </Link>

            <Link
              href="/help"
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
            >
              <h3 className="text-xl font-semibold mb-2">Help Center</h3>
              <p className="text-gray-300 text-sm">
                Guidance, documentation, and answers when you need them.
              </p>
            </Link>

            <Link
              href="/status"
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
            >
              <h3 className="text-xl font-semibold mb-2">System Status</h3>
              <p className="text-gray-300 text-sm">
                Live visibility into platform availability and updates.
              </p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
