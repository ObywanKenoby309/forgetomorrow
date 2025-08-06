// pages/about.js
import Head from 'next/head';

export default function About() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow - About</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main
        role="main"
        className="
          flex flex-col items-center justify-start
          min-h-[calc(100vh-100px)]
          px-6 py-16 max-w-4xl mx-auto
          bg-gradient-to-b from-[#1a1a1a] to-black
          text-gray-200 font-sans
        "
      >
        <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 tracking-wide text-[#FF7043] drop-shadow-[0_0_10px_rgba(255,112,67,0.9)] text-center">
          About Forge Tomorrow
        </h1>

        <p className="max-w-2xl mb-6 text-lg leading-relaxed text-center">
          ForgeTomorrow started because we were tired of the gatekeeping and poor support from other famous sites.
          We listened closely to the struggles faced by professionals at every level — from those just starting their job
          search and struggling to afford networking tools, to senior C-suite executives wanting to stay connected and
          informed in the fast-evolving professional landscape.
        </p>

        <p className="max-w-2xl mb-6 text-lg leading-relaxed text-center">
          Just because you can’t pay for top-tier services doesn’t mean you shouldn’t receive assistance. We’ve seen too
          many talented people lost to the struggle — I personally read about a user who committed suicide because he
          simply gave up. Others wander without help or direction. That shouldn’t be how it is.
        </p>

        <p className="max-w-2xl mb-6 text-lg leading-relaxed text-center">
          As people and professionals in the market, everyone from IT, HR, employers, and coaches can do better to help
          the seeker — and we should. This is that opportunity.
        </p>

        <p className="max-w-2xl mb-6 text-lg leading-relaxed text-center">
          Many current platforms have fallen short of meeting the needs of individuals seeking meaningful support and
          connection, focusing too much on popularity and paid access rather than real help.
        </p>

        <p className="max-w-2xl mb-6 text-lg leading-relaxed text-center">
          ForgeTomorrow is built to fill that gap — to be a place where everyone can find real tools, real help, and
          real connection, no matter their budget or status.
        </p>
      </main>
    </>
  );
}
