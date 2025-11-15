// components/apply/ApplySteps.js
'use client';

import { useRouter } from 'next/router';

export default function ApplySteps({ current }) {
  const router = useRouter();
  const steps = [
    { num: 1, label: 'Resume', path: '/resume/create' },
    { num: 2, label: 'Cover Letter', path: '/cover/create' },
  ];

  return (
    <div className="flex items-center justify-center gap-4 bg-white rounded-full shadow-lg px-6 py-3">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center">
          {i > 0 && (
            <div className="w-12 h-px bg-gray-300 mx-2" />
          )}
          <button
            onClick={() => router.push(step.path)}
            className={`
              min-w-[140px] px-5 py-2.5 rounded-full font-bold text-sm
              transition-all duration-200 flex items-center justify-center
              ${current === step.num
                ? 'bg-orange-500 text-white shadow-md scale-105'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
          >
            {step.num}. {step.label}
          </button>
        </div>
      ))}
    </div>
  );
}