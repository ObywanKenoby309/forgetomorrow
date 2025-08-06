// pages/features.js
import Head from 'next/head';

export default function Features() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow - Features</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main
        role="main"
        className="
          flex flex-col items-center justify-start
          min-h-[calc(100vh-100px)]
          px-6 py-16 max-w-4xl mx-auto
          text-gray-200 font-sans
        "
      >
        <h1 className="text-5xl sm:text-6xl mb-6 tracking-wide text-[#FF7043] drop-shadow-[0_0_10px_rgba(255,112,67,0.9)] text-center">
          Platform Features
        </h1>

        <ul className="max-w-2xl space-y-6 text-lg leading-relaxed text-center list-disc list-inside">
          <li>
            Human-centered networking — prioritizing real connections over algorithms.
          </li>
          <li>
            AI-powered job search — tailored recommendations and assistance with integrity.
          </li>
          <li>
            Real job boards — verified listings without spam or bots.
          </li>
          <li>
            Flexible membership plans — options for seekers, freelancers, recruiters, and small businesses.
          </li>
          <li>
            Dedicated human support — real tech support that shows up when you need it.
          </li>
          <li>
            Secure messaging — connect instantly with your network through private chats.
          </li>
          <li>
            Transparency and fairness — no gatekeeping or hidden costs.
          </li>
          <li>
            Mobile-friendly design — access ForgeTomorrow anywhere, anytime.
          </li>
        </ul>
      </main>
    </>
  );
}
