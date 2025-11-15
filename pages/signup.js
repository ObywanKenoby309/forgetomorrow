// pages/signup.js
import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/signup', {
      method: 'POST',  // ← FIXED: NO 753
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.error) {
      setError(data.error);
      setLoading(false);
    } else {
      router.push('/check-email');
    }
  };

  return (
    <>
      <Head>
        <title>ForgeTomorrow - Sign Up</title>
      </Head>
      <main className="flex items-center justify-center min-h-screen bg-[#ECEFF1] text-[#212121] px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-[#FF7043] mb-6 text-center">
            Create Your Account
          </h1>

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
                placeholder="6+ characters"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF7043] text-white py-3 rounded font-semibold hover:bg-[#F4511E] transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <a href="/auth/signin" className="text-[#FF7043] font-semibold hover:underline">
              Sign In
            </a>
          </p>
        </div>
      </main>
    </>
  );
}