// pages/features.js - SYSTEM-LED FEATURES PAGE (AUTO-SCROLLING IMAGE MARQUEES)
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

function Marquee({ items, heightClass = "h-[260px]", speedSeconds = 28 }) {
  // Duplicate items so the loop is seamless
  const loop = [...items, ...items];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[10px]">
      {/* subtle edge fade */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0f0f0f] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0f0f0f] to-transparent z-10" />

      <div
        className="flex w-max gap-6 px-6 py-6 ft-marquee"
        style={{ ["--ft-speed"]: `${speedSeconds}s` }}
      >
        {loop.map((src, idx) => (
          <div
            key={`${src}-${idx}`}
            className={`shrink-0 ${heightClass} flex items-center`}
          >
            <Image
              src={src}
              alt=""
              width={1200}
              height={800}
              className={`rounded-xl ${heightClass} w-auto object-contain shadow-[0_10px_30px_rgba(0,0,0,0.35)]`}
              priority={idx < items.length}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow — How the Forge Works</title>
        <meta
          name="description"
          content="ForgeTomorrow is a connected system of capabilities designed to help people build clarity, understand alignment, and move forward with intent."
        />
      </Head>

      <main className="mx-auto max-w-6xl px-6 py-20 text-gray-100">
        {/* INTRO (CENTERED + ORANGE KEYWORDS) */}
        <section className="max-w-3xl mx-auto mb-24 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
            How the <span className="text-[#FF7043]">Forge</span> works as a{" "}
            <span className="text-[#FF7043]">system</span>
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            ForgeTomorrow is not a collection of disconnected tools. It is a{" "}
            <span className="text-[#FF7043] font-semibold">connected system</span>{" "}
            designed to help people build{" "}
            <span className="text-[#FF7043] font-semibold">clarity</span>,
            understand{" "}
            <span className="text-[#FF7043] font-semibold">alignment</span>, and
            move forward with{" "}
            <span className="text-[#FF7043] font-semibold">intent</span>.
          </p>
        </section>

        {/* ANVIL (AUTO-SCROLL) */}
        <section className="mb-32">
          <h2 className="text-3xl font-bold mb-4 text-center md:text-left">
            Building and refining your{" "}
            <span className="text-[#FF7043]">career signal</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mb-10 mx-auto md:mx-0 text-center md:text-left">
            <strong className="text-[#FF7043]">The Anvil</strong> is where
            professionals prepare before pressure is applied. Profile
            development, negotiation readiness, and growth planning all live
            here.
          </p>

          <Marquee
            items={[
              "/images/Profile_Development.png",
              "/images/Negotiation_Input.png",
              "/images/Pivot_&_Growth.png",
            ]}
            heightClass="h-[240px] md:h-[260px]"
            speedSeconds={26}
          />
        </section>

        {/* HAMMER (SINGLE IMAGE, CENTERED) */}
        <section className="mb-32">
          <h2 className="text-3xl font-bold mb-4 text-center md:text-left">
            Understanding{" "}
            <span className="text-[#FF7043]">fit</span> and{" "}
            <span className="text-[#FF7043]">alignment</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mb-10 mx-auto md:mx-0 text-center md:text-left">
            <strong className="text-[#FF7043]">The Forge Hammer</strong> helps
            users understand alignment with opportunities without keyword
            theater or guessing what systems want to see.
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 backdrop-blur-[10px]">
            <Image
              src="/images/Forge_Hammer.png"
              alt="Forge Hammer alignment view"
              width={1200}
              height={650}
              className="rounded-xl w-full h-auto object-contain shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
            />
          </div>
        </section>

        {/* COACHING (AUTO-SCROLL) */}
        <section className="mb-32">
          <h2 className="text-3xl font-bold mb-4 text-center md:text-left">
            <span className="text-[#FF7043]">Human</span> support and guidance
          </h2>
          <p className="text-gray-300 max-w-3xl mb-10 mx-auto md:mx-0 text-center md:text-left">
            Coaches operate inside ForgeTomorrow with{" "}
            <span className="text-[#FF7043] font-semibold">transparency</span>,{" "}
            <span className="text-[#FF7043] font-semibold">accountability</span>,
            and real tooling for outcomes.
          </p>

          <Marquee
            items={[
              "/images/Agenda.png",
              "/images/Clients.png",
              "/images/Feedback.png",
            ]}
            heightClass="h-[240px] md:h-[260px]"
            speedSeconds={28}
          />
        </section>

        {/* RECRUITERS (AUTO-SCROLL) */}
        <section className="mb-32">
          <h2 className="text-3xl font-bold mb-4 text-center md:text-left">
            Recruiter interaction and{" "}
            <span className="text-[#FF7043]">transparency</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mb-10 mx-auto md:mx-0 text-center md:text-left">
            Recruiters work with{" "}
            <span className="text-[#FF7043] font-semibold">explainable</span>{" "}
            tools - not opaque scores or hidden filters.
          </p>

          <Marquee
            items={[
              "/images/Job_Posting_Builder.png",
              "/images/Why_This_Candidate.png",
            ]}
            heightClass="h-[260px] md:h-[280px]"
            speedSeconds={30}
          />
        </section>

        {/* COMMUNITY (SINGLE IMAGE) */}
        <section className="mb-32">
          <h2 className="text-3xl font-bold mb-4 text-center md:text-left">
            Community and{" "}
            <span className="text-[#FF7043]">shared knowledge</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mb-10 mx-auto md:mx-0 text-center md:text-left">
            <strong className="text-[#FF7043]">The Hearth</strong> is where
            discussion, resources, and collaboration live without algorithmic
            distortion.
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 backdrop-blur-[10px]">
            <Image
              src="/images/Hearth.png"
              alt="The Hearth community"
              width={1200}
              height={650}
              className="rounded-xl w-full h-auto object-contain shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
            />
          </div>
        </section>

        {/* SIGNAL (AUTO-SCROLL) */}
        <section className="mb-32">
          <h2 className="text-3xl font-bold mb-4 text-center md:text-left">
            Direct <span className="text-[#FF7043]">communication</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mb-10 mx-auto md:mx-0 text-center md:text-left">
            <strong className="text-[#FF7043]">The Signal</strong> supports
            intentional, professional one-to-one communication, separate from
            feeds or engagement metrics.
          </p>

          <Marquee
            items={["/images/Signal.png", "/images/Recruiter_Messaging.png"]}
            heightClass="h-[260px] md:h-[280px]"
            speedSeconds={32}
          />
        </section>

        {/* WHAT THIS IS NOT (CENTERED) */}
        <section className="max-w-3xl mx-auto mb-24 text-center">
          <h2 className="text-3xl font-bold mb-6">
            What this is <span className="text-[#FF7043]">not</span>
          </h2>
          <ul className="space-y-3 text-gray-300 text-lg flex flex-col items-center">
            <li>• Not a feed</li>
            <li>• Not an ATS clone</li>
            <li>• Not a data marketplace</li>
            <li>• Not engagement-driven software</li>
          </ul>
        </section>

        {/* EXIT PATHS (CENTERED) */}
        <section className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link
            href="/pricing"
            className="rounded-full bg-[#FF7043] px-8 py-4 font-bold text-white hover:bg-[#f46036] transition"
          >
            Enter the Forge
          </Link>
          <Link
            href="/about"
            className="rounded-full border border-white/30 px-8 py-4 font-bold text-gray-100 hover:bg-white/10 transition"
          >
            Our Promise
          </Link>
        </section>
      </main>

      {/* Minimal page-scoped CSS for marquee */}
      <style jsx global>{`
        .ft-marquee {
          animation: ftMarqueeScroll var(--ft-speed, 28s) linear infinite;
          will-change: transform;
        }
        @keyframes ftMarqueeScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ft-marquee {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </>
  );
}
