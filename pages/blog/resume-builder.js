import Head from "next/head";

export default function ResumeBuilder() {
  return (
    <>
      <Head>
        <title>How We Built the Resume Builder | ForgeTomorrow</title>
        <meta
          name="description"
          content="Explore the creation of the ForgeTomorrow Resume Builder. From concept to platform, see how we built a strong, reliable tool for job seekers."
        />
      </Head>

      <section className="relative min-h-screen flex items-center justify-center px-6 text-center bg-[#112033]">
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
        <div className="relative z-10 max-w-5xl mx-auto text-white">
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight drop-shadow-2xl">
            How We Built the <span className="text-[#FF7043]">Resume Builder</span>
          </h1>
          <p className="text-2xl md:text-4xl max-w-4xl mx-auto drop-shadow-lg">
            From blueprint to platform, every feature was designed with job seekers in mind.
          </p>
          <img
            src="/images/Resume Builder1.jpg"
            alt="ForgeTomorrow Resume Builder Concept"
            className="mt-12 rounded-xl shadow-2xl mx-auto max-w-full"
          />
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 space-y-12 text-gray-900">
          <h2 className="text-4xl md:text-5xl font-black text-[#FF7043] text-center">
            From Concept to Creation
          </h2>
          <p className="text-lg md:text-xl leading-relaxed">
            The ForgeTomorrow Resume Builder was designed like a carefully constructed project. Every feature was forged with precision, collaboration, and the goal of empowering job seekers to showcase their strengths.
          </p>
        </div>
      </section>
    </>
  );
}
