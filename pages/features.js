// pages/features.js - SYSTEM-LED FEATURES PAGE (AUTO-ROTATING CAROUSELS, NO LIBS) — UPDATED (HAMMER + HEARTH SHRUNK)
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

function AutoCarousel({
  images = [],
  intervalMs = 3500,
  aspectClass = "aspect-[16/9]",
  maxWidthClass = "max-w-4xl",
}) {
  const safeImages = useMemo(
    () => (Array.isArray(images) ? images.filter(Boolean) : []),
    [images]
  );
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  const count = safeImages.length;

  const go = (next) => {
    if (!count) return;
    setIdx((prev) => {
      const n = typeof next === "number" ? next : prev + next;
      return (n + count) % count;
    });
  };

  useEffect(() => {
    if (count <= 1) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setIdx((prev) => (prev + 1) % count);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, intervalMs]);

  if (!count) return null;

  return (
    <div className={`mx-auto w-full ${maxWidthClass}`}>
      <div
        className={`relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/20 ${aspectClass}`}
      >
        {/* Slides */}
        {safeImages.map((img, i) => (
          <div
            key={img.src}
            className={`absolute inset-0 transition-opacity duration-500 ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== idx}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 768px) 100vw, 900px"
              className="object-contain"
              priority={i === 0}
            />
          </div>
        ))}

        {/* Controls (only if multiple) */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 px-3 py-2 text-white hover:bg-black/55"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 px-3 py-2 text-white hover:bg-black/55"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {count > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {safeImages.map((img, i) => (
            <button
              key={img.src + i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition ${
                i === idx ? "bg-[#FF7043]" : "bg-white/25 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
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

          <AutoCarousel
            images={[
              { src: "/images/Profile_Development.png", alt: "Profile Development" },
              { src: "/images/Negotiation_Input.png", alt: "Negotiation Input" },
              { src: "/images/Pivot_&_Growth.png", alt: "Pivot and Growth" },
            ]}
            intervalMs={3600}
            aspectClass="aspect-[16/9]"
            maxWidthClass="max-w-5xl"
          />
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

          {/* Shrunk to match cinematic consistency */}
          <AutoCarousel
            images={[{ src: "/images/Forge_Hammer.png", alt: "Forge Hammer alignment view" }]}
            intervalMs={4000}
            aspectClass="aspect-[16/9]"
            maxWidthClass="max-w-3xl"
          />
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

          <AutoCarousel
            images={[
              { src: "/images/Agenda.png", alt: "Coaching Agenda" },
              { src: "/images/Clients.png", alt: "Client Management" },
              { src: "/images/Feedback.png", alt: "Coach Feedback" },
            ]}
            intervalMs={3600}
            aspectClass="aspect-[16/9]"
            maxWidthClass="max-w-5xl"
          />
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

          <AutoCarousel
            images={[
              { src: "/images/Job_Posting_Builder.png", alt: "Job Posting Builder" },
              { src: "/images/Why_This_Candidate.png", alt: "Why This Candidate" },
            ]}
            intervalMs={4200}
            aspectClass="aspect-[16/9]"
            maxWidthClass="max-w-5xl"
          />
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

          {/* Shrunk to match Forge Hammer */}
          <AutoCarousel
            images={[{ src: "/images/Hearth.png", alt: "The Hearth community" }]}
            aspectClass="aspect-[16/9]"
            maxWidthClass="max-w-3xl"
          />
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

          <AutoCarousel
            images={[
              { src: "/images/Signal.png", alt: "Signal Messaging" },
              { src: "/images/Recruiter_Messaging.png", alt: "Recruiter Messaging" },
            ]}
            intervalMs={4200}
            aspectClass="aspect-[16/9]"
            maxWidthClass="max-w-5xl"
          />
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
