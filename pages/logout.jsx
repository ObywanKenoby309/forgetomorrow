// pages/logout.jsx
import { useEffect } from 'react';
import Head from 'next/head';
import { signOut } from 'next-auth/react';

export default function LogoutPage() {
  useEffect(() => {
    // Trigger NextAuth sign out as soon as the page loads.
    // callbackUrl = where to send the user after logout.
    signOut({
      callbackUrl: '/', // send them back to home (change if you want)
    });
  }, []);

  return (
    <>
      <Head>
        <title>Signing you out… – ForgeTomorrow</title>
      </Head>
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ECEFF1',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            background: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            textAlign: 'center',
            maxWidth: 360,
          }}
        >
          <h1
            style={{
              margin: 0,
              marginBottom: 8,
              fontSize: 20,
              color: '#263238',
              fontWeight: 700,
            }}
          >
            Signing you out…
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: '#607D8B',
            }}
          >
            One moment while we securely end your session.
          </p>
        </div>
      </main>
    </>
  );
}
