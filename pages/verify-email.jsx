// pages/verify-email.jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const planNames = {
  FREE: 'Free Forever',
  PRO: 'Pro',
  COACH: 'Coach',
  SMALL_BIZ: 'Small Business',
  ENTERPRISE: 'Enterprise',
};

// Password must be 12+ chars with uppercase, lowercase, number, and symbol
const isStrongPassword = (password) => {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
  return strongRegex.test(password);
};

export default function SetPassword() {
  const router = useRouter();
  const { token, email, plan = 'FREE' } = router.query;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Client-side validation: complexity
      if (!isStrongPassword(password)) {
        setError(
          'Password must be at least 12 characters long and include an uppercase letter, a lowercase letter, a number, and a symbol.'
        );
        return;
      }

      // Client-side validation: match
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter them.');
        return;
      }

      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error('Failed to parse JSON from /api/auth/verify-email:', jsonErr);
        setError('Our servers returned an unexpected response. Please try again in a moment.');
        return;
      }

      if (!res.ok) {
        setError(data?.error || 'Something went wrong on our side. Please try again.');
        return;
      }

      if (data.redirectToStripe) {
        window.location.href = data.checkoutUrl;
      } else if (data.success) {
        router.push('/profile?verified=1');
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error('Verify-email submit error:', err);
      setError('Something went wrong on our side. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  // Invalid / missing token state with proper landmarks
  if (!token) {
    return (
      <>
        <Head>
          <title>Invalid verification link | ForgeTomorrow</title>
          <meta
            name="description"
            content="The email verification link is invalid or has expired."
          />
        </Head>
        <main
          className="min-h-screen flex items-center justify-center bg-gray-50 px-6"
          aria-labelledby="invalid-link-heading"
        >
          <div className="text-center p-8 bg-white rounded-2xl shadow-md max-w-md w-full">
            <h1
              id="invalid-link-heading"
              className="text-2xl font-bold text-orange-600 mb-3"
            >
              Invalid or Expired Link
            </h1>
            <p className="text-gray-700 mb-4">
              The email verification link is invalid or may have expired. Please request a
              new verification email or try signing in again.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Verify your email & set a password | ForgeTomorrow</title>
        <meta
          name="description"
          content="Confirm your ForgeTomorrow account and create a secure password."
        />
      </Head>

      <main
        className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center p-6"
        aria-labelledby="verify-email-heading"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-3xl w-full">
          <div className="text-center mb-6">
            <h1
              id="verify-email-heading"
              className="text-5xl font-bold text-orange-600 mb-4"
            >
              Welcome!
            </h1>
            <p className="text-xl text-gray-700">
              <strong>{email}</strong>
              <br />
              You signed up for{' '}
              <strong className="text-orange-600">
                {planNames[plan] || plan}
              </strong>
            </p>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-2 items-start">
            {/* Password Requirements Card */}
            <section
              className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-left"
              aria-labelledby="password-requirements-heading"
            >
              <h2
                id="password-requirements-heading"
                className="text-lg font-semibold text-orange-700 mb-2"
              >
                Password requirements
              </h2>
              <p className="text-sm text-gray-700 mb-2">
                For your security, your password must:
              </p>
              <ul
                id="password-requirements"
                className="list-disc pl-5 space-y-1 text-sm text-gray-700"
              >
                <li>
                  Be at least <strong>12 characters</strong> long
                </li>
                <li>
                  Include at least one <strong>uppercase</strong> letter (A–Z)
                </li>
                <li>
                  Include at least one <strong>lowercase</strong> letter (a–z)
                </li>
                <li>
                  Include at least one <strong>number</strong> (0–9)
                </li>
                <li>
                  Include at least one <strong>symbol</strong> (for example: ! @ # $ % ^ &amp; *)
                </li>
              </ul>
            </section>

            {/* Password Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-6 text-left"
              aria-describedby="password-requirements"
            >
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Create your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-describedby="password-requirements"
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="confirm-password"
                >
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  aria-describedby="password-requirements"
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:outline-none"
                />
              </div>

              {error && (
                <p
                  className="text-red-600 font-semibold text-sm"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg py-4 rounded-2xl transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting up...' : 'Continue to Your Profile →'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
