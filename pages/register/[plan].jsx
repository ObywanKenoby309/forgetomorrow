// pages/register/[plan].jsx ← FINAL WORKING VERSION (SERVER-SIDE REDIRECT)
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Script from 'next/script';

const planInfo = {
  'job-seeker-free': { name: 'Job Seeker Free', price: 'Free forever', tier: 'FREE', priceId: null },
  'job-seeker-pro': { name: 'Job Seeker Pro', price: '$9.99 / month', tier: 'PRO', priceId: 'price_1SVFSG0l9wtvF7U5zkEte7yY' },
  'coach-mentor': { name: 'Coach & Mentor', price: '$39.99 / month', tier: 'COACH', priceId: 'price_1SVFRp0l9wtvF7U5mkqdFHRs' },
  'recruiter-smb': { name: 'Recruiter SMB', price: '$99.99 / month', tier: 'SMALL_BIZ', priceId: 'price_1SVFR20l9wtvF7U5Nrduc7Bj' },
};

export default function RegisterPlan() {
  const router = useRouter();
  const { plan } = router.query;
  const info = planInfo[plan] || planInfo['job-seeker-free'];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [terms, setTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');

  useEffect(() => {
    window.onCaptchaSolved = (token) => setCaptchaToken(token);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!terms) return setError('You must agree to the Terms');
    if (!captchaToken) return setError('Please complete the captcha');

    setLoading(true);

    try {
      // 1. Stage user (creates FREE account)
      const stageRes = await fetch('/api/register/stage-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          plan,
          newsletter,
          captchaToken,
        }),
      });

      if (!stageRes.ok) {
        const data = await stageRes.json();
        throw new Error(data.error || 'Failed to create account');
      }

      // 2. Free plan → go to check email
      if (!info.priceId) {
        router.push('/check-email');
        return;
      }

      // 3. Paid plan → server-side redirect to Stripe
      const checkoutRes = await fetch('/api/stripe/create-checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: email.trim().toLowerCase(),
    name: name.trim(),
    priceId: info.priceId,
    plan: info.tier,
  }),
});

if (!checkoutRes.ok) {
  const err = await checkoutRes.json();
  throw new Error(err.error || 'Checkout failed');
}

const { url } = await checkoutRes.json();
window.location.href = url;

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Something went wrong');
      setCaptchaToken('');
      if (window.grecaptcha) window.grecaptcha.reset();
    } finally {
      setLoading(false);
    }
  };

  if (!plan || !info) return <p>Invalid plan</p>;

  return (
    <>
      <Script src="https://www.google.com/recaptcha/api.js" strategy="lazyOnload" />

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">Complete Registration</h1>
          <p className="text-gray-600 mb-6">
            You're signing up for <strong>{info.name}</strong> – {info.price}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded-lg"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded-lg"
            />

            <div className="flex justify-center my-6">
              <div
                className="g-recaptcha"
                data-sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                data-callback="onCaptchaSolved"
              ></div>
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} required />
              <span>
                I agree to the <a href="/terms" className="text-orange-600 underline">Terms</a> and{' '}
                <a href="/privacy" className="text-orange-600 underline">Privacy Policy</a>
              </span>
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
              />
              <span>Send me tips & updates (optional)</span>
            </label>

            {error && <p className="text-red-600 text-center font-medium">{error}</p>}

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
              You will be redirected to Stripe for secure payment. No charges until you confirm.
            </p>
          )}
        </div>
      </div>
    </>
  );
}