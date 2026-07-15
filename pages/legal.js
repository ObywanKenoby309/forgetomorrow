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
<section className="relative overflow-hidden -mt-20 mb-24">
  <div
    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
    style={{
      backgroundImage: "url('/images/forge-bg-bw.png')",
    }}
  />

  <div className="absolute inset-0 bg-black/65" />

  <div
    className="absolute inset-0"
    style={{
      background:
        "radial-gradient(circle at 50% 20%, rgba(255,112,67,.12), transparent 60%)",
    }}
  />

  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-[#070B12]" />

  <div className="relative mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-6 py-24 sm:px-8 lg:px-10">
    <div className="max-w-5xl text-center">

      <h1 className="text-6xl font-black tracking-tight text-white sm:text-7xl lg:text-8xl">
        Legal
      </h1>

      <p className="mt-10 max-w-3xl mx-auto text-xl leading-9 text-slate-300">
        Clear policies. No hidden clauses. Respect for users and data.
      </p>

    </div>
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
