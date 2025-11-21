// pages/about.tsx ← CLEAN, FINAL, READY TO SHIP
import Link from "next/link";

export default function About() {
  return (
    <>
      {/* Hero – bulletproof CSS background */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/forge-bg-bw.png')" }}
      >
        <div className="absolute inset-0 bg-black/70" aria-hidden="true" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-tight">
            This isn’t about us.
            <br />
            <span className="text-[#FF7043]">It’s about you.</span>
          </h1>

          <p className="text-xl md:text-2xl lg:text-3xl text-gray-200 leading-relaxed max-w-4xl mx-auto">
            Every feature on ForgeTomorrow was built by people who’ve been unemployed,
            underpaid, ghosted, desperate, and written off.
            We know exactly what it feels like when the tools that are supposed to help
            are locked behind a paywall you can’t afford.
          </p>
        </div>
      </section>

      {/* The vow – honest, human, signed */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 space-y-12 text-lg md:text-xl leading-relaxed">
          <h2 className="text-4xl md:text-5xl font-black text-[#FF7043]">
            So we made a promise.
          </h2>

          <p className="text-gray-800">
            If you’re fighting to feed your family, rebuilding after a layoff, or just trying to get your first real shot —
            the <strong>core tools will always have a completely free tier</strong> you can actually use.
            No credit card. No “3-day trial.” No bait-and-switch.
          </p>

          <p className="text-gray-800">
            Yes, there are generous limits on the free plan (3 résumés per month, 5 job-tracker entries per day, etc.).
            Those limits exist so the platform stays alive and fast for everyone.
          </p>

          <p className="text-gray-800">
            When someone upgrades to Seeker Pro, they unlock unlimited use and extra power tools.
            That paid tier is what keeps the forge burning for the people who can’t pay right now.
          </p>

          <p className="text-gray-800">
            We’ve read your posts.  
            We've heard your struggle and frustrations.  
            That ends here — not because everything is unlimited for free (we’re not a charity),
            but because <strong>no one will ever be locked out when they need help the most</strong>.
          </p>

          <div className="py-12 bg-gray-50 rounded-2xl px-8">
            <blockquote className="text-2xl md:text-3xl font-bold text-gray-900 italic">
              “This isn’t charity. This is industry course correction.”
            </blockquote>
          </div>

          <p className="text-gray-800">
            This is teamwork — seekers, coaches, recruiters, and our team — changing the old way together.
            The legacy platforms forgot the people who need help the most.
            We never will.
          </p>

          <p className="text-gray-800 font-bold text-[#FF7043] text-2xl md:text-3xl">
            The forge is hot.  
            Walk in. Pick up the hammer.  
            We’ll keep the fire burning as long as it takes.
          </p>

          {/* Signed */}
          <div className="mt-20 pt-12 border-t border-gray-200 text-center">
            <p className="text-2xl font-bold text-gray-900">— Eric James</p>
            <p className="text-lg text-gray-600 mt-2">Founder & CEO, ForgeTomorrow</p>
            <p className="text-base text-gray-500 mt-6 max-w-2xl mx-auto">
              I've read the same stories you have of how many we've lost to the struggle. 
              I will never let this place become another wall someone can’t climb.  
              That’s my word.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-[#FF7043]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8">
            Ready to forge your tomorrow?
          </h2>
          <Link
            href="/pricing"
            className="inline-block bg-white text-[#FF7043] font-bold text-xl px-12 py-6 rounded-full hover:bg-gray-100 transition shadow-xl"
          >
            Get started with us
          </Link>
        </div>
      </section>
    </>
  );
}