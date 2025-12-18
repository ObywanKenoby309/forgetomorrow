// components/profile/ProfileResumeAttach.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const RED = '#C62828';

export default function ProfileResumeAttach({ withChrome }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState([]);
  const [error, setError] = useState('');
  const [settingPrimaryId, setSettingPrimaryId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const createHref = withChrome ? withChrome('/resume/create') : '/resume/create';

  const primaryResume = resumes.find((r) => r.isPrimary) || null;

  // Load resumes
  useEffect(() => {
    let cancelled = false;

    async function loadResumes() {
      try {
        setError('');
        const res = await fetch('/api/resume/list');

        if (!res.ok) {
          if (res.status === 401) throw new Error('AUTH');
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!cancelled) {
          setResumes(Array.isArray(data.resumes) ? data.resumes : []);
        }
      } catch (err) {
        console.error('[ProfileResumeAttach] load error', err);
        if (!cancelled) {
          setError(
            err?.message === 'AUTH'
              ? 'Please sign in to view your resumes.'
              : 'We could not load your saved resumes.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadResumes();
    return () => {
      cancelled = true;
    };
  }, []);

  // Set primary
  const handleSetPrimary = async (resumeId) => {
    if (!resumeId) return;
    setError('');
    setSettingPrimaryId(resumeId);

    try {
      const res = await fetch('/api/resume/setPrimary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Update local state (normalize ids for safe compare)
      setResumes((prev) =>
        prev.map((r) => ({
          ...r,
          isPrimary: String(r.id) === String(resumeId),
        }))
      );
    } catch (err) {
      console.error('set primary failed', err);
      setError('Could not update primary resume.');
    } finally {
      setSettingPrimaryId(null);
    }
  };

  // Open resume in builder
  const handleOpenInBuilder = (resumeId) => {
    const base = `/resume/create?id=${resumeId}`;
    router.push(withChrome ? withChrome(base) : base);
  };

  const formatDate = (d) => {
    try {
      if (!d) return '';
      return new Date(d).toLocaleDateString();
    } catch {
      return '';
    }
  };

  // Delete resume
  const handleDelete = async (resumeId) => {
    if (!resumeId) return;

    const confirmDelete = window.confirm(
      'Are you sure? This will permanently delete this resume.'
    );
    if (!confirmDelete) return;

    setError('');
    setDeletingId(resumeId);

    try {
      const res = await fetch('/api/resume/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resumeId }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Remove from local state
      // ✅ If they deleted the primary, promote the first remaining locally to mirror backend behavior
      setResumes((prev) => {
        const wasPrimary = prev.some(
          (r) => String(r.id) === String(resumeId) && r.isPrimary
        );

        const next = prev.filter((r) => String(r.id) !== String(resumeId));

        if (wasPrimary && next.length) {
          const promotedId = String(next[0].id);
          return next.map((r) => ({ ...r, isPrimary: String(r.id) === promotedId }));
        }

        return next;
      });
    } catch (err) {
      console.error('[delete] failed', err);
      setError('Could not delete resume.');
    } finally {
      setDeletingId(null);
    }
  };

  const renderPrimarySummary = () => {
    if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
    if (error) return <p className="text-sm text-red-600">{error}</p>;
    if (!resumes.length)
      return (
        <p className="text-sm text-gray-600">
          No resumes saved yet. Use the Resume Builder to create one.
        </p>
      );

    if (!primaryResume)
      return <p className="text-sm text-gray-600">You have resumes saved, but none selected.</p>;

    const name = primaryResume.name?.trim() || 'Untitled resume';
    const updated = formatDate(primaryResume.updatedAt);

    return (
      <div className="flex flex-col gap-1">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">{name}</span>
          {updated ? <> · Updated {updated}</> : null}
        </p>
        <button
          onClick={() => handleOpenInBuilder(primaryResume.id)}
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
        <h3 className="text-orange-600 font-bold text-lg">Primary Resume</h3>
        <Link
          href={createHref}
          className="border border-orange-500 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold hover:bg-orange-50"
        >
          Open builder
        </Link>
      </div>

      {renderPrimarySummary()}

      <p className="text-xs text-gray-500 mt-1">
        This is the resume recruiters will see first on your profile.
      </p>

      {resumes.length > 0 && (
        <>
          <div className="border-t border-gray-200 my-2" />

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Your saved resumes</p>

            <div className="space-y-2">
              {resumes.map((resume) => {
                const name = resume.name?.trim() || 'Untitled resume';
                const isPrimary = !!resume.isPrimary;
                const updated = formatDate(resume.updatedAt);

                return (
                  <div
                    key={resume.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
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
                        onClick={() => handleOpenInBuilder(resume.id)}
                        className="text-xs text-orange-600 underline"
                      >
                        Open
                      </button>

                      <button
                        onClick={() => handleDelete(resume.id)}
                        disabled={deletingId === resume.id}
                        className="text-xs font-semibold px-2 py-1 rounded-full border"
                        style={{
                          borderColor: RED,
                          color: RED,
                          opacity: deletingId === resume.id ? 0.6 : 1,
                        }}
                      >
                        {deletingId === resume.id ? 'Deleting…' : 'Delete'}
                      </button>

                      {!isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(resume.id)}
                          disabled={settingPrimaryId === resume.id}
                          className="text-xs font-semibold px-3 py-1 rounded-full border border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          {settingPrimaryId === resume.id ? 'Saving…' : 'Make primary'}
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
