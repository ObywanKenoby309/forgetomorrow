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
        <section className="relative py-32 px-6 text-center">
          <div
            className="absolute inset-0 bg-[url('/images/forge-bg-bw.png')] bg-cover bg-center opacity-10"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-semibold mb-4">
              Company
            </h1>
            <p className="text-lg md:text-xl text-gray-300">
              Who we are, how we operate, and what we stand for.
            </p>
          </div>
        </section>

        {/* PHILOSOPHY */}
        <section className="px-6 pb-16">
          <div className="max-w-3xl mx-auto text-left text-gray-300 leading-relaxed">
            <p>
              ForgeTomorrow is built by people who believe careers should be guided
              by clarity, not guesswork. We operate with transparency,
              accountability, and respect for the people who trust us with their
              futures.
            </p>
          </div>
        </section>

        {/* LINKS GRID */}
        <section className="px-6 pb-32">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
            <Link
              href="/about"
              className="group rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
            >
              <h3 className="text-xl font-semibold mb-2">About Us</h3>
              <p className="text-gray-400 text-sm">
                Learn about our mission, values, and the people behind ForgeTomorrow.
              </p>
            </Link>

            <Link
              href="/careers"
              className="group rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
            >
              <h3 className="text-xl font-semibold mb-2">Careers</h3>
              <p className="text-gray-400 text-sm">
                Explore opportunities to help build a more human career system.
              </p>
            </Link>

            <Link
              href="/press"
              className="group rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
            >
              <h3 className="text-xl font-semibold mb-2">Press Kit</h3>
              <p className="text-gray-400 text-sm">
                Brand assets and company information for media and partners.
              </p>
            </Link>

            <Link
              href="/blog"
              className="group rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
            >
              <h3 className="text-xl font-semibold mb-2">Blog</h3>
              <p className="text-gray-400 text-sm">
                Thoughts, updates, and insights on careers, hiring, and systems.
              </p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
