import { useEffect, useState } from 'react';
import Head from 'next/head';
import emailjs from '@emailjs/browser';

export default function Home() {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // UTM fields
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');

  // ✅ Init EmailJS once (PUBLIC key)
  useEffect(() => {
    emailjs.init('YyYidv88o9X7iKfYJ'); // <-- your public key
  }, []);

  // ✅ Pull UTM params from the URL once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    setUtmSource(p.get('utm_source') || '');
    setUtmMedium(p.get('utm_medium') || '');
    setUtmCampaign(p.get('utm_campaign') || '');
  }, []);

  const sendWaitlistEmail = async (e) => {
    e.preventDefault();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      alert('Please enter a valid email.');
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const result = await emailjs.send(
        'service_quxmizv',  // <-- your Service ID
        'template_bnf88bh', // <-- your Template ID
        {
          // Match your EmailJS template variables exactly:
          user_email: email, // <-- using {{user_email}} in the template
          message: 'Waitlist request from site form',
          utm_source: utmSource || 'direct',
          utm_medium: utmMedium || 'none',
          utm_campaign: utmCampaign || 'none',
        }
      );

      console.log('EmailJS success:', result.text);
      setStatusMessage({
        type: 'success',
        text: `Success! You're on the list. We'll send launch updates soon.`,
      });
      setEmail('');
    } catch (error) {
      console.error('EmailJS error:', error);
      setStatusMessage({
        type: 'error',
        text: 'Oops! Something went wrong. Please try again later.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Head>
        <title>ForgeTomorrow — Home</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Empowering job seekers, recruiters, and coaches with tools, community, and opportunity. Beta access is reserved for Silver-tier (and above) Indiegogo backers."
        />
      </Head>

      <main className="min-h-screen">
        {/* HERO + ABOUT */}
        <section
          role="main"
          aria-label="About ForgeTomorrow"
          className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center text-gray-100"
        >
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 tracking-wide text-[#FF7043] drop-shadow-[0_0_10px_rgba(255,112,67,0.9)]">
            Forge Tomorrow
          </h1>

          <p className="mb-6 text-lg leading-relaxed max-w-3xl mx-auto">
            We’re building the next evolution in professional networking — human-centered, AI-empowered,
            and built for the real world.
          </p>

          <p className="mb-10 text-lg leading-relaxed max-w-3xl mx-auto">
            Our mission is to equip job seekers, freelancers, recruiters, mentors, and ethical employers
            with the tools and transparency they need to succeed in today’s fast-changing job market.
            No gatekeeping. No noise. Just support that shows up, AI with integrity, and a network where
            people come before algorithms.
          </p>

          {/* Crowdfunding Link */}
          <div className="mb-3">
            <a
              href="https://igg.me/at/forgetmrw/x/38735450#/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold px-8 py-3 rounded-lg shadow-lg transition-colors duration-300"
            >
              Back Us on Indiegogo
            </a>
          </div>
          {/* 🔒 Policy note to prevent confusion */}
          <p className="text-sm text-gray-300">
            <span className="font-semibold">Note:</span> Beta access is reserved for
            <span className="font-semibold"> Silver tier and above</span> Indiegogo backers.
            The public waitlist receives launch announcements and product updates.
          </p>
        </section>

        {/* ✅ WAITLIST (CENTERED) */}
        <section
          id="waitlist"
          className="scroll-mt-24 py-12 max-w-4xl mx-auto px-6 text-center"
        >
          <h2 className="text-2xl font-semibold text-gray-100">Join the waitlist</h2>
          <p className="text-gray-300 mt-1">
            Get launch updates and early news as we roll out features publicly.
            <span className="block text-gray-400 text-sm mt-1">
              Beta access is limited to Silver-tier (and above) Indiegogo backers.
            </span>
          </p>

          <div className="mt-6 max-w-md mx-auto">
            <form
              onSubmit={sendWaitlistEmail}
              className="w-full flex flex-col gap-4"
              aria-label="Join the waitlist form"
            >
              <input
                type="email"
                id="user_email"
                name="user_email"
                placeholder="Enter your email"
                required
                autoComplete="email"
                aria-required="true"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF7043] focus:border-transparent"
              />

              {/* Hidden UTM fields */}
              <input type="hidden" name="utm_source" value={utmSource} readOnly />
              <input type="hidden" name="utm_medium" value={utmMedium} readOnly />
              <input type="hidden" name="utm_campaign" value={utmCampaign} readOnly />

              <button
                type="submit"
                disabled={isSending}
                className="bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold px-8 py-3 rounded-lg shadow-lg transition-colors duration-300 disabled:opacity-60"
              >
                {isSending ? 'Sending…' : 'Join the Waitlist'}
              </button>
            </form>

            {statusMessage && (
              <p
                className={`mt-6 text-sm ${
                  statusMessage.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}
                role="status"
                aria-live="polite"
              >
                {statusMessage.text}
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
