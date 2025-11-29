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
      </Head>

      <main
        className="min-h-screen bg-gray-100 py-24 px-8"
        aria-labelledby="press-kit-heading"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1
            id="press-kit-heading"
            className="text-6xl font-black text-orange-600 mb-8"
          >
            Press Kit
          </h1>
          <p className="text-2xl text-gray-700 mb-16">
            Logos, brand colors, and contact info for media &amp; partners.
          </p>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Color logo */}
            <div className="bg-white rounded-xl p-8 shadow flex flex-col items-center">
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
            <div className="bg-gray-900 rounded-xl p-8 shadow flex flex-col items-center">
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
            <div className="bg-gray-50 rounded-xl p-8 shadow flex flex-col items-center">
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

          <div className="mt-20 bg-white rounded-xl p-12 inline-block">
            <h2 className="text-4xl font-bold mb-4">Press Contact</h2>
            <p className="text-2xl">Eric • Founder</p>
            <a
              href="mailto:eric@forgetomorrow.com"
              className="text-xl text-orange-600"
            >
              eric.james@forgetomorrow.com
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
