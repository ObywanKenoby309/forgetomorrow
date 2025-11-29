// pages/register/[plan].jsx ← UPDATED FOR FIRST/LAST NAME + PREVERIFY + A11Y
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Script from 'next/script';
import Head from 'next/head';

const planInfo = {
  'job-seeker-free': {
    name: 'Job Seeker Free',
    price: 'Free forever',
    tier: 'FREE',
    priceId: null,
  },
  'job-seeker-pro': {
    name: 'Job Seeker Pro',
    price: '$9.99 / month',
    tier: 'PRO',
    priceId: 'price_1SVFSG0l9wtvF7U5zkEte7yY',
  },
  'coach-mentor': {
    name: 'Coach & Mentor',
    price: '$39.99 / month',
    tier: 'COACH',
    priceId: 'price_1SVFRp0l9wtvF7U5mkqdFHRs',
  },
  'recruiter-smb': {
    name: 'Recruiter SMB',
    price: '$99.99 / month',
    tier: 'SMALL_BIZ',
    priceId: 'price_1SVFR20l9wtvF7U5Nrduc7Bj',
  },
};

export default function RegisterPlan() {
  const router = useRouter();
  const { plan } = router.query;
  const info = planInfo[plan] || planInfo['job-seeker-free'];

  // 🔹 Split name into first + last
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [terms, setTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');

  useEffect(() => {
    // reCAPTCHA callback defined in global scope
    // @ts-ignore
    window.onCaptchaSolved = (token: string) => setCaptchaToken(token);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both first and last name.');
      return;
    }

    if (!terms) {
      setError('You must agree to the Terms');
      return;
    }

    if (!captchaToken) {
      setError('Please complete the captcha');
      return;
    }

    setLoading(true);

    try {
      // 🔹 Stage account via preverify (email + token flow)
      const stageRes = await fetch('/api/auth/preverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password: 'temp-password-will-be-set-later', // real password is set on verify-email page
          plan: info.tier,
          recaptchaToken: captchaToken,
          newsletter,
        }),
      });

      if (!stageRes.ok) {
        const data = await stageRes.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create account');
      }

      // Free plan → go to check-email page
      if (!info.priceId) {
        router.push('/check-email');
        return;
      }

      // Paid plans → Stripe (kept as-is from your previous flow)
      const checkoutRes = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: `${firstName.trim()} ${lastName.trim()}`,
          priceId: info.priceId,
          plan: info.tier,
        }),
      });

      if (!checkoutRes.ok) {
        const err = await checkoutRes.json().catch(() => ({}));
        throw new Error(err.error || 'Checkout failed');
      }

      const { url } = await checkoutRes.json();
      window.location.href = url;
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Something went wrong');
      setCaptchaToken('');
      // @ts-ignore
      if (window.grecaptcha) window.grecaptcha.reset();
    } finally {
      setLoading(false);
    }
  };

  if (!plan || !info) {
    // Accessible fallback for invalid/unknown plan
    return (
      <>
        <Head>
          <title>Plan not found | ForgeTomorrow</title>
        </Head>
        <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <p className="text-center text-gray-800">
            The plan you tried to access is not available.{' '}
            <a href="/pricing" className="text-orange-600 underline">
              View all available plans
            </a>
            .
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Complete registration — {info.name} | ForgeTomorrow</title>
        <meta
          name="description"
          content={`Complete your ForgeTomorrow registration for the ${info.name} plan (${info.price}).`}
        />
      </Head>

      <Script
        src="https://www.google.com/recaptcha/api.js"
        strategy="lazyOnload"
      />

      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">
            Complete Registration
          </h1>
          <p className="text-gray-600 mb-6">
            You&apos;re signing up for <strong>{info.name}</strong> – {info.price}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" aria-describedby={error ? 'register-error' : undefined}>
            {/* 🔹 First / Last name row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="first-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First name
                </label>
                <input
                  id="first-name"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
              <div>
                <label
                  htmlFor="last-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last name
                </label>
                <input
                  id="last-name"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border rounded-lg"
              />
            </div>

            <div className="flex justify-center my-6">
              <div
                className="g-recaptcha"
                data-sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                data-callback="onCaptchaSolved"
                aria-label="reCAPTCHA security check"
              />
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                required
              />
              <span>
                I agree to the{' '}
                <a href="/terms" className="text-orange-600 underline">
                  Terms
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-orange-600 underline">
                  Privacy Policy
                </a>
              </span>
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
              />
              <span>Send me tips &amp; updates (optional)</span>
            </label>

            {error && (
              <p
                id="register-error"
                className="text-red-600 text-center font-medium"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="w-full bg-orange-600 text-white py-4 rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50 transition"
            >
              {loading
                ? 'Processing...'
                : info.priceId
                ? 'Continue to Secure Checkout'
                : 'Create Free Account'}
            </button>
          </form>

          {info.priceId && (
            <p className="text-center text-sm text-gray-500 mt-6">
              You will be redirected to Stripe for secure payment. No charges
              until you confirm.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
