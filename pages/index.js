import { useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import styles from '../styles/LandingPage.module.css';

export default function Home() {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const sendWaitlistEmail = async (e) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter a valid email.');
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      await window.emailjs.send('service_quxmizv', 'forgetomorrow', { user_email: email });
      setStatusMessage({
        type: 'success',
        text: `Success! You're added. We don't like ghosts. We will always respond and provide transparency.`,
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
        <title>ForgeTomorrow - Home</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Empowering job seekers with tools, community, and opportunity."
        />
      </Head>

      <Script
        src="https://cdn.emailjs.com/sdk/3.2/email.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          window.emailjs.init('YyYidv88o9X7iKfYJ');
        }}
      />

      <div className={styles.pageWrapper}>
        <div
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), url('/forge-bg-bw.png')",
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
          }}
        >
          <main
            role="main"
            aria-label="About ForgeTomorrow"
            className="relative z-10 max-w-4xl p-12 rounded-xl text-center flex flex-col items-center
              bg-black bg-opacity-70 text-gray-100 shadow-lg"
          >
            <h1
              className="text-5xl font-extrabold mb-6 tracking-wide
                text-[#FF7043] drop-shadow-[0_0_10px_rgba(255,112,67,0.9)]
                sm:text-6xl break-words"
            >
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

            <form
              id="waitlist-form"
              onSubmit={sendWaitlistEmail}
              className="max-w-md w-full flex flex-col gap-4"
              aria-label="Join the waitlist form"
            >
              <input
                type="email"
                name="user_email"
                id="user_email"
                placeholder="Enter your email"
                required
                autoComplete="email"
                aria-required="true"
                aria-describedby="emailHelp"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-300 text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-[#FF7043] focus:border-transparent
                  flex-grow min-w-0"
              />
              <button
                type="submit"
                disabled={isSending}
                aria-live="polite"
                className="bg-[#FF7043] hover:bg-[#F4511E] text-white font-bold
                  px-8 py-3 rounded-lg shadow-lg transition-colors duration-300
                  flex-shrink-0"
              >
                {isSending ? 'Sending...' : 'Join the Waitlist'}
              </button>
            </form>

            {statusMessage && (
              <p
                className={`mt-6 max-w-md mx-auto text-sm ${
                  statusMessage.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}
                role="alert"
              >
                {statusMessage.text}
              </p>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
