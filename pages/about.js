// pages/about.tsx ← THE BATTLE CRY. RAW. HUMAN. REAL.
import Image from "next/image";

export default function About() {
  return (
    <>
      {/* HERO */}
      <section
        className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('/images/forge-bg-bw.png')" }}
      >
        <div className="absolute inset-0 bg-black/75" aria-hidden="true" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
            This isn't about us.
          </h1>

          <p className="mt-8 text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            It's about how you're{" "}
            <span className="text-[#FF7043]">treated</span>.
          </p>

          <p className="mt-10 text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            ForgeTomorrow was built by people who know what it feels like to be shut out of
            systems that claim to help. We have been unemployed, underpaid, ignored, and told
            to wait while real life kept moving.
          </p>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="py-28 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-6 space-y-12 text-lg md:text-xl leading-relaxed">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#FF7043]">
            Our story
          </h2>

          <p>
            One day, I got a notification on a professional networking platform. It was a post that changed everything.
          </p>

          <p className="text-3xl md:text-4xl font-bold text-[#FF7043] italic">
            "We lost another to the job search."
          </p>

          <p>
            A man had taken his own life after two years of trying to find his next position so he could provide for his family.
            Two years of using all the tools and resources currently on the market.
            Two years of nothing working.
          </p>

          <p>
            What broke me wasn't just his story of desperation and hopelessness.
          </p>

          <p className="text-2xl md:text-3xl font-bold text-white">
            It was the word <span className="text-[#FF7043]">"another."</span>
          </p>

          <p>
            As if this was now our new normal. As if we should just accept it.
          </p>

          <div className="border-l-4 border-[#FF7043] pl-8 my-12">
            <p>
              I had already spent three weeks applying to hundreds of jobs myself.
              I was ghosted or rejected in minutes by the same automated systems I'd been told were designed to help us all.
            </p>

            <p className="mt-6">
              I told my wife about it. She asked me a question that changed my life:
            </p>

            <p className="text-2xl md:text-3xl font-bold text-[#FF7043] mt-4">
              "If it's that broken, why don't you fix it?"
            </p>

            <p className="mt-6">
              Later that day, she told me she was pregnant.
            </p>
          </div>

          <p className="text-2xl md:text-3xl font-bold text-white">
            That day, I sat down and wrote my first line of code.
          </p>

          <p className="mt-8">
            I built ForgeTomorrow alone. Front stack to API. Seven months.
            Because I couldn't bring a child into a world where people are discarded like this.
            Where good people trying to survive get broken by systems that claim to help them.
          </p>

          <p className="text-xl md:text-2xl font-semibold text-gray-300">
            This isn't a business idea. This is the only path forward I was given.
          </p>
        </div>
      </section>

      {/* THE LINE */}
      <section className="py-32 bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 space-y-16">
          <h2 className="text-5xl md:text-6xl font-extrabold text-[#FF7043] text-center">
            We draw a line.
          </h2>

          <div className="grid md:grid-cols-2 gap-12 text-lg md:text-xl">
            <div className="space-y-6 opacity-60">
              <p className="font-bold text-2xl text-gray-400">On one side:</p>
              <p>Platforms that profit from your desperation.</p>
              <p>That keep you scrolling while your life falls apart.</p>
              <p>That blame you for their broken algorithms.</p>
            </div>

            <div className="space-y-6">
              <p className="font-bold text-2xl text-[#FF7043]">On the other side:</p>
              <p>A system built by someone who lived what you're living.</p>
              <p>
                Who cried for the man who gave up and for the rest of us looking for support when we need it most.
              </p>
              <p>Who knows what it feels like to be invisible.</p>
            </div>
          </div>

          <div className="text-center mt-20 space-y-8">
            <p className="text-3xl md:text-4xl font-extrabold text-white">
              ForgeTomorrow is not a company trying to help you.
            </p>
            <p className="text-3xl md:text-4xl font-extrabold text-[#FF7043]">
              We are one of you. And we built the answer.
            </p>
          </div>
        </div>
      </section>

      {/* PROMISE */}
      <section className="py-28 bg-white">
        <div className="max-w-3xl mx-auto px-6 space-y-16 text-lg md:text-xl leading-relaxed text-gray-800">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#FF7043]">
            Our promise
          </h2>

          <p>
            You will always be able to use ForgeTomorrow without being trapped behind a credit card wall.
            Core tools will remain accessible without trials, countdowns, or bait and switch tactics.
          </p>

          <p>
            The free plan exists because we believe people should not lose access to opportunity at the exact moment they need it most.
          </p>

          <p>
            Paid subscriptions expand what is possible.
            They are how this platform stays alive, responsive, and available for those for whom a subscription is not an option.
          </p>

          <p>
            We understand that choosing food, rent, or stability should never mean losing the ability to rebuild.
          </p>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 space-y-10 text-lg md:text-xl text-gray-800">
          <p className="font-semibold text-2xl text-gray-900">We do not sell user data.</p>
          <p className="font-semibold text-2xl text-gray-900">We do not trade people for ad revenue.</p>
          <p className="font-semibold text-2xl text-gray-900">
            We do not hide how decisions are made behind opaque scores or rankings.
          </p>

          <p className="mt-8">
            We use technology to bring clarity, not confusion.
            We design systems that explain themselves so people can move forward with confidence.
          </p>
        </div>
      </section>

      {/* COURSE CORRECTION */}
      <section className="py-28 bg-white">
        <div className="max-w-3xl mx-auto px-6 space-y-14 text-lg md:text-xl text-gray-800">
          <blockquote className="text-3xl md:text-4xl font-bold text-gray-900">
            This isn't charity. This is industry course correction.
          </blockquote>

          <p>
            This is a shared effort.
            Seekers, coaches, recruiters, and builders working inside the same system with aligned incentives.
            The old platforms optimized for extraction and opacity.
            We are correcting that course.
          </p>

          <p className="text-3xl md:text-4xl font-bold text-[#FF7043] text-center mt-16">
            Which side of the line are you on?
          </p>

          <p className="font-semibold text-gray-900 text-xl md:text-2xl text-center">
            If this page ever stops being true, then ForgeTomorrow has failed.
          </p>
        </div>
      </section>

      {/* FOUNDER */}
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
          <p className="text-lg text-gray-600 mt-1">Founder & CEO, ForgeTomorrow</p>

          <p className="mt-10 text-lg md:text-xl text-gray-700 leading-relaxed">
            I have lived the same story you have.
            I will never let this place become another wall someone cannot climb.
            If it does, it will have lost its reason to exist.
          </p>

          <p className="mt-6 font-semibold text-gray-900">That is my word.</p>
        </div>
      </section>
    </>
  );
}
