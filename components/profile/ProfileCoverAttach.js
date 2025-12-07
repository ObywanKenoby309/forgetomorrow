// components/profile/ProfileCoverAttach.js
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProfileCoverAttach({ withChrome }) {
  const [loading, setLoading] = useState(true);
  const [primaryCover, setPrimaryCover] = useState(null);
  const [error, setError] = useState('');

  const createHref = withChrome ? withChrome('/cover/create') : '/cover/create';

  useEffect(() => {
    let cancelled = false;

    async function loadPrimaries() {
      try {
        const res = await fetch('/api/profile/primaries');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) {
          setPrimaryCover(data.primaryCover || null);
        }
      } catch (err) {
        console.error('[ProfileCoverAttach] Failed to load primary cover', err);
        if (!cancelled) {
          setError('We could not load your primary cover letter.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPrimaries();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-white rounded-2xl shadow-md p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-orange-600 font-bold text-lg">Primary Cover Letter</h3>
        <Link
          href={createHref}
          className="border border-orange-500 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold hover:bg-orange-50"
        >
          New cover letter
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : primaryCover ? (
        <p className="text-sm text-gray-700">
          <span className="font-semibold">{primaryCover.name}</span>
          {' · Last updated '}
          {new Date(primaryCover.updatedAt).toLocaleDateString()}
        </p>
      ) : (
        <p className="text-sm text-gray-600">
          No cover letters saved yet. Use the Cover Letter Builder to create one and set
          it as your primary.
        </p>
      )}

      <p className="text-xs text-gray-500 mt-1">
        This is the cover letter recruiters will see first when they view your profile.
      </p>
    </section>
  );
}
