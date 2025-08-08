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
        Whether you’re embarking on a new job opportunity or negotiating a raise at your current role, ForgeTomorrow is here to cheer you on every step of the way. Congratulations on reaching this exciting milestone! Here are some key tips to help you negotiate confidently and secure the best possible outcome.
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
