// pages/careers.js ← FINAL. DO NOT CHANGE. SHIP THIS.
import Head from "next/head";

export default function Careers() {
  return (
    <>
      <Head>
        <title>Careers at ForgeTomorrow</title>
        <meta
          name="description"
          content="We hire from the community first. Then we open the doors. Always transparent. Never ghosts."
        />
      </Head>

      {/* HERO — PURE FIRE + FULLY ACCESSIBLE */}
      <section className="relative min-h-screen flex items-center justify-center px-6 text-center">
        {/* Decorative background — hidden from screen readers */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/anvil-fixed.jpg')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/60" aria-hidden="true" />

        <div className="relative z-10 max-w-5xl mx-auto text-white">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight drop-shadow-2xl">
            We hire from the forge first.
            <br />
            <span className="text-[#FF7043]">Then we open the doors.</span>
          </h1>
          <p className="text-2xl md:text-4xl max-w-4xl mx-auto drop-shadow-lg">
            Every role starts inside the community that helped build this place.
          </p>
        </div>
      </section>

      {/* HOW WE HIRE */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 space-y-16 text-lg md:text-xl leading-relaxed">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-black text-[#FF7043] mb-8">
              How We Hire
            </h2>
            <p className="text-gray-700 max-w-3xl mx-auto">
              ForgeTomorrow is an inclusive, mission-driven team. We grow intentionally with people who live our values.
            </p>
          </div>

          <ol className="space-y-10 text-gray-800">
            <li className="flex gap-6">
              <span className="text-4xl font-black text-[#FF7043]">1</span>
              <div>
                <strong>Community gets the first 48 hours.</strong>
                <br />
                Every opening is posted exclusively to logged-in users on our internal jobs board.
              </div>
            </li>
            <li className="flex gap-6">
              <span className="text-4xl font-black text-[#FF7043]">2</span>
              <div>
                <strong>After 48 hours, the role goes public here.</strong>
                <br />
                Same description. Same process. Same chance for everyone.
              </div>
            </li>
            <li className="flex gap-6">
              <span className="text-4xl font-black text-[#FF7043]">3</span>
              <div>
                <strong>Every applicant gets a response.</strong>
                <br />
                We don’t ghost. You’ll hear from us — yes, no, or not yet — because respect isn’t optional.
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* THE FORGETOMORROW CODE */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-black text-[#FF7043] text-center mb-16">
            The ForgeTomorrow Code
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">People Before Profit</h3>
              <p className="text-gray-700">
                We earn revenue so the job seeker never has to pay when they’re down. That’s the business model — not a side effect.
              </p>
            </div>
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">Ship Iron, Not Promises</h3>
              <p className="text-gray-700">
                We build tools that actually move the needle — no gimmicks, no dark patterns, no smoke and mirrors.
              </p>
            </div>
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">Radical Transparency</h3>
              <p className="text-gray-700">
                We don’t sell your data. We don’t hide how we operate. We don’t misdirect for profit. Ever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NO OPEN ROLES + TALENT FORM */}
      <section className="py-24 bg-[#1a1a1a] text-gray- 100 text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <h2 className="text-4xl md:text-5xl font-black text-[#FF7043]">
            No open roles right now.
          </h2>
          <p className="text-2xl md:text-3xl leading-relaxed text-gray-300">
            When revenue says “go,” the next hammer drops here first.
          </p>

          <div className="mt-12">
            <p className="text-xl mb-6 text-gray-300">Want first notice when we hire?</p>
            <form
              action="https://formspree.io/f/YOUR_FORM_ID_HERE"   // ← put your real Formspree ID here
              method="POST"
              className="max-w-md mx-auto flex flex-col sm:flex-row gap-4"
            >
              <input
                type="email"
                name="email"
                placeholder="you@forge.com"
                required
                className="px-6 py-4 rounded-full text-gray-900 flex-1 focus:outline-none focus:ring-4 focus:ring-[#FF7043]"
              />
              <button
                type="submit"
                className="bg-[#FF7043] hover:bg-[#f46036] text-white font-bold px-8 py-4 rounded-full transition"
              >
                Tell Me When the Bell Rings
              </button>
            </form>
            <p className="mt-8 text-sm text-gray-500">
              Every submission lands instantly in <strong>careers@forgetomorrow.com</strong>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}