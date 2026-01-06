// components/roadmap/ToolkitLanding.js
import React from 'react';

export default function ToolkitLanding({ onSelectModule }) {
  return (
    <div className="space-y-6 text-center">
      {/* ✅ Minimal branding so users always see "The Anvil" */}
      <div className="text-xs text-gray-500">
        <span className="font-semibold">The Anvil</span> modules
      </div>

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
          Offer &amp; Negotiation
        </button>

        <button
          onClick={() => onSelectModule('onboarding')}
          className="bg-[#FF7043] text-white px-6 py-3 rounded shadow font-semibold hover:bg-[#F4511E] transition"
        >
          Growth &amp; Pivot
        </button>
      </div>
    </div>
  );
}
