import React from 'react';
import { useRouter } from 'next/router';

function getChromeFromAsPath(asPath) {
  try {
    const s = String(asPath || '');
    if (!s.includes('chrome=')) return '';
    const qIndex = s.indexOf('?');
    if (qIndex === -1) return '';
    const query = s.slice(qIndex + 1);
    const params = new URLSearchParams(query);
    return String(params.get('chrome') || '').toLowerCase();
  } catch {
    return '';
  }
}

export default function OfferNegotiationLanding({ remainingUses, isPaidUser }) {
  const router = useRouter();

  const chrome =
    String(router.query.chrome || '').toLowerCase() ||
    getChromeFromAsPath(router.asPath);

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const handleStart = () => {
    router.push(withChrome('/offer-negotiation/form'));
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-lg shadow space-y-6">
      <h1 className="text-3xl font-bold text-[#FF7043] text-center">
        Offer & Negotiation Guidance
      </h1>

      <p className="text-gray-700 text-center">
        Get AI-powered advice tailored to your job offer or raise negotiation.
        Understand your offer, identify negotiation opportunities, and gain confidence.
      </p>

      {isPaidUser ? (
        <p className="text-center text-sm text-gray-600">
          You have <strong>{remainingUses}</strong> negotiation reviews remaining this month.
        </p>
      ) : (
        <p className="text-center text-sm text-red-600 font-semibold">
          This feature is available for paid subscribers only.
        </p>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleStart}
          disabled={!isPaidUser || remainingUses === 0}
          className={`px-6 py-3 rounded text-white font-bold transition
            ${
              !isPaidUser || remainingUses === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#FF7043] hover:bg-[#F4511E]'
            }`}
          aria-disabled={!isPaidUser || remainingUses === 0}
          aria-label="Start Negotiation Review"
        >
          Start Negotiation Review
        </button>
      </div>
    </div>
  );
}
