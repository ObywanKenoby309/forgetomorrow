// pages/features.js - SYSTEM-LED FEATURES PAGE (AUTO-ROTATING CAROUSELS, NO LIBS, SLOW TIMING)
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

function AutoCarousel({
  images = [],
  intervalMs = 8000,
  aspectClass = "aspect-[16/9]",
  maxWidthClass = "max-w-5xl",
}) {
  const safeImages = useMemo(
    () => (Array.isArray(images) ? images.filter(Boolean) : []),
    [images]
  );

  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const timerRef = useRef(null);
  const pausedRef = useRef(false);

  const count = safeImages.length;

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startTimer = () => {
    if (count <= 1) return;
    clearTimer();

    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setIdx((prev) => (prev + 1) % count);
      setProgressKey((k) => k + 1);
    }, intervalMs);
  };

  const pauseOn = () => {
    pausedRef.current = true;
    setPaused(true);
  };

  const pauseOff = () => {
    pausedRef.current = false;
    setPaused(false);
  };

  const go = (delta) => {
    if (!count) return;
    setIdx((prev) => {
      const n = prev + delta;
      return (n + count) % count;
    });
    setProgressKey((k) => k + 1);
  };

  // Keep idx valid if image list changes
  useEffect(() => {
    if (!count) return;
    setIdx((prev) => Math.min(prev, count - 1));
  }, [count]);

  useEffect(() => {
    startTimer();
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, intervalMs]);

  if (!count) return null;

  const active = safeImages[idx];

  return (
    <div className={`mx-auto w-full ${maxWidthClass}`}>
      <div
        aria-live="polite"
        className={`relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/25 ${aspectClass}`}
        onMouseEnter={pauseOn}
        onMouseLeave={pauseOff}
        onPointerDown={pauseOn}
        onPointerUp={pauseOff}
        onPointerCancel={pauseOff}
      >
        {/* Ambient glow (subtle, cinematic) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 500px at 50% 70%, rgba(255,112,67,0.18), rgba(0,0,0,0) 60%)",
            opacity: 0.9,
            filter: "blur(10px)",
          }}
        />
        <div
          className={`pointer-events-none absolute inset-0 ft-glow ${paused ? "ft-paused" : ""}`}
          style={{
            mixBlendMode: "screen",
          }}
          aria-hidden="true"
        />

        {/* Slides */}
        {safeImages.map((img, i) => {
          const isActive = i === idx;

          return (
            <div
              key={`${img.src}-${i}`}
              className={`absolute inset-0 transition-opacity duration-700 ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={!isActive}
            >
              {/* Motion wrapper (Ken Burns + float) */}
              <div
                className={`absolute inset-0 ft-motion ${paused ? "ft-paused" : ""} ${
                  isActive ? "ft-motion-active" : ""
                }`}
                style={
                  isActive
                    ? {
                        animationDuration: `${intervalMs}ms`,
                      }
                    : undefined
                }
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

              {/* Caption */}
              <div
                className={`pointer-events-none absolute left-0 right-0 bottom-0 px-4 pb-4 pt-10 ft-caption ${
                  isActive ? "ft-caption-active" : ""
                } ${paused ? "ft-paused" : ""}`}
              >
                <div
                  className="mx-auto max-w-3xl rounded-lg border border-white/10 bg-black/45 px-4 py-3 text-sm text-gray-100"
                  style={{
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                  }}
                >
                  {img.alt}
                </div>
              </div>
            </div>
          );
        })}

        {/* Controls */}
        {count > 1 && (
          <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/45 px-3 py-2 text-white hover:bg-black/60"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/45 px-3 py-2 text-white hover:bg-black/60"
            >
              ›
            </button>
          </>
        )}

        {/* Progress bar (pauses on hover/press) */}
        {count > 1 && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              key={`${progressKey}-${idx}`}
              className={`h-full ft-progress ${paused ? "ft-paused" : ""}`}
              style={{
                animationDuration: `${intervalMs}ms`,
              }}
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Dots */}
      {count > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {safeImages.map((img, i) => (
            <button
              key={`${img.src}-${i}-dot`}
              type="button"
              onClick={() => {
                setIdx(i);
                setProgressKey((k) => k + 1);
              }}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition ${
                i === idx ? "bg-[#FF7043]" : "bg-white/25 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Local styles for cinematic motion (no libs) */}
      <style jsx>{`
        .ft-paused {
          animation-play-state: paused !important;
        }

        .ft-glow {
          opacity: 0.9;
          background: radial-gradient(
            700px 360px at 50% 65%,
            rgba(255, 112, 67, 0.22),
            rgba(255, 112, 67, 0) 65%
          );
          animation: ftGlowPulse 6.5s ease-in-out infinite;
        }

        .ft-motion {
          will-change: transform;
          transform: translate3d(0, 0, 0) scale(1);
        }

        .ft-motion-active {
          animation-name: ftKenBurns;
          animation-timing-function: ease-in-out;
          animation-fill-mode: both;
        }

        .ft-caption {
          opacity: 0;
          transform: translate3d(0, 10px, 0);
          transition: opacity 550ms ease, transform 550ms ease;
        }

        .ft-caption-active {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }

        .ft-progress {
          width: 100%;
          transform-origin: left center;
          background: rgba(255, 112, 67, 0.9);
          transform: scaleX(0);
          animation-name: ftProgress;
          animation-timing-function: linear;
          animation-fill-mode: both;
        }

        @keyframes ftProgress {
          0% {
            transform: scaleX(0);
          }
          100% {
            transform: scaleX(1);
          }
        }

        @keyframes ftKenBurns {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          45% {
            transform: translate3d(0, -6px, 0) scale(1.03);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1.02);
          }
        }

        @keyframes ftGlowPulse {
          0%,
          100% {
            opacity: 0.55;
          }
          50% {
            opacity: 0.95;
          }
        }
      `}</style>
    </div>
  );
}

export default function Features() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow - How the Forge Works</title>
        <meta
          name="description"
          content="See how ForgeTomorrow's tools work together to help professionals, recruiters, and coaches make better career and hiring decisions."
        />
      <style>{`.skip-link{position:absolute;left:16px;top:-48px;background:#FF7043;color:#fff;padding:12px 16px;border-radius:8px;z-index:9999;text-decoration:none;font-weight:700}.skip-link:focus{top:16px}*:focus-visible{outline:3px solid #FFB199;outline-offset:3px}@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}`}</style></Head>

      <main id="main-content" className="mx-auto max-w-6xl px-6 py-20 text-gray-100">
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
        How ForgeTomorrow
        <br />
        <span className="text-[#F07F52]">
          works.
        </span>
      </h1>

      <p className="mt-10 max-w-3xl mx-auto text-xl leading-9 text-slate-300">
        Every tool works together to help you build your career,
        find opportunities, hire great people, and make better decisions.
      </p>

    </div>
  </div>
</section>

        {/* ANVIL */}
        <section className="mb-32 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Show employers <span className="text-[#FF7043]">what you can do</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto mb-10">
            <strong className="text-[#FF7043]">The Anvil</strong> helps you build
            your profile, prepare to negotiate job offers, and plan your next
            career move.
          </p>

          <AutoCarousel
            images={[
              { src: "/images/Profile_Development.png", alt: "Profile Development" },
              { src: "/images/Negotiation_Input.png", alt: "Negotiation Input" },
              { src: "/images/Pivot_&_Growth.png", alt: "Pivot and Growth" },
            ]}
            intervalMs={9000}
            aspectClass="aspect-[16/9]"
            maxWidthClass="max-w-5xl"
          />
        </section>

        {/* HAMMER */}
        <section className="mb-32 text-center">
          <h2 className="text-3xl font-bold mb-4">
            See how well you <span className="text-[#FF7043]">match a job</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto mb-10">
            <strong className="text-[#FF7043]">The Forge Hammer</strong> shows how
            well you match a job, explains why, and suggests ways to improve your
            match—without guessing which words to put on your resume.
          </p>

          {/* Slightly smaller for consistency */}
          <AutoCarousel
            images={[{ src: "/images/Forge_Hammer.png", alt: "Forge Hammer alignment view" }]}
            intervalMs={9000}
            aspectClass="aspect-[16/9]"
            maxWidthClass="max-w-4xl"
          />
        </section>

        {/* COACHING */}
        <section className="mb-32 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Human support and <span className="text-[#FF7043]">guidance</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto mb-10">
            Coaches can schedule sessions, give feedback, track progress, and help
            clients reach their goals—all in one place.
          </p>

          <AutoCarousel
            images={[
              { src: "/images/Target_Strategy.png", alt: "Target Strategy" },
			  { src: "/images/Feedback.png", alt: "Coach Feedback" },
			  { src: "/images/Agenda.png", alt: "Coaching Agenda" },
			  { src: "/images/Clients.png", alt: "Client Management" },
            ]}
            intervalMs={9500}
            aspectClass="aspect-[16/9]"
            maxWidthClass="max-w-5xl"
          />
        </section>

        {/* RECRUITERS */}
        <section className="mb-32 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Hiring with <span className="text-[#FF7043]">confidence</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto mb-10">
            Recruiters can see why a candidate is a good fit instead of relying
            on hidden scores or keyword matching.
          </p>

          <AutoCarousel
            images={[
              { src: "/images/Job_Posting_Builder.png", alt: "Job Posting Builder" },
              { src: "/images/Why_This_Candidate.png", alt: "Why This Candidate" },
            ]}
            intervalMs={9500}
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
            <strong className="text-[#FF7043]">The Hearth</strong> is a place to
            ask questions, share ideas, and learn from other professionals—without
            endless scrolling or social media distractions.
          </p>

          {/* Smaller to match Hammer */}
          <AutoCarousel
            images={[{ src: "/images/Hearth.png", alt: "The Hearth community" }]}
            intervalMs={9000}
            aspectClass="aspect-[16/9]"
            maxWidthClass="max-w-4xl"
          />
        </section>

        {/* SIGNAL */}
        <section className="mb-32 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Direct <span className="text-[#FF7043]">communication</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto mb-10">
            <strong className="text-[#FF7043]">The Signal</strong> lets you send
            private messages to coaches, recruiters, and other professionals
            without social media noise.
          </p>

          <AutoCarousel
            images={[
              { src: "/images/Signal.png", alt: "Signal Messaging" },
              { src: "/images/Recruiter_Messaging.png", alt: "Recruiter Messaging" },
            ]}
            intervalMs={9500}
            aspectClass="aspect-[16/9]"
            maxWidthClass="max-w-5xl"
          />
        </section>

        {/* WHAT THIS IS NOT */}
        <section className="max-w-3xl mx-auto mb-24 text-center">
          <h2 className="text-3xl font-bold mb-6">What this is not</h2>
          <ul className="space-y-3 text-gray-300 text-lg flex flex-col items-center">
            <li>• Not a feed</li>
            <li>• Not another hiring system that hides how decisions are made</li>
            <li>• Not a data marketplace</li>
            <li>• Not built to keep you scrolling</li>
          </ul>
        </section>

        {/* EXIT PATHS */}
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
