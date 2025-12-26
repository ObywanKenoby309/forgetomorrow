// pages/forgot-password.tsx
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [message, setMessage] = useState<string>('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'loading') return;

    setStatus('loading');
    setMessage('');

    try {
      const r = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await r.json().catch(() => ({}));
      setMessage(
        data?.message ||
          'If an account exists for that email, a reset link has been sent.'
      );
    } catch {
      setMessage('If an account exists for that email, a reset link has been sent.');
    } finally {
      setStatus('done');
    }
  }

  return (
    <>
      <Head>
        <title>Forgot Password – Forge Tomorrow</title>
      </Head>

      <main
        style={{
          maxWidth: 420,
          margin: '100px auto',
          padding: 30,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            color: '#FF7043',
            marginBottom: 18,
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          Reset your password
        </h1>

        <p style={{ color: '#666', fontSize: 14, marginBottom: 18 }}>
          Enter your email and we’ll send you a one-time reset link. The link expires in 15 minutes.
        </p>

        {message && (
          <div
            role="status"
            aria-live="polite"
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 8,
              background: '#E8F5E9',
              color: '#1B5E20',
              fontSize: 14,
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="email"
              style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #ddd',
                fontSize: 14,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              width: '100%',
              padding: 14,
              background: '#FF7043',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              opacity: status === 'loading' ? 0.8 : 1,
            }}
          >
            {status === 'loading' ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13 }}>
          <Link href="/auth/signin" style={{ color: '#FF7043', fontWeight: 700 }}>
            Back to sign in
          </Link>
        </p>
      </main>
    </>
  );
}
