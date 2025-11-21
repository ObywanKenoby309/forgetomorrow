// pages/press.tsx  ←  THIS IS THE ONLY VERSION THAT WILL BUILD GREEN RIGHT NOW
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

      <main className="min-h-screen bg-gray-100 py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-black text-orange-600 mb-8">Press Kit</h1>
          <p className="text-2xl text-gray-700 mb-16">
            Logos, brand colors, and contact info for media & partners.
          </p>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="bg-white rounded-xl p-8 shadow">
              <Image src="/images/logo-color.png" width={350} height={350} alt="Color logo" />
              <Link href="/images/logo-color.png" download className="block mt-4 text-orange-600 font-bold">
                Download PNG
              </Link>
            </div>
            <div className="bg-white rounded-xl p-8 shadow">
              <Image src="/images/logo-white.png" width={350} height={350} alt="White logo" />
              <Link href="/images/logo-white.png" download className="block mt-4 text-orange-600 font-bold">
                Download PNG
              </Link>
            </div>
            <div className="bg-white rounded-xl p-8 shadow">
              <Image src="/images/logo-black.png" width={350} height={350} alt="Black logo" />
              <Link href="/images/logo-black.png" download className="block mt-4 text-orange-600 font-bold">
                Download PNG
              </Link>
            </div>
          </div>

          <div className="mt-20 bg-white rounded-xl p-12 inline-block">
            <h2 className="text-4xl font-bold mb-4">Press Contact</h2>
            <p className="text-2xl">Eric • Founder</p>
            <a href="mailto:eric@forgetomorrow.com" className="text-xl text-orange-600">
              eric@forgetomorrow.com
            </a>
          </div>
        </div>
      </main>
    </>
  );
}