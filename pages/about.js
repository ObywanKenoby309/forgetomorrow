// pages/about.tsx ← UPDATED per “Our Promise” final copy + add headshot image
import Link from "next/link";

export default function About() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/forge-bg-bw.png')" }}
      >
        <div className="absolute inset-0 bg-black/70" aria-hidden="true" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm md:text-base tracking-[0.28em] text-gray-300 uppercase mb-6">
            Our Promise
          </p>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-8 leading-tight">
            This is not about us.
            <br />
            <span className="text-[#FF7043] font-semibold">It is about how you are treated here.</span>
          </h1>

          <p className="text-lg md:text-2xl text-gray-200 leading-relaxed max-w-4xl mx-auto">
            Proof over keywords. Clarity over guesswork. Designed to treat people like people.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link
              href="/pricing"
              className="inline-block bg-[#FF7043] hover:bg-[#f46036] text-white font-bold text-lg md:text-xl px-10 py-5 rounded-full shadow-2xl transition focus:outline-none focus:ring-4 focus:ring-[#FF7043] focus:ring-offset-2"
            >
              Enter the Forge
            </Link>
            <Link
              href="/features"
              className="inline-block border-2 border-[#FF7043] text-[#FF7043] hover:bg-[#FF7043] hover:text-white font-bold text-lg md:text-xl px-10 py-5 rounded-full transition focus:outline-none focus:ring-4 focus:ring-[#FF7043] focus:ring-offset-2"
            >
              Explore the Forge
            </Link>
          </div>
        </div>
      </section>

      {/* Promise body */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 space-y-10 text-lg md:text-xl leading-relaxed">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            OUR PROMISE
          </h2>

          <p className="text-gray-800">
            ForgeTomorrow was built by people who know what it feels like to be shut out of systems that claim to help.
            We have been unemployed, underpaid, ignored, and told to wait our turn while bills kept coming.
            We did not forget that experience when we built this platform.
          </p>

          <p className="text-gray-800 font-semibold">
            So we made a promise.
          </p>

          <p className="text-gray-800">
            You will always be able to use ForgeTomorrow without being trapped behind a credit card wall.
            The core tools will remain accessible without trials, countdowns, or bait and switch tactics.
            When someone is trying to survive, rebuild, or take their first real step forward, they will not be locked out here.
          </p>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 space-y-3">
            <p className="text-gray-900 font-semibold">We do not sell user data.</p>
            <p className="text-gray-900 font-semibold">We do not trade people for ad revenue.</p>
            <p className="text-gray-900 font-semibold">
              We do not hide how decisions are made behind opaque scores or rankings.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-gray-800">We use technology to bring clarity, not confusion.</p>
            <p className="text-gray-800">We design systems to explain themselves.</p>
            <p className="text-gray-800">
              We build tools meant to help people move forward, not keep them scrolling.
            </p>
          </div>

          <p className="text-gray-800">
            The free plan exists because we believe people should not lose access to opportunity at the exact moment they need it most.
          </p>

          <p className="text-gray-800">
            Paid subscriptions expand what is possible. They are how this platform stays alive, responsive, and available for those for whom a subscription is not an option.
          </p>

          <p className="text-gray-800">
            We understand that choosing food, rent, or stability should never mean losing the ability to rebuild.
          </p>

          <p className="text-gray-800">
            This is a shared effort. Seekers, coaches, recruiters, and builders working inside the same system with aligned incentives.
            The old platforms optimized for extraction and opacity. We are correcting that course.
          </p>

          <div className="rounded-2xl bg-black text-white p-8">
            <p className="text-2xl md:text-3xl font-bold">
              If this page ever stops being true, then we have failed.
            </p>
          </div>

          <p className="text-gray-800">
            My name is Eric James, and I am responsible for keeping this promise intact.
            If ForgeTomorrow ever becomes another wall someone cannot climb, then it will have lost its reason to exist.
          </p>

          <p className="text-gray-900 font-semibold text-xl md:text-2xl">
            That is my word.
          </p>

          {/* Signature */}
          <div className="mt-14 pt-10 border-t border-gray-200 text-center">
            <div className="mx-auto w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border border-gray-200 shadow-sm">
              <img
                src="/images/headshot-eric.jpg"
                alt="Eric James"
                className="w-full h-full object-cover"
              />
            </div>

            <p className="mt-6 text-2xl font-bold text-gray-900">Eric James</p>
            <p className="text-lg text-gray-600 mt-2">Founder & CEO, ForgeTomorrow</p>
          </div>
        </div>
      </section>

      {/* Quiet footer CTA */}
      <section className="py-16 bg-[#0f0f0f] text-gray-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-2xl md:text-3xl font-extrabold mb-5">
            Ready to step in?
          </h3>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto">
            Start with the path that fits you. The system will be here when you need it.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link
              href="/pricing"
              className="inline-block bg-[#FF7043] hover:bg-[#f46036] text-white font-bold text-lg md:text-xl px-10 py-5 rounded-full shadow-2xl transition focus:outline-none focus:ring-4 focus:ring-[#FF7043] focus:ring-offset-2"
            >
              Enter the Forge
            </Link>
            <Link
              href="/features"
              className="inline-block border-2 border-white/25 text-gray-100 hover:border-white/50 hover:bg-white/5 font-bold text-lg md:text-xl px-10 py-5 rounded-full transition focus:outline-none focus:ring-4 focus:ring-white focus:ring-offset-2"
            >
              Explore the Forge
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
