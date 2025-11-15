// /pages/login.js
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = form.get('email');
    const password = form.get('password');

    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok || !data?.ok) {
        setErr(data?.error || 'Login failed');
        setLoading(false);
        return;
      }
      // success → go to home (or /dashboard, etc.)
      router.replace('/');
    } catch (e2) {
      setErr('Network error');
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>ForgeTomorrow - Login</title>
      </Head>

      <main className="flex items-center justify-center min-h-screen bg-[#ECEFF1] text-[#212121] px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mt-20">
          <h1 className="text-3xl font-bold text-[#FF7043] mb-6 text-center">Login to ForgeTomorrow</h1>

          <form id="loginForm" className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-gray-700 font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="Your password"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
              />
            </div>

            {err && <div className="text-red-600 text-sm -mt-2">{err}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF7043] text-white py-3 rounded font-semibold hover:bg-[#F4511E] transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" passHref>
              <button
                type="button"
                className="text-[#FF7043] font-semibold hover:underline"
                aria-label="Go to Sign Up page"
              >
                Sign Up
              </button>
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
