// components/resume/ResumeRightRail.js
import { useState } from 'react';
import Link from 'next/link';

const ORANGE = '#FF7043';

export default function ResumeRightRail({
  savedResumes = [],
  usage,
  tier,
}) {
  const [workingId, setWorkingId] = useState(null);

  const limitedResumes = (savedResumes || [])
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 3);

  const handleSetPrimary = async (id) => {
    try {
      setWorkingId(id);
      const res = await fetch('/api/resume/setPrimary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: id }),
      });

      if (!res.ok) {
        console.error('[ResumeRightRail] setPrimary failed', await res.text());
        alert('Could not set primary resume yet. Please try again.');
        setWorkingId(null);
        return;
      }

      // For now: hard refresh so the bottom "Primary Resume" card
      // + this rail both show the updated primary.
      window.location.reload();
    } catch (err) {
      console.error('[ResumeRightRail] setPrimary error', err);
      alert('Something went wrong. Please try again.');
      setWorkingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this saved resume? This cannot be undone.')) {
      return;
    }

    try {
      setWorkingId(id);
      const res = await fetch('/api/resume/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        console.error('[ResumeRightRail] delete failed', await res.text());
        alert('Could not delete this resume. Please try again.');
        setWorkingId(null);
        return;
      }

      // Soft refresh: just remove from local list
      const json = await res.json();
      if (json.success) {
        const next = limitedResumes.filter((r) => r.id !== id);
        // we can't directly change parent prop, so just reload for now
        window.location.reload();
      } else {
        alert(json.error || 'Could not delete this resume.');
      }
    } catch (err) {
      console.error('[ResumeRightRail] delete error', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <aside className="space-y-4">
      {/* Continue where you left off */}
      <section className="bg-white rounded-2xl shadow-md p-4">
        <h3 className="font-bold text-sm text-gray-900 mb-2">
          Continue where you left off
        </h3>

        {limitedResumes.length === 0 ? (
          <p className="text-xs text-gray-600">
            Start your first resume to see it here. We’ll keep your recent versions handy.
          </p>
        ) : (
          <div className="space-y-2">
            {limitedResumes.map((resume) => {
              const name = resume.name || 'Untitled Resume';
              const updated =
                resume.updatedAt &&
                new Date(resume.updatedAt).toLocaleDateString();

              return (
                <div
                  key={resume.id}
                  className="border border-gray-200 rounded-xl px-3 py-2 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {name}
                      </div>
                      {updated && (
                        <div className="text-[11px] text-gray-500">
                          Last updated {updated}
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/resume/create?id=${resume.id}`}
                      className="bg-[#FF7043] text-white text-xs font-bold px-3 py-1 rounded-full hover:bg-[#ff865f]"
                    >
                      Continue
                    </Link>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(resume.id)}
                      disabled={workingId === resume.id}
                      className="text-[11px] font-semibold text-[#FF7043] hover:underline disabled:opacity-60"
                    >
                      {workingId === resume.id
                        ? 'Setting…'
                        : 'Make this my primary'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(resume.id)}
                      disabled={workingId === resume.id}
                      className="text-[11px] text-gray-500 hover:text-red-600 hover:underline disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Tips card (unchanged from your earlier design) */}
      <section className="bg-white rounded-2xl shadow-md p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-2">Tips</h3>
        <p className="text-xs text-gray-700 mb-2">
          We recommend <span className="font-semibold">Reverse</span> or{' '}
          <span className="font-semibold">Hybrid</span> for best ATS results.
        </p>
        <p className="text-xs text-gray-700 mb-2">
          Upload an existing resume if you’d rather improve it.
        </p>
        <p className="text-xs text-gray-700">
          Keep one primary resume linked to your profile so recruiters see your best fit first.
        </p>
      </section>

      {/* You can keep your bottom “Need help?” support bubble as-is */}
    </aside>
  );
}
