// /components/resume-form/SnapshotControls.js
import { useContext, useState } from 'react';
import Link from 'next/link';
import { ResumeContext } from '../../context/ResumeContext';
import { saveSnapshot } from '../../lib/snapshots';

export default function SnapshotControls() {
  const {
    formData, summary, experiences, projects, volunteerExperiences,
    educationList, certifications, languages, skills, achievements, customSections,
  } = useContext(ResumeContext);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [name, setName] = useState('');

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        formData, summary, experiences, projects, volunteerExperiences,
        educationList, certifications, languages, skills, achievements, customSections,
      };
      const snap = saveSnapshot(name, payload);
      setToast({ type: 'success', msg: `Saved “${snap.name}”` });
      setName('');
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setToast({ type: 'error', msg: 'Save failed. Try again.' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this snapshot (optional)"
          className="border rounded px-3 py-2 w-64"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded bg-[#FF7043] text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Snapshot'}
        </button>
      </div>

      <Link href="/resume/saved" className="text-[#FF7043] underline">
        View Saved Versions
      </Link>

      {/* simple toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          <span className="mr-2">💾</span>{toast.msg}
        </div>
      )}
    </div>
  );
}
