// components/profile/ProfileCoverAttach.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const RED = '#C62828';

export default function ProfileCoverAttach({ withChrome }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [covers, setCovers] = useState([]);
  const [error, setError] = useState('');
  const [settingPrimaryId, setSettingPrimaryId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const createHref = withChrome ? withChrome('/cover/create') : '/cover/create';

  const primaryCover = covers.find((c) => c.isPrimary) || null;

  const formatDate = (d) => {
    try {
      if (!d) return '';
      return new Date(d).toLocaleDateString();
    } catch {
      return '';
    }
  };

  // Load covers
  useEffect(() => {
    let cancelled = false;

    async function loadCovers() {
      try {
        setError('');
        const res = await fetch('/api/cover/list');

        if (!res.ok) {
          if (res.status === 401) throw new Error('AUTH');
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!cancelled) {
          setCovers(Array.isArray(data.covers) ? data.covers : []);
        }
      } catch (err) {
        console.error('[ProfileCoverAttach] load error', err);
        if (!cancelled) {
          setError(
            err?.message === 'AUTH'
              ? 'Please sign in to view your cover letters.'
              : 'We could not load your saved cover letters.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCovers();
    return () => {
      cancelled = true;
    };
  }, []);

  // Open cover in builder
  const handleOpenInBuilder = (coverId) => {
    const base = `/cover/create?id=${coverId}`;
    router.push(withChrome ? withChrome(base) : base);
  };

  // Set primary
  const handleSetPrimary = async (coverId) => {
    if (!coverId) return;
    setError('');
    setSettingPrimaryId(coverId);

    try {
      const res = await fetch('/api/cover/setPrimary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverId }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setCovers((prev) =>
        prev.map((c) => ({
          ...c,
          isPrimary: String(c.id) === String(coverId),
        }))
      );
    } catch (err) {
      console.error('[cover setPrimary] failed', err);
      setError('Could not update primary cover letter.');
    } finally {
      setSettingPrimaryId(null);
    }
  };

  // Delete cover
  const handleDelete = async (coverId) => {
    if (!coverId) return;

    const confirmDelete = window.confirm(
      'Are you sure? This will permanently delete this cover letter.'
    );
    if (!confirmDelete) return;

    setError('');
    setDeletingId(coverId);

    try {
      const res = await fetch('/api/cover/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coverId }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Mirror backend: if primary deleted, promote newest remaining locally
      setCovers((prev) => {
        const wasPrimary = prev.some(
          (c) => String(c.id) === String(coverId) && c.isPrimary
        );

        const next = prev.filter((c) => String(c.id) !== String(coverId));

        if (wasPrimary && next.length) {
          const promotedId = String(next[0].id);
          return next.map((c) => ({ ...c, isPrimary: String(c.id) === promotedId }));
        }

        return next;
      });
    } catch (err) {
      console.error('[cover delete] failed', err);
      setError('Could not delete cover letter.');
    } finally {
      setDeletingId(null);
    }
  };

  const renderPrimarySummary = () => {
    if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
    if (error) return <p className="text-sm text-red-600">{error}</p>;
    if (!covers.length)
      return (
        <p className="text-sm text-gray-600">
          No cover letters saved yet. Use the Cover Letter Builder to create one.
        </p>
      );

    if (!primaryCover)
      return (
        <p className="text-sm text-gray-600">
          You have cover letters saved, but none selected.
        </p>
      );

    const name = primaryCover.name?.trim() || 'Untitled cover letter';
    const updated = formatDate(primaryCover.updatedAt);

    return (
      <div className="flex flex-col gap-1">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">{name}</span>
          {updated ? <> · Updated {updated}</> : null}
        </p>
        <button
          onClick={() => handleOpenInBuilder(primaryCover.id)}
          className="text-xs text-orange-600 underline text-left"
        >
          Open in builder to download / edit
        </button>
      </div>
    );
  };

  return (
    <section className="bg-white rounded-2xl shadow-md p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-orange-600 font-bold text-lg">Primary Cover Letter</h3>
        <Link
          href={createHref}
          className="border border-orange-500 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold hover:bg-orange-50"
        >
          New cover letter
        </Link>
      </div>

      {renderPrimarySummary()}

      <p className="text-xs text-gray-500 mt-1">
        This is the cover letter recruiters will see first when they view your profile.
      </p>

      {covers.length > 0 && (
        <>
          <div className="border-t border-gray-200 my-2" />

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Your saved cover letters
            </p>

            <div className="space-y-2">
              {covers.map((cover) => {
                const name = cover.name?.trim() || 'Untitled cover letter';
                const isPrimary = !!cover.isPrimary;
                const updated = formatDate(cover.updatedAt);

                return (
                  <div
                    key={cover.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {name}
                      </p>
                      {updated ? (
                        <p className="text-xs text-gray-500">Updated {updated}</p>
                      ) : (
                        <p className="text-xs text-gray-500"> </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isPrimary && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-800">
                          PRIMARY
                        </span>
                      )}

                      <button
                        onClick={() => handleOpenInBuilder(cover.id)}
                        className="text-xs text-orange-600 underline"
                      >
                        Open
                      </button>

                      <button
                        onClick={() => handleDelete(cover.id)}
                        disabled={deletingId === cover.id}
                        className="text-xs font-semibold px-2 py-1 rounded-full border"
                        style={{
                          borderColor: RED,
                          color: RED,
                          opacity: deletingId === cover.id ? 0.6 : 1,
                        }}
                      >
                        {deletingId === cover.id ? 'Deleting…' : 'Delete'}
                      </button>

                      {!isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(cover.id)}
                          disabled={settingPrimaryId === cover.id}
                          className="text-xs font-semibold px-3 py-1 rounded-full border border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          {settingPrimaryId === cover.id ? 'Saving…' : 'Make primary'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
