// pages/press.tsx
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function PressKit() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow • Press Kit</title>
        <meta name="robots" content="noindex" />
      </Head>

      {/* Full-screen forge background + overlay handled by _app.js */}
      <div className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-black text-orange-600 mb-8">
            Press Kit
          </h1>
          <p className="text-2xl text-gray-300 mb-16 max-w-3xl mx-auto">
            Official assets, logos, brand colors, and contact for media & partners.
          </p>

          {/* Logos */}
          <section className="grid md:grid-cols-3 gap-12 mb-20">
            <div className="bg-white/95 backdrop-blur rounded-2xl p-10 shadow-xl">
              <Image src="/images/logo-color.png" width={380} height={380} alt="Color Logo" className="mx-auto" />
              <Link href="/images/logo-color.png" download className="mt-6 inline-block text-orange-600 font-bold text-lg hover:underline">
                Download PNG
              </Link>
            </div>
            <div className="bg-white/95 backdrop-blur rounded-2xl p-10 shadow-xl">
              <Image src="/images/logo-white.png" width={380} height={380} alt="White Logo" className="mx-auto" />
              <Link href="/images/logo-white.png" download className="mt-6 inline-block text-orange-600 font-bold text-lg hover:underline">
                Download PNG
              </Link>
            </div>
            <div className="bg-white/95 backdrop-blur rounded-2xl p-10 shadow-xl">
              <Image src="/images/logo-black.png" width={380} height={380} alt="Black Logo" className="mx-auto" />
              <Link href="/images/logo-black.png" download className="mt-6 inline-block text-orange-600 font-bold text-lg hover:underline">
                Download PNG
              </Link>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-white/95 backdrop-blur rounded-2xl p-12 inline-block">
            <h2 className="text-4xl font-bold mb-4">Press Contact</h2>
            <p className="text-2xl mb-2">Eric • Founder & CEO</p>
            <a href="mailto:eric@forgetomorrow.com" className="text-xl text-orange-600 underline">
              eric@forgetomorrow.com
            </a>
          </section>
        </div>
      </div>
    </>
  );
}