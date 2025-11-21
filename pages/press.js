// pages/press.js — ForgeTomorrow Press Kit (unlisted, brutal, perfect)
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function Press() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow • Press Kit</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Hero */}
        <section className="px-8 py-20 text-center border-b border-gray-800">
          <h1 className="text-5xl md:text-7xl font-black text-orange-500 mb-6">
            ForgeTomorrow
          </h1>
          <p className="text-2xl md:text-4xl font-bold max-w-4xl mx-auto leading-tight">
            Your path. Your power. Your tomorrow.
          </p>
          <p className="text-gray-400 mt-6 text-lg">
            The job search platform that treats candidates like humans and recruiters like partners.
          </p>
        </section>

        {/* One-click download */}
        <section className="bg-gray-950 py-12 text-center">
          <a
            href="/press/press-kit.zip"
            className="inline-block px-12 py-6 bg-orange-600 hover:bg-orange-500 text-white text-xl font-bold rounded-lg transition"
          >
            Download Full Press Kit (.zip)
          </a>
        </section>

        {/* Boilerplate */}
        <section className="max-w-4xl mx-auto px-8 py-16 grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-orange-500 mb-4">50-Word Boilerplate</h2>
            <p className="text-gray-300 leading-relaxed">
              ForgeTomorrow is the modern job search platform built for real humans — job seekers get momentum-tracking dashboards, AI resume tools, and direct recruiter access. Coaches manage clients and sessions in one place. Recruiters post, message, and hire faster. No bots. No ghosting. Just progress.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-orange-500 mb-4">Founding Story</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              Founded in 2025 by Brian P., a 20-year recruiting veteran who got tired of seeing good people get crushed by broken job boards. ForgeTomorrow is the platform he wished existed — transparent, human-first, and built to actually help people win.
            </p>
          </div>
        </section>

        {/* Screenshots */}
        <section className="bg-gray-950 py-16">
          <div className="max-w-7xl mx-auto px-8">
            <h2 className="text-3xl font-bold text-orange-500 mb-10 text-center">Product Screenshots</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <Image src="/press/screenshot-seeker.jpg" width={1200} height={800} alt="Seeker Dashboard" className="rounded-lg border border-gray-800" />
                <p className="text-center mt-4 text-gray-400">Seeker Dashboard</p>
              </div>
              <div>
                <Image src="/press/screenshot-coach.jpg" width={1200} height={800} alt="Coach Suite" className="rounded-lg border border-gray-800" />
                <p className="text-center mt-4 text-gray-400">Coach Suite</p>
              </div>
              <div>
                <Image src="/press/screenshot-recruiter.jpg" width={1200} height={800} alt="Recruiter Dashboard" className="rounded-lg border border-gray-800" />
                <p className="text-center mt-4 text-gray-400">Recruiter Dashboard</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="max-w-4xl mx-auto px-8 py-16">
          <h2 className="text-3xl font-bold text-orange-500 mb-10 text-center">Founder</h2>
          <div className="flex flex-col md:flex-row items-center gap-10">
            <Image src="/press/headshot-brian.jpg" width={400} height={500} alt="Brian P., Founder" className="rounded-lg" />
            <div>
              <h3 className="text-2xl font-bold">Brian P.</h3>
              <p className="text-orange-500">Founder & CEO</p>
              <p className="text-gray-400 mt-4 leading-relaxed">
                20-year recruiting veteran turned builder. Spent decades watching good people get ignored by broken systems. Built ForgeTomorrow to fix it.
              </p>
              <p className="text-gray-400 mt-4">
                Press contact: <a href="mailto:press@forgetomorrow.com" className="text-orange-500 underline">press@forgetomorrow.com</a>
              </p>
            </div>
          </div>
        </section>

        <footer className="bg-gray-950 py-12 text-center text-gray-500 text-sm">
          © 2025 ForgeTomorrow, Inc. All rights reserved.<br />
          <a href="/" className="text-orange-600 hover:underline">forgetomorrow.com</a>
        </footer>
      </div>
    </>
  );
}