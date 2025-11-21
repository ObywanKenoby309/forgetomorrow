// pages/blog/founder-welcome.js
import Head from "next/head";

export default function FounderWelcome() {
  return (
    <>
      <Head>
        <title>A Welcome from Our Founder | ForgeTomorrow Blog</title>
        <meta
          name="description"
          content="A personal welcome from Eric James, founder of ForgeTomorrow."
        />
      </Head>

      <section className="min-h-screen flex flex-col items-center justify-start px-6 py-16 max-w-3xl mx-auto">
        {/* Cropped, smaller logo */}
        <img
          src="/images/logo-color.png"
          alt="ForgeTomorrow"
          className="w-32 mb-8"
        />

        <h1 className="text-4xl md:text-5xl font-black mb-8 text-gray-900 text-center">
          A Welcome from Our Founder
        </h1>

        <div className="text-lg md:text-xl text-gray-800 space-y-6 leading-relaxed">
          <p>
            On behalf of the team, I'd like to be one of the first to welcome you to ForgeTomorrow's blog! Here, we share updates, insights, and stories from our community-first platform. 
          </p>
          <p>
            Whether you’re a job seeker, coach, or recruiter, you’ll find tips, inspiration, and a peek behind the scenes at how we build tools to make career growth easier for everyone.
          </p>
          <p>
            Thanks for stopping by — we’re excited to have you on the path with us.
          </p>
        </div>

        {/* Optional small headshot + name/title */}
        <div className="mt-12 flex items-center gap-4">
          <img
            src="/images/headshot-eric.jpg"
            alt="Eric James"
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <p className="font-bold text-gray-900">Eric James</p>
            <p className="text-gray-600">Founder, ForgeTomorrow</p>
          </div>
        </div>
      </section>
    </>
  );
}
