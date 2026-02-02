// pages/blog.js
import Head from "next/head";
import { useRouter } from "next/router";

export default function Blog() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>ForgeTomorrow Blog</title>
        <meta
          name="description"
          content="Updates, insights, and stories from ForgeTomorrow. Stay informed on our platform, community, and upcoming events."
        />
      </Head>

      <main aria-labelledby="blog-heading">
        {/* HERO — FULLY ACCESSIBLE */}
        <section className="relative min-h-screen flex items-center justify-center px-6 text-center">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/Hero Banner - People on the Path.jpg')" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
          <div className="relative z-10 max-w-5xl mx-auto text-white">
            <h1
              id="blog-heading"
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight drop-shadow-2xl"
            >
              ForgeTomorrow Blog
            </h1>
            <p className="text-2xl md:text-4xl max-w-4xl mx-auto drop-shadow-lg">
              Updates, insights, and stories from our community-first platform. <br />
              <span className="text-[#FF7043]">
                We’ll update with new and exciting posts soon.
              </span>
            </p>
          </div>
        </section>

        {/* FEATURED / BLOG POSTS */}
        <section className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-6 space-y-16 text-gray-900">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-black text-[#FF7043] mb-8">
                Featured Stories
              </h2>
              <p className="text-gray-700 max-w-3xl mx-auto">
                Stay tuned for articles, tips, and updates about ForgeTomorrow, our platform, and our community.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* NEW: Startup Grind Nashville Membership */}
              <div className="border rounded-lg shadow-lg overflow-hidden flex flex-col">
                <div className="h-40 w-full overflow-hidden bg-black flex items-center justify-center">
                  <img
                    src="/images/startup-grind-logo.png"
                    alt="Startup Grind Nashville"
                    className="h-24 object-contain"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold mb-4">
                    ForgeTomorrow Joins Startup Grind Nashville
                  </h3>
                  <p className="flex-1 text-gray-700">
                    ForgeTomorrow is officially a member of the Startup Grind Nashville chapter, joining a global
                    community of founders, builders, and operators.
                  </p>
                  <button
                    onClick={() => router.push("/blog/startup-grind-nashville")}
                    className="mt-6 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    Read More
                  </button>
                </div>
              </div>

              {/* Post 1: Resume Builder */}
              <div className="border rounded-lg shadow-lg overflow-hidden flex flex-col">
                <div className="h-40 w-full overflow-hidden">
                  <img
                    src="/images/Resume Builder1.jpg"
                    alt="How We Built the Resume Builder"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold mb-4">
                    How We Built the Resume Builder
                  </h3>
                  <p className="flex-1 text-gray-700">
                    Discover the tools that make career growth easier for job seekers everywhere.
                  </p>
                  <button
                    onClick={() => router.push("/blog/resume-builder")}
                    className="mt-6 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    Read More
                  </button>
                </div>
              </div>

              {/* Post 2: Coach Spotlight */}
              <div className="border rounded-lg shadow-lg overflow-hidden flex flex-col">
                <div className="h-40 w-full overflow-hidden">
                  <img
                    src="/images/Coach Spotlight.jpg"
                    alt="Coach Spotlight: Emphasizing Mentorship"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold mb-4">
                    Coach Spotlight: Emphasizing Mentorship
                  </h3>
                  <p className="flex-1 text-gray-700">
                    See how our platform helps coaches gain visibility and connect with job seekers.
                  </p>
                  <button
                    onClick={() => router.push("/blog/coach-spotlight")}
                    className="mt-6 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    Read More
                  </button>
                </div>
              </div>

              {/* Post 3: Recruiter Insights */}
              <div className="border rounded-lg shadow-lg overflow-hidden flex flex-col">
                <div className="h-40 w-full overflow-hidden">
                  <img
                    src="/images/Recruiter Insights.jpg"
                    alt="Recruiter Insights: Transparent Matching"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold mb-4">
                    Recruiter Insights: Transparent Matching
                  </h3>
                  <p className="flex-1 text-gray-700">
                    Learn how our platform empowers recruiters to see candidates clearly and fairly.
                  </p>
                  <button
                    onClick={() => router.push("/blog/recruiter-insights")}
                    className="mt-6 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    Read More
                  </button>
                </div>
              </div>

              {/* Post 4: Founder Welcome */}
              <div className="border rounded-lg shadow-lg overflow-hidden flex flex-col">
                <div
                  className="h-40 w-full overflow-hidden"
                  style={{ backgroundColor: "#0F1D35" }}
                >
                  <img
                    src="/images/ForgeTomorrowBanner.jpg"
                    alt="ForgeTomorrow Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold mb-4">
                    A Welcome from Our Founder
                  </h3>
                  <p className="flex-1 text-gray-700">
                    On behalf of the team, I’m thrilled to welcome you to the ForgeTomorrow blog.
                    Stay inspired and get insights from our community-first platform.
                  </p>
                  <button
                    onClick={() => router.push("/blog/founder-welcome")}
                    className="mt-6 bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    Read More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA / SIGN-UP */}
        <section className="py-24 bg-[#1a1a1a] text-gray-100 text-center">
          <div className="max-w-4xl mx-auto px-6 space-y-12">
            <h2 className="text-4xl md:text-5xl font-black text-[#FF7043]">
              Never Miss an Update
            </h2>
            <p className="text-2xl md:text-3xl leading-relaxed text-gray-300">
              Subscribe to get notifications whenever we post new stories, insights, or events.
            </p>

            <div className="mt-12">
              <form
                action="https://formspree.io/f/YOUR_FORM_ID_HERE"
                method="POST"
                className="max-w-md mx-auto flex flex-col sm:flex-row gap-4"
              >
                <label htmlFor="blog-subscribe-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="blog-subscribe-email"
                  type="email"
                  name="email"
                  placeholder="youremail@email.com"
                  required
                  className="px-6 py-4 rounded-full text-gray-900 flex-1 focus:outline-none focus:ring-4 focus:ring-[#FF7043]"
                />
                <button
                  type="submit"
                  className="bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold px-8 py-4 rounded-full transition"
                >
                  Subscribe
                </button>
              </form>
              <p className="mt-8 text-sm text-gray-500">
                Every submission lands instantly in{" "}
                <strong>blog@forgetomorrow.com</strong>
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
