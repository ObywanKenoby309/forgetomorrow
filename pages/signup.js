// pages/signup.js
import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [agreeToS, setAgreeToS] = useState(false);
  const [consentEmails, setConsentEmails] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!firstName || !lastName || !email) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (!agreeToS) {
      setError('You must agree to the Terms of Service');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          agreeToS,
          consentEmails,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
      } else {
        router.push('/check-email');
      }
    } catch (err) {
      setError('Something went wrong. Try again.');
      setLoading(false);
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="John"
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Doe"
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
                />
              </div>
            </div>

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

            <label className="flex items-start space-x-3 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={agreeToS}
                onChange={(e) => setAgreeToS(e.target.checked)}
                required
                className="mt-0.5"
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" className="text-[#FF7043] font-semibold hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-[#FF7043] font-semibold hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <label className="flex items-start space-x-3 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={consentEmails}
                onChange={(e) => setConsentEmails(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Send me job tips, AI resume advice, and updates (optional)
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF7043] text-white py-3 rounded font-semibold hover:bg-[#F4511E] transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Create Account'}
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