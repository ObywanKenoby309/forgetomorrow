import React from 'react';

export default function ToolkitLanding({ onSelectModule }) {
  return (
    <div className="space-y-6 text-center">

      <div className="flex flex-col md:flex-row gap-4 justify-center max-w-3xl mx-auto">
        <button
          onClick={() => onSelectModule('profile')}
          className="bg-[#FF7043] text-white px-6 py-3 rounded shadow font-semibold hover:bg-[#F4511E] transition"
        >
          Profile Development
        </button>

        <button
          onClick={() => onSelectModule('offer')}
          className="bg-[#FF7043] text-white px-6 py-3 rounded shadow font-semibold hover:bg-[#F4511E] transition"
        >
          Offer & Negotiation
        </button>

        <button
          onClick={() => onSelectModule('onboarding')}
          className="bg-[#FF7043] text-white px-6 py-3 rounded shadow font-semibold hover:bg-[#F4511E] transition"
        >
          Growth & Pivot
        </button>
      </div>
    </div>
  );
}
