// pages/features.js - SYSTEM-LED FEATURES PAGE (FINAL WITH IMAGE WIRING + SCROLLING ROWS)
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

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
        {/* INTRO */}
        <section className="max-w-3xl mx-auto mb-24 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
            How the Forge works as a system
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            ForgeTomorrow is not a collection of disconnected tools. It is a
            system designed to help people build clarity, understand alignment,
            and move forward with intent.
          </p>
        </section>

        {/* ANVIL */}
        <section className="mb-32 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Building and refining your career{" "}
            <span className="text-[#FF7043]">signal</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto mb-10">
            <strong className="text-[#FF7043]">The Anvil</strong> is where
            professionals prepare before pressure is applied. Profile
            development, negotiation readiness, and growth planning all live
            here.
          </p>

          {/* Desktop grid + Mobile horizontal scroll */}
          <div className="md:grid md:grid-cols-3 md:gap-6 flex gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-3 -mx-6 px-6 md:mx-0 md:px-0 justify-start md:justify-center">
            {[
              {
                src: "/images/Profile_Development.png",
                alt: "Profile Development",
              },
              { src: "/images/Negotiation_Input.png", alt: "Negotiation Input" },
              { src: "/images/Pivot_&_Growth.png", alt: "Pivot and Growth" },
            ].map((img) => (
              <div
                key={img.src}
                className="snap-center shrink-0 w-[88%] sm:w-[70%] md:w-auto"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={600}
                  height={400}
                  className="rounded-xl w-full h-auto"
                />
              </div>
            ))}
          </div>
        </section>

        {/* HAMMER */}
        <section className="mb-32 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Understanding fit and{" "}
            <span className="text-[#FF7043]">alignment</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto mb-10">
            <strong className="text-[#FF7043]">The Forge Hammer</strong> helps
            users understand alignment with opportunities without keyword theater
            or guessing what systems want to see.
          </p>

          <div className="flex justify-center">
            <Image
              src="/images/Forge_Hammer.png"
              alt="Forge Hammer alignment view"
              width={1000}
              height={500}
              className="rounded-xl w-full h-auto max-w-4xl"
            />
          </div>
        </section>

        {/* COACHING */}
        <section className="mb-32 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Human support and{" "}
            <span className="text-[#FF7043]">guidance</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto mb-10">
            Coaches operate inside ForgeTomorrow with transparency,
            accountability, and real tooling for outcomes.
          </p>

          {/* Desktop grid + Mobile horizontal scroll */}
          <div className="md:grid md:grid-cols-3 md:gap-6 flex gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-3 -mx-6 px-6 md:mx-0 md:px-0 justify-start md:justify-center">
            {[
              { src: "/images/Agenda.png", alt: "Coaching Agenda" },
              { src: "/images/Clients.png", alt: "Client Management" },
              { src: "/images/Feedback.png", alt: "Coach Feedback" },
            ].map((img) => (
              <div
                key={img.src}
                className="snap-center shrink-0 w-[88%] sm:w-[70%] md:w-auto"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={600}
                  height={400}
                  className="rounded-xl w-full h-auto"
                />
              </div>
            ))}
          </div>
        </section>

        {/* RECRUITERS */}
        <section className="mb-32 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Recruiter interaction and{" "}
            <span className="text-[#FF7043]">transparency</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto mb-10">
            Recruiters work with explainable tools - not opaque scores or hidden
            filters.
          </p>

          {/* Desktop grid + Mobile horizontal scroll */}
          <div className="md:grid md:grid-cols-2 md:gap-6 flex gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-3 -mx-6 px-6 md:mx-0 md:px-0 justify-start md:justify-center">
            {[
              {
                src: "/images/Job_Posting_Builder.png",
                alt: "Job Posting Builder",
                w: 700,
                h: 450,
              },
              {
                src: "/images/Why_This_Candidate.png",
                alt: "Why This Candidate",
                w: 700,
                h: 450,
              },
            ].map((img) => (
              <div
                key={img.src}
                className="snap-center shrink-0 w-[92%] sm:w-[75%] md:w-auto"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={img.w}
                  height={img.h}
                  className="rounded-xl w-full h-auto"
                />
              </div>
            ))}
          </div>
        </section>

        {/* COMMUNITY */}
        <section className="mb-32 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Community and shared{" "}
            <span className="text-[#FF7043]">knowledge</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto mb-10">
            <strong className="text-[#FF7043]">The Hearth</strong> is where
            discussion, resources, and collaboration live without algorithmic
            distortion.
          </p>

          <div className="flex justify-center">
            <Image
              src="/images/Hearth.png"
              alt="The Hearth community"
              width={1000}
              height={500}
              className="rounded-xl w-full h-auto max-w-4xl"
            />
          </div>
        </section>

        {/* SIGNAL */}
        <section className="mb-32 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Direct <span className="text-[#FF7043]">communication</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto mb-10">
            <strong className="text-[#FF7043]">The Signal</strong> supports
            intentional, professional one-to-one communication, separate from
            feeds or engagement metrics.
          </p>

          {/* Desktop grid + Mobile horizontal scroll */}
          <div className="md:grid md:grid-cols-2 md:gap-6 flex gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-3 -mx-6 px-6 md:mx-0 md:px-0 justify-start md:justify-center">
            {[
              { src: "/images/Signal.png", alt: "Signal Messaging", w: 700, h: 450 },
              {
                src: "/images/Recruiter_Messaging.png",
                alt: "Recruiter Messaging",
                w: 700,
                h: 450,
              },
            ].map((img) => (
              <div
                key={img.src}
                className="snap-center shrink-0 w-[92%] sm:w-[75%] md:w-auto"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={img.w}
                  height={img.h}
                  className="rounded-xl w-full h-auto"
                />
              </div>
            ))}
          </div>
        </section>

        {/* WHAT THIS IS NOT (CENTERED) */}
        <section className="max-w-3xl mx-auto mb-24 text-center">
          <h2 className="text-3xl font-bold mb-6">What this is not</h2>
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
            className="rounded-full bg-[#FF7043] px-8 py-4 font-bold text-white"
          >
            Enter the Forge
          </Link>
          <Link
            href="/about"
            className="rounded-full border border-white/30 px-8 py-4 font-bold text-gray-100"
          >
            Our Promise
          </Link>
        </section>
      </main>
    </>
  );
}
