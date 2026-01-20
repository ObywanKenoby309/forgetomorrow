// pages/legal.js
import Head from 'next/head';
import Link from 'next/link';

export default function LegalHub() {
  return (
    <>
      <Head>
        <title>Legal | ForgeTomorrow</title>
        <meta
          name="description"
          content="ForgeTomorrow’s legal commitments, policies, and protections."
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
              Transparency · Accountability · Safety
            </div>

            <h1 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight">
              Legal
            </h1>

            <p className="mt-4 text-lg md:text-xl text-gray-200 leading-relaxed">
              Clear policies. No hidden clauses. Respect for users and data.
            </p>
          </div>
        </section>

        {/* PHILOSOPHY */}
        <section className="px-6 pb-10">
          <div className="max-w-3xl mx-auto text-left text-gray-200 leading-relaxed">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-7">
              <p className="text-base md:text-[17px]">
                ForgeTomorrow is committed to legal compliance, data protection,
                and responsible platform governance.
                Our policies are written to be readable, enforceable,
                and aligned with human dignity — not buried behind complexity.
              </p>
            </div>
          </div>
        </section>

        {/* LINKS */}
        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
            <Link href="/privacy" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition">
              <h3 className="text-xl font-semibold mb-2">Privacy Policy</h3>
              <p className="text-gray-300 text-sm">
                How we collect, use, and protect personal data.
              </p>
            </Link>

            <Link href="/terms" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition">
              <h3 className="text-xl font-semibold mb-2">Terms of Service</h3>
              <p className="text-gray-300 text-sm">
                The rules that govern platform use, written plainly.
              </p>
            </Link>

            <Link href="/community-guidelines" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition">
              <h3 className="text-xl font-semibold mb-2">Community Guidelines</h3>
              <p className="text-gray-300 text-sm">
                Standards that protect users and promote respectful conduct.
              </p>
            </Link>

            <Link href="/security" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition">
              <h3 className="text-xl font-semibold mb-2">Security</h3>
              <p className="text-gray-300 text-sm">
                How we safeguard infrastructure, access, and data integrity.
              </p>
            </Link>

            <Link href="/accessibility" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition">
              <h3 className="text-xl font-semibold mb-2">Accessibility</h3>
              <p className="text-gray-300 text-sm">
                Our commitment to inclusive and usable design.
              </p>
            </Link>

            <Link href="/tracking-policy" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition">
              <h3 className="text-xl font-semibold mb-2">Tracking & Cookies</h3>
              <p className="text-gray-300 text-sm">
                What we track, what we don’t, and why.
              </p>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
