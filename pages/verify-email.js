// pages/verify-email.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const plans = {
  free: { name: 'Free', price: 0, features: ['3 AI scans/day', 'Basic templates'] },
  pro: { name: 'Pro', price: 10, features: ['Unlimited scans', 'Premium templates', 'Priority support'] },
  premium: { name: 'Premium', price: 25, features: ['Everything in Pro', '1-on-1 coaching', 'ATS bypass'] },
};

export default function VerifyEmail() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const router = useRouter();

  useEffect(() => {
    const { token } = router.query;
    if (token) setToken(token);
  }, [router.query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!token) {
      setError('Invalid link');
      setLoading(false);
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be 6+ characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, plan }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
      } else if (data.redirectToStripe) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        // Free plan → go to dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECEFF1]">
        <p className="text-red-500">Invalid or missing token.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ECEFF1] p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-[#FF7043] mb-2 text-center">
          Complete Your Account
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Set your password and choose your plan
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Repeat password"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
              />
            </div>
          </div>

          {/* Plan Selection */}
          <div>
            <label className="block text-gray-700 font-semibold mb-3">
              Choose Your Plan
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(plans).map(([key, p]) => (
                <label
                  key={key}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    plan === key
                      ? 'border-[#FF7043] bg-orange-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={key}
                    checked={plan === key}
                    onChange={(e) => setPlan(e.target.value)}
                    className="sr-only"
                  />
                  <div className="font-bold text-lg">{p.name}</div>
                  <div className="text-2xl font-bold text-[#FF7043] mb-2">
                    {p.price === 0 ? 'Free' : `$${p.price}/mo`}
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {p.features.map((f, i) => (
                      <li key={i}>✓ {f}</li>
                    ))}
                  </ul>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF7043] text-white py-3 rounded font-semibold hover:bg-[#F4511E] disabled:opacity-50 transition"
          >
            {loading ? 'Processing...' : 'Complete Setup'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Secured by ForgeTomorrow •{' '}
          <Link href="/privacy" className="text-[#FF7043] hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}