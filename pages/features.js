// pages/features.js — SYSTEM-LED FEATURES PAGE (FINAL WITH IMAGE WIRING)
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
        <section className="max-w-3xl mb-24">
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
        <section className="mb-32">
          <h2 className="text-3xl font-bold mb-4">Building and refining your career signal</h2>
          <p className="text-gray-300 max-w-3xl mb-10">
            <strong>The Anvil</strong> is where professionals prepare before pressure is applied.
            Profile development, negotiation readiness, and growth planning all live here.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Image src="/images/Profile_Development.png" alt="Profile Development" width={600} height={400} className="rounded-xl" />
            <Image src="/images/Negotiation_Input.png" alt="Negotiation Input" width={600} height={400} className="rounded-xl" />
            <Image src="/images/Pivot_&_Growth.png" alt="Pivot and Growth" width={600} height={400} className="rounded-xl" />
          </div>
        </section>

        {/* HAMMER */}
        <section className="mb-32">
          <h2 className="text-3xl font-bold mb-4">Understanding fit and alignment</h2>
          <p className="text-gray-300 max-w-3xl mb-10">
            <strong>The Forge Hammer</strong> helps users understand alignment with opportunities
            without keyword theater or guessing what systems want to see.
          </p>

          <Image
            src="/images/Forge_Hammer.png"
            alt="Forge Hammer alignment view"
            width={1000}
            height={500}
            className="rounded-xl"
          />
        </section>

        {/* COACHING */}
        <section className="mb-32">
          <h2 className="text-3xl font-bold mb-4">Human support and guidance</h2>
          <p className="text-gray-300 max-w-3xl mb-10">
            Coaches operate inside ForgeTomorrow with transparency, accountability,
            and real tooling for outcomes.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Image src="/images/Agenda.png" alt="Coaching Agenda" width={600} height={400} className="rounded-xl" />
            <Image src="/images/Clients.png" alt="Client Management" width={600} height={400} className="rounded-xl" />
            <Image src="/images/Feedback.png" alt="Coach Feedback" width={600} height={400} className="rounded-xl" />
          </div>
        </section>

        {/* RECRUITERS */}
        <section className="mb-32">
          <h2 className="text-3xl font-bold mb-4">Recruiter interaction and transparency</h2>
          <p className="text-gray-300 max-w-3xl mb-10">
            Recruiters work with explainable tools — not opaque scores or hidden filters.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <Image src="/images/Job_Posting_Builder.png" alt="Job Posting Builder" width={700} height={450} className="rounded-xl" />
            <Image src="/images/Why_This_Candidate.png" alt="Why This Candidate" width={700} height={450} className="rounded-xl" />
          </div>
        </section>

        {/* COMMUNITY */}
        <section className="mb-32">
          <h2 className="text-3xl font-bold mb-4">Community and shared knowledge</h2>
          <p className="text-gray-300 max-w-3xl mb-10">
            <strong>The Hearth</strong> is where discussion, resources, and collaboration live
            without algorithmic distortion.
          </p>

          <Image
            src="/images/Hearth.png"
            alt="The Hearth community"
            width={1000}
            height={500}
            className="rounded-xl"
          />
        </section>

        {/* SIGNAL */}
        <section className="mb-32">
          <h2 className="text-3xl font-bold mb-4">Direct communication</h2>
          <p className="text-gray-300 max-w-3xl mb-10">
            <strong>The Signal</strong> supports intentional, professional one-to-one communication,
            separate from feeds or engagement metrics.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <Image src="/images/Signal.png" alt="Signal Messaging" width={700} height={450} className="rounded-xl" />
            <Image src="/images/Recruiter_Messaging.png" alt="Recruiter Messaging" width={700} height={450} className="rounded-xl" />
          </div>
        </section>

        {/* WHAT THIS IS NOT */}
        <section className="max-w-3xl mb-24">
          <h2 className="text-3xl font-bold mb-6">What this is not</h2>
          <ul className="space-y-3 text-gray-300 text-lg">
            <li>• Not a feed</li>
            <li>• Not an ATS clone</li>
            <li>• Not a data marketplace</li>
            <li>• Not engagement-driven software</li>
          </ul>
        </section>

        {/* EXIT PATHS */}
        <section className="flex gap-6">
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
