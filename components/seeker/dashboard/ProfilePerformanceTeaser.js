// components/seeker/dashboard/ProfilePerformanceTeaser.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProfilePerformanceTeaser() {
  const [data, setData] = useState({ viewsLast7: 0, searchAppearancesLast7: 0, completionPercent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/seeker/profile-performance-teaser');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Profile performance teaser load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-orange-600">
          Your Profile Performance
        </h2>
        <Link
          href="/profile/analytics" // Change to your actual full analytics route
          className="text-orange-600 font-medium hover:underline text-sm"
        >
          View full analytics →
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900">{data.viewsLast7}</p>
          <p className="text-xs text-gray-600">Profile Views (7 days)</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{data.searchAppearancesLast7}</p>
          <p className="text-xs text-gray-600">Search Appearances (7 days)</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{data.completionPercent}%</p>
          <p className="text-xs text-gray-600">Profile Completion</p>
        </div>
      </div>
    </section>
  );
}