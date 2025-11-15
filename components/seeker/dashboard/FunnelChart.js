// components/seeker/dashboard/FunnelChart.js
import React from 'react';
import Link from 'next/link';
import { STAGE_ORDER, colorFor } from '@/components/seeker/dashboard/seekerColors';

export default function FunnelChart({ data, showTrackerButton = false }) {
  const map = {
    applied: 'Applied',
    viewed: 'Viewed',
    interviewing: 'Interviewing',
    offers: 'Offers',
    hired: 'Hired',
  };

  return (
    <div className="space-y-3">
      {STAGE_ORDER.map((k) => {
        const c = colorFor(k);
        const val = data?.[k] ?? 0;
        return (
          <div
            key={k}
            className="flex items-center justify-between px-4 py-3 rounded-lg text-white font-bold transition-all hover:opacity-90"
            style={{ backgroundColor: c.solid }}
          >
            <span>{map[k]}</span>
            <span className="text-xl">{val}</span>
          </div>
        );
      })}

      {showTrackerButton && (
        <div className="mt-6 text-center">
          <Link href="/seeker/applications">
            <button className="inline-flex items-center gap-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg transition transform hover:scale-105">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Open Application Tracker
            </button>
          </Link>
          <p className="mt-3 text-sm text-gray-600">
            Track every note, interview, and offer in one place.{' '}
            <span className="font-bold text-orange-600">Never lose momentum.</span>
          </p>
        </div>
      )}
    </div>
  );
}