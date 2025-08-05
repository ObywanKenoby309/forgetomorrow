import { useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';

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

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '100vw',
          backgroundImage: "url('/forge-bg-bw.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6)',
          zIndex: -1,
        }}
      />

      <main
        role="main"
        aria-label="About ForgeTomorrow"
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '3rem',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
          }}
        >
          <h1
            style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              color: '#FF7043',
              textShadow: '0 0 10px rgba(255,112,67,0.9)',
            }}
          >
            Forge Tomorrow
          </h1>

          <p style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>
            We’re building the next evolution in professional networking — human-centered, AI-empowered,
            and built for the real world.
          </p>

          <p style={{ marginBottom: '2rem', fontSize: '1.125rem' }}>
            Our mission is to equip job seekers, freelancers, recruiters, mentors, and ethical employers
            with the tools and transparency they need to succeed in today’s fast-changing job market.
            No gatekeeping. No noise. Just support that shows up, AI with integrity, and a network where
            people come before algorithms.
          </p>

          <form onSubmit={sendWaitlistEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} aria-label="Join the waitlist form">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                borderRadius: '8px',
                border: '1px solid #ccc',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isSending}
              style={{
                backgroundColor: '#FF7043',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                border: 'none',
                transition: 'background-color 0.3s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F4511E')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF7043')}
            >
              {isSending ? 'Sending...' : 'Join the Waitlist'}
            </button>
          </form>

          {statusMessage && (
            <p
              role="alert"
              style={{
                marginTop: '1rem',
                color: statusMessage.type === 'success' ? '#4ade80' : '#f87171',
                fontSize: '0.875rem',
              }}
            >
              {statusMessage.text}
            </p>
          )}
        </div>
      </main>
    </>
  );
}
