import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function OnboardingGrowth() {
  const router = useRouter();

  const [steps] = useState([
    'Set clear 30/60/90 day goals aligned with your role.',
    'Schedule regular check-ins with your manager or mentor.',
    'Identify skills or certifications to focus on early.',
    'Engage with team and company culture actively.',
  ]);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-[#FF7043] mb-4">Onboarding & Growth</h2>

      <p className="mb-6">
        Starting a new job is a critical time. Use these tips to set yourself up for success and growth in your new role.
      </p>

      <ul className="list-disc list-inside space-y-3 mb-6 text-gray-700">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ul>

      <div className="text-right">
        <button
          className="bg-[#FF7043] text-white px-6 py-3 rounded hover:bg-[#F4511E] transition"
          onClick={() => {
            router.push('/roadmap/onboarding-growth/select');
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
