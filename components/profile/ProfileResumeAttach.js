// components/profile/ProfileResumeAttach.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const ORANGE = '#FF7043';

export default function ProfileResumeAttach({ withChrome }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState([]);
  const [error, setError] = useState('');
  const [settingPrimaryId, setSettingPrimaryId] = useState(null);

  const createHref = withChrome ? withChrome('/resume/create') : '/resume/create';

  const primaryResume = resumes.find((r) => r.isPrimary) || null;

  useEffect(() => {
    let cancelled = false;

    async function loadResumes() {
      try {
        // Expecting { resumes: [{ id, name, updatedAt, isPrimary }, ...] }
        const res = await fetch('/api/resume/list');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) {
          setResumes(Array.isArray(data.resumes) ? data.resumes : []);
        }
      } catch (err) {
        console.error('[ProfileResumeAttach] Failed to load resumes', err);
        if (!cancelled) {
          setError('We could not load your saved resumes.');
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

  const handleSetPrimary = async (resumeId) => {
    if (!resumeId) return;
    setSettingPrimaryId(resumeId);
    setError('');

    try {
      const res = await fetch('/api/resume/setPrimary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Update local state: mark this resume as primary, others false
      setResumes((prev) =>
        prev.map((r) =>
          r.id === resumeId ? { ...r, isPrimary: true } : { ...r, isPrimary: false }
        )
      );
    } catch (err) {
      console.error('[ProfileResumeAttach] Failed to set primary resume', err);
      setError('We could not update your primary resume. Please try again.');
    } finally {
      setSettingPrimaryId(null);
    }
  };

  const handleOpenInBuilder = (resumeId) => {
    if (!resumeId) return;
    const base = `/resume/create?id=${resumeId}`;
    const href = withChrome ? withChrome(base) : base;
    router.push(href);
  };

  const renderPrimarySummary = () => {
    if (loading) {
      return <p className="text-sm text-gray-500">Loading…</p>;
    }

    if (error) {
      return <p className="text-sm text-red-600">{error}</p>;
    }

    if (!resumes.length) {
      return (
        <p className="text-sm text-gray-600">
          No resumes saved yet. Use the Resume Builder to create one and set it as your
          primary.
        </p>
      );
    }

    if (!primaryResume) {
      return (
        <p className="text-sm text-gray-600">
          You have saved resumes, but no primary selected yet. Choose one below.
        </p>
      );
    }

    const displayName =
      primaryResume.name && primaryResume.name.trim()
        ? primaryResume.name
        : 'Untitled resume';

    return (
      <div className="flex flex-col gap-1">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">{displayName}</span>
          {primaryResume.updatedAt && (
            <>
              {' · Last updated '}
              {new Date(primaryResume.updatedAt).toLocaleDateString()}
            </>
          )}
        </p>
        <button
          type="button"
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

      {/* Top summary: what is currently primary (or empty state) */}
      {renderPrimarySummary()}

      <p className="text-xs text-gray-500 mt-1">
        This is the resume recruiters will see first on your ForgeTomorrow profile.
      </p>

      {/* Divider + list of all resumes for choosing primary */}
      {!!resumes.length && (
        <>
          <div className="border-t border-gray-200 my-2" />

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Your saved resumes (choose which one is primary)
            </p>

            <div className="space-y-2">
              {resumes.map((resume) => {
                const displayName =
                  resume.name && resume.name.trim()
                    ? resume.name
                    : 'Untitled resume';

                const isPrimary = !!resume.isPrimary;

                return (
                  <div
                    key={resume.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {resume.updatedAt &&
                          `Updated ${new Date(resume.updatedAt).toLocaleDateString()}`}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenInBuilder(resume.id)}
                        className="text-xs text-orange-600 underline"
                      >
                        Open in builder
                      </button>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isPrimary && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-800">
                          PRIMARY
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(resume.id)}
                        disabled={settingPrimaryId === resume.id || isPrimary}
                        className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                          isPrimary
                            ? 'border-gray-300 text-gray-400 cursor-default'
                            : 'border-orange-500 text-orange-600 hover:bg-orange-50'
                        }`}
                      >
                        {isPrimary
                          ? 'Selected'
                          : settingPrimaryId === resume.id
                          ? 'Saving…'
                          : 'Set as primary'}
                      </button>
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
