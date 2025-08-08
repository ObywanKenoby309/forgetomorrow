import React, { useState } from 'react';

export default function OfferNegotiation() {
  const [tips] = useState([
    'Understand your market value before negotiating.',
    'Consider total compensation, not just salary.',
    'Be prepared to explain your worth confidently.',
    'Negotiate start date and other benefits when appropriate.',
  ]);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-[#FF7043] mb-4">Offer & Negotiation</h2>

      <p className="mb-6">
        Congratulations on your job offer! Here are some key tips to help you negotiate effectively and secure the best possible terms.
      </p>

      <ul className="list-disc list-inside space-y-3 mb-6 text-gray-700">
        {tips.map((tip, i) => (
          <li key={i}>{tip}</li>
        ))}
      </ul>

      <div className="text-right">
        <button
          className="bg-[#FF7043] text-white px-6 py-3 rounded hover:bg-[#F4511E] transition"
          // onClick={() => {/* handle next step navigation */}}
        >
          Next
        </button>
      </div>
    </div>
  );
}
