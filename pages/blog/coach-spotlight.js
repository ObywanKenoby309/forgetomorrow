import Head from "next/head";

export default function CoachSpotlight() {
  return (
    <>
      <Head>
        <title>Coaching Spotlight | ForgeTomorrow</title>
        <meta
          name="description"
          content="Discover how ForgeTomorrow empowers coaches to connect with job seekers and gain visibility in the recruiting community."
        />
      </Head>

      <section className="relative min-h-screen flex items-center justify-center px-6 text-center bg-[#112033]">
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
        <div className="relative z-10 max-w-5xl mx-auto text-white">
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight drop-shadow-2xl">
            Coaching Spotlight: <span className="text-[#FF7043]">Emphasizing Mentorship</span>
          </h1>
          <p className="text-2xl md:text-4xl max-w-4xl mx-auto drop-shadow-lg">
            Coaches get tools and visibility to help seekers grow and succeed.
          </p>
          <img
            src="/images/Coach Spotlight.jpg"
            alt="Coach Scheduler on ForgeTomorrow"
            className="mt-12 rounded-xl shadow-2xl mx-auto max-w-full"
          />
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 space-y-12 text-gray-900">
          <h2 className="text-4xl md:text-5xl font-black text-[#FF7043] text-center">
            Empowering Mentorship
          </h2>
          <p className="text-lg md:text-xl leading-relaxed">
            ForgeTomorrow provides coaches with the tools to schedule, connect, and gain visibility with seekers and recruiters alike. Our platform makes mentorship accessible and meaningful, creating opportunities for professional growth on both sides.
          </p>
        </div>
      </section>
    </>
  );
}
