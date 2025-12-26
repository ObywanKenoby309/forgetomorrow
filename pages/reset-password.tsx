// pages/reset-password.tsx
import { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ResetPassword() {
  const router = useRouter();
  const token = useMemo(() => {
    const t = router.query?.token;
    return typeof t === 'string' ? t : '';
  }, [router.query]);

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState<string>('');
  const [ok, setOk] = useState<string>('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setOk('');

    if (!token) {
      setError('Missing reset token.');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }

    setStatus('loading');

    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        setError(data?.message || 'Unable to reset password.');
        setStatus('idle');
        return;
      }

      setOk('Password updated. You can sign in now.');
      setStatus('done');
    } catch {
      setError('Unable to reset password.');
      setStatus('idle');
    }
  }

  return (
    <>
      <Head>
        <title>Reset Password – Forge Tomorrow</title>
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
          Choose a new password
        </h1>

        {!token && (
          <div
            role="alert"
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 8,
              background: '#FFEBEE',
              color: '#C62828',
              fontSize: 14,
            }}
          >
            Missing reset token.
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 8,
              background: '#FFEBEE',
              color: '#C62828',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {ok && (
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
            {ok}
          </div>
        )}

        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="password"
              style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}
            >
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #ddd',
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="password2"
              style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}
            >
              Confirm password
            </label>
            <input
              id="password2"
              name="password2"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
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
            disabled={status === 'loading' || !token}
            style={{
              width: '100%',
              padding: 14,
              background: '#FF7043',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: status === 'loading' || !token ? 'not-allowed' : 'pointer',
              opacity: status === 'loading' || !token ? 0.8 : 1,
            }}
          >
            {status === 'loading' ? 'Updating…' : 'Update password'}
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
