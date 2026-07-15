// pages/press.tsx
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'

export default function PressKit() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow • Press Kit</title>
        <meta name="robots" content="noindex" />
      <style>{`.skip-link{position:absolute;left:16px;top:-48px;background:#FF7043;color:#fff;padding:12px 16px;border-radius:8px;z-index:10000;text-decoration:none;font-weight:700}.skip-link:focus{top:16px}*:focus-visible{outline:3px solid #FFB199;outline-offset:3px}@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}`}</style></Head>

      <a href="#main-content" className="skip-link">Skip to main content</a>

      <main
        id="main-content"
        className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a] text-gray-100"
        aria-labelledby="press-kit-heading"
      >
        <div className="max-w-5xl mx-auto text-center px-6 py-24">
          <h1
            id="press-kit-heading"
            className="text-5xl md:text-6xl font-black text-white mb-6"
          >
            Press Kit
          </h1>

          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Logos, brand colors, and contact info for media &amp; partners.
          </p>

          {/* Full Press Kit ZIP */}
          <div className="mb-16 flex flex-col items-center gap-3">
            <Link
              href="/press/ForgeTomorrow-Press-Kit.zip"
              download
              className="inline-flex items-center justify-center rounded-full bg-orange-600 px-10 py-4 text-lg font-black text-white shadow hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-200"
            >
              Download Full Press Kit (ZIP)
            </Link>
            <p className="text-sm text-gray-400">
              Includes logos, brand assets, founder + company info, and product screenshots.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Color logo */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow flex flex-col items-center">
              <Image
                src="/press/Brand/logo-color.png"
                width={350}
                height={350}
                alt="ForgeTomorrow color logo"
              />
              <Link
                href="/press/Brand/logo-color.png"
                download
                className="block mt-4 text-orange-600 font-bold"
              >
                Download PNG
              </Link>
            </div>

            {/* White logo on dark background */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow flex flex-col items-center">
              <Image
                src="/press/Brand/logo-white.png"
                width={350}
                height={350}
                alt="ForgeTomorrow white logo"
              />
              <Link
                href="/press/Brand/logo-white.png"
                download
                className="block mt-4 text-orange-400 font-bold"
              >
                Download PNG
              </Link>
            </div>

            {/* Black logo on light background */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow flex flex-col items-center">
              <Image
                src="/press/Brand/logo-black.png"
                width={350}
                height={350}
                alt="ForgeTomorrow black logo"
              />
              <Link
                href="/press/Brand/logo-black.png"
                download
                className="block mt-4 text-orange-600 font-bold"
              >
                Download PNG
              </Link>
            </div>
          </div>

          <div className="mt-20 bg-white/5 border border-white/10 rounded-2xl p-12 inline-block">
            <h2 className="text-4xl font-bold mb-4">Press Contact</h2>
            <p className="text-2xl">Eric • Founder</p>
            <a
              href="mailto:eric@forgetomorrow.com"
              className="text-xl text-orange-600"
            >
              eric.james@forgetomorrow.com
            </a>

            {/* Secondary ZIP link (optional but useful) */}
            <div className="mt-8">
              <Link
                href="/press/ForgeTomorrow-Press-Kit.zip"
                download
                className="inline-flex items-center justify-center rounded-full border border-orange-300 px-8 py-3 text-base font-bold text-orange-700 hover:bg-orange-50"
              >
                Download Full Press Kit (ZIP)
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
