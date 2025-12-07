// components/profile/ProfileResumeAttach.js
import { useEffect, useState } from 'react';
import Link from 'next/link';

const ORANGE = '#FF7043';

export default function ProfileResumeAttach({ withChrome }) {
  const [loading, setLoading] = useState(true);
  const [primaryResume, setPrimaryResume] = useState(null);
  const [error, setError] = useState('');

  const createHref = withChrome ? withChrome('/resume/create') : '/resume/create';

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
          setPrimaryResume(data.primaryResume || null);
        }
      } catch (err) {
        console.error('[ProfileResumeAttach] Failed to load primary resume', err);
        if (!cancelled) {
          setError('We could not load your primary resume.');
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
        <h3 className="text-orange-600 font-bold text-lg">Primary Resume</h3>
        <Link
          href={createHref}
          className="border border-orange-500 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold hover:bg-orange-50"
        >
          New resume
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : primaryResume ? (
        <p className="text-sm text-gray-700">
          <span className="font-semibold">{primaryResume.name}</span>
          {' · Last updated '}
          {new Date(primaryResume.updatedAt).toLocaleDateString()}
        </p>
      ) : (
        <p className="text-sm text-gray-600">
          No resumes saved yet. Use the Resume Builder to create one and set it as your
          primary.
        </p>
      )}

      <p className="text-xs text-gray-500 mt-1">
        This is the resume recruiters will see first on your ForgeTomorrow profile.
      </p>
    </section>
  );
}
