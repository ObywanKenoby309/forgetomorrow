// pages/about.tsx ← TOP-SHELF, VALUES-LED, NO CTA PRESSURE
import Image from "next/image";

export default function About() {
  return (
    <>
      {/* HERO */}
      <section
        className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('/images/forge-bg-bw.png')" }}
      >
        <div className="absolute inset-0 bg-black/70" aria-hidden="true" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white leading-tight">
            This isn’t about us.
            <br />
            <span className="text-[#FF7043]">It’s about how you’re treated.</span>
          </h1>

          <p className="mt-10 text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
            ForgeTomorrow was built by people who know what it feels like to be shut out of
            systems that claim to help. We have been unemployed, underpaid, ignored, and told
            to wait while real life kept moving.
          </p>
        </div>
      </section>

      {/* PROMISE BODY */}
      <section className="py-28 bg-white">
        <div className="max-w-3xl mx-auto px-6 space-y-16 text-lg md:text-xl leading-relaxed text-gray-800">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#FF7043]">
            Our promise
          </h2>

          <p>
            You will always be able to use ForgeTomorrow without being trapped behind a
            credit card wall. Core tools will remain accessible without trials, countdowns,
            or bait and switch tactics.
          </p>

          <p>
            The free plan exists because we believe people should not lose access to
            opportunity at the exact moment they need it most.
          </p>

          <p>
            Paid subscriptions expand what is possible. They are how this platform stays
            alive, responsive, and available for those for whom a subscription is not an
            option.
          </p>

          <p>
            We understand that choosing food, rent, or stability should never mean losing
            the ability to rebuild.
          </p>
        </div>
      </section>

      {/* SUBTLE VALUES STRIP */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 space-y-10 text-lg md:text-xl text-gray-800">
          <p>
            We do not sell user data.
          </p>
          <p>
            We do not trade people for ad revenue.
          </p>
          <p>
            We do not hide how decisions are made behind opaque scores or rankings.
          </p>
          <p>
            We use technology to bring clarity, not confusion.
            We design systems that explain themselves so people can move forward with
            confidence.
          </p>
        </div>
      </section>

      {/* COURSE CORRECTION */}
      <section className="py-28 bg-white">
        <div className="max-w-3xl mx-auto px-6 space-y-14 text-lg md:text-xl text-gray-800">
          <blockquote className="text-3xl md:text-4xl font-bold text-gray-900">
            This isn’t charity. This is industry course correction.
          </blockquote>

          <p>
            This is a shared effort. Seekers, coaches, recruiters, and builders working
            inside the same system with aligned incentives. The old platforms optimized for
            extraction and opacity. We are correcting that course.
          </p>

          <p className="font-semibold text-[#FF7043] text-2xl md:text-3xl">
            If this page ever stops being true, then ForgeTomorrow has failed.
          </p>
        </div>
      </section>

      {/* FOUNDER SIGNATURE */}
      <section className="py-28 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-8">
            <Image
              src="/images/headshot-eric.jpg"
              alt="Eric James"
              width={140}
              height={140}
              className="rounded-full"
            />
          </div>

          <p className="text-2xl font-bold text-gray-900">Eric James</p>
          <p className="text-lg text-gray-600 mt-1">
            Founder & CEO, ForgeTomorrow
          </p>

          <p className="mt-10 text-lg md:text-xl text-gray-700 leading-relaxed">
            I have read the same stories you have. I will never let this place become
            another wall someone cannot climb. If it does, it will have lost its reason
            to exist.
          </p>

          <p className="mt-6 font-semibold text-gray-900">
            That is my word.
          </p>
        </div>
      </section>
    </>
  );
}
