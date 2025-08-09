// /pages/resume/saved.js
import Head from 'next/head';
import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/router';
import { getAllSnapshots, getSnapshot, deleteSnapshot } from '../../lib/snapshots';
import { ResumeContext } from '../../context/ResumeContext';

export default function SavedResumesPage() {
  const router = useRouter();
  const [snaps, setSnaps] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const { 
    setFormData, setSummary, setExperiences, setProjects, setVolunteerExperiences,
    setEducationList, setCertifications, setLanguages, setSkills, setAchievements, setCustomSections
  } = useContext(ResumeContext);

  const refresh = () => setSnaps(getAllSnapshots());

  useEffect(() => {
    refresh();
  }, []);

  const loadIntoEditor = (id) => {
    const snap = getSnapshot(id);
    if (!snap) return;
    const p = snap.payload || {};

    // Hydrate context
    setFormData(p.formData || {});
    setSummary(p.summary || '');
    setExperiences(Array.isArray(p.experiences) ? p.experiences : []);
    setProjects(Array.isArray(p.projects) ? p.projects : []);
    setVolunteerExperiences(Array.isArray(p.volunteerExperiences) ? p.volunteerExperiences : []);
    setEducationList(Array.isArray(p.educationList) ? p.educationList : []);
    setCertifications(Array.isArray(p.certifications) ? p.certifications : []);
    setLanguages(Array.isArray(p.languages) ? p.languages : []);
    setSkills(Array.isArray(p.skills) ? p.skills : []);
    setAchievements(Array.isArray(p.achievements) ? p.achievements : []);
    setCustomSections(Array.isArray(p.customSections) ? p.customSections : []);

    // Navigate back to editor
    router.push('/resume/create');
  };

  const handleLoad = async (id) => {
    setLoadingId(id);
    try { loadIntoEditor(id); } finally { setLoadingId(null); }
  };

  const handleDelete = async (id) => {
    const snap = snaps.find(s => s.id === id);
    const name = snap?.name || 'this snapshot';
    if (!confirm(`Delete “${name}”? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      deleteSnapshot(id);
      refresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Head>
        <title>ForgeTomorrow – Saved Versions</title>
      </Head>

      <main className="max-w-5xl mx-auto p-6 space-y-8 min-h-[80vh] bg-[#ECEFF1] text-[#212121]">
        <h1 className="text-3xl font-bold text-[#FF7043]">Saved Versions</h1>
        <p className="text-gray-700">
          These are your local snapshots (saved in your browser). Load any snapshot to continue editing.
        </p>

        {snaps.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
            No snapshots yet. Go to <button onClick={() => location.href='/resume/create'} className="text-[#FF7043] underline">Create</button> and click <strong>Save Snapshot</strong>.
          </div>
        ) : (
          <ul className="space-y-3">
            {snaps.map(snap => (
              <li key={snap.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{snap.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(snap.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLoad(snap.id)}
                    disabled={loadingId === snap.id}
                    className="px-3 py-2 rounded bg-[#FF7043] text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {loadingId === snap.id ? 'Loading…' : 'Load'}
                  </button>
                  <button
                    onClick={() => handleDelete(snap.id)}
                    disabled={deletingId === snap.id}
                    className="px-3 py-2 rounded border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === snap.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
