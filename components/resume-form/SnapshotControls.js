// /components/resume-form/SnapshotControls.js
import { useContext, useState } from 'react';
import Link from 'next/link';
import { ResumeContext } from '../../context/ResumeContext';
import { saveSnapshot } from '../../lib/snapshots';

export default function SnapshotControls({ compact = false }) {
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

      const label =
        (typeof name === 'string' && name.trim()) ||
        `Snapshot — ${new Intl.DateTimeFormat(undefined, {
          month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit'
        }).format(new Date())}`;

      const snap = saveSnapshot(label, payload);
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

  // styles
  const wrap = compact
    ? {
        background: '#fff',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 10,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        display: 'grid',
        gap: 8,
        width: '100%',
      }
    : { background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' };

  const row = compact
    ? { display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }
    : { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' };

  const inputStyleBase = compact
    ? { border: '1px solid #ddd', borderRadius: 10, padding: '8px 10px', height: 36, width: '100%', outline: 'none' }
    : { border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', width: 256, outline: 'none' };

  const inputStyle = { ...inputStyleBase, display: compact ? 'none' : undefined };

  const saveBtn = compact
    ? {
        padding: '8px 10px',
        height: 36,
        background: '#FF7043',
        color: '#fff',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 10,
        fontWeight: 800,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }
    : {
        padding: '10px 12px',
        background: '#FF7043',
        color: '#fff',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 10,
        fontWeight: 800,
        cursor: 'pointer',
      };

  const linkStyle = compact
    ? { color: '#FF7043', fontWeight: 600, textDecoration: 'underline', textAlign: 'right' }
    : { color: '#FF7043', textDecoration: 'underline', fontWeight: 600 };

  return (
    <div className="ft-snapshot-controls" style={wrap}>
      {/* Scoped blockers for legacy toggles */}
      <style jsx global>{`
        .ft-snapshot-controls input[type="checkbox"],
        .ft-snapshot-controls .switch,
        .ft-snapshot-controls .form-switch,
        .ft-snapshot-controls .toggle {
          display: none !important;
        }
        .ft-snapshot-controls *::before,
        .ft-snapshot-controls *::after {
          content: none !important;
          display: none !important;
        }
        .ft-snapshot-controls input::-webkit-contacts-auto-fill-button,
        .ft-snapshot-controls input::-webkit-credentials-auto-fill-button,
        .ft-snapshot-controls input::-ms-clear,
        .ft-snapshot-controls input::-ms-reveal {
          display: none !important;
        }
      `}</style>

      <div style={row}>
        {/* Always render input; hide via CSS in compact to avoid SSR/CSR mismatch */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Snapshot name (optional)"
          aria-label="Snapshot name"
          style={inputStyle}
        />
        <button onClick={handleSave} disabled={saving} style={saveBtn}>
          {saving ? 'Saving…' : 'Save Snapshot'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: compact ? 'flex-end' : 'space-between' }}>
        <Link href="/resume/saved" style={linkStyle}>
          View Saved Versions
        </Link>
      </div>

      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            padding: '10px 12px',
            borderRadius: 12,
            boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
            color: 'white',
            background: toast.type === 'success' ? '#16a34a' : '#dc2626',
            zIndex: 9999,
            fontWeight: 600,
          }}
        >
          <span style={{ marginRight: 6 }}>💾</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
