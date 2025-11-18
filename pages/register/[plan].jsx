// pages/register/[plan].jsx
import { useRouter } from 'next/router';
import { useState } from 'react';

const planInfo = {
  'job-seeker-free': { name: 'Job Seeker Free', price: 'Free forever' },
  'job-seeker-pro': { name: 'Job Seeker Pro', price: '$29 / month' },
  'coach-mentor': { name: 'Coach & Mentor', price: '$49 / month' },
  'recruiter-smb': { name: 'Recruiter SMB', price: '$99 / month' },
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!terms) return setError('You must agree to the Terms of Service');
    setLoading(true);

    const res = await fetch('/api/auth/stage-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, plan, newsletter }),
    });

    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setLoading(false);
    } else {
      router.push('/check-email'); // or custom "check your email" page
    }
  };

  if (!plan || !info) return <p>Invalid plan</p>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-orange-600 mb-2">Complete Registration</h1>
        <p className="text-gray-600 mb-6">
          You’re signing up for <strong>{info.name}</strong> – {info.price}
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

          {/* reCAPTCHA v2 + v3 goes here (you already have it working) */}
          {/* Paste your existing captcha component here */}

          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} required />
            <span>I agree to the <a href="/terms" className="text-orange-600 underline">Terms of Service</a> and <a href="/privacy" className="text-orange-600 underline">Privacy Policy</a></span>
          </label>

          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
            <span>Send me tips & updates (optional)</span>
          </label>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-4 rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Continue →'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          Free accounts are activated instantly. Paid plans will redirect to secure checkout after email verification.
        </p>
      </div>
    </div>
  );
}