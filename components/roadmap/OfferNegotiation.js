// components/roadmap/OfferNegotiation.js
import React, { useState } from 'react';
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

export default function OfferNegotiation() {
  const router = useRouter();

  const chrome =
    String(router.query.chrome || '').toLowerCase() ||
    getChromeFromAsPath(router.asPath);

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const [tips] = useState([
    'Understand your market value before negotiating.',
    'Consider total compensation, not just salary.',
    'Be prepared to explain your worth confidently.',
    'Negotiate start date and other benefits when appropriate.',
  ]);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-[#FF7043] mb-4">Offer &amp; Negotiation</h2>

      <p className="mb-6 text-gray-700">
        Compensation conversations can feel high-pressure. This module helps you prepare
        with clear, practical guidance so you can negotiate confidently and reasonably.
      </p>

      <ul className="list-disc list-inside space-y-3 mb-6 text-gray-700">
        {tips.map((tip, i) => (
          <li key={i}>{tip}</li>
        ))}
      </ul>

      {/* ✅ Guidance note (matches Profile Development pattern) */}
      <div
  style={{
    marginTop: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    background: '#F8FAFC',
    border: '1px solid #E5E7EB',
    fontSize: 13,
    color: '#475569',
    lineHeight: 1.45,
  }}
>
  <strong>Guidance note:</strong> This tool provides structured, AI-assisted guidance based on your
  profile and resume. It is designed to support your thinking and preparation, not to replace live
  coaching or mentorship. We encourage you to work with a coach or mentor through Spotlight to
  refine your strategy, positioning, and next steps.
</div>

      <div className="text-right">
        <button
          onClick={() => router.push(withChrome('/offer-negotiation/form'))}
          className="bg-[#FF7043] text-white px-6 py-3 rounded hover:bg-[#F4511E] transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}
