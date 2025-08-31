import React, { useEffect, useState } from 'react';

const RESUME_KEY = 'profile_resume_attach_v2';

export default function ProfileResumeAttach({ withChrome }) {
  const [resume, setResume] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => { setResume(localStorage.getItem(RESUME_KEY) || ''); }, []);
  useEffect(() => { try { localStorage.setItem(RESUME_KEY, resume); } catch {} }, [resume]);

  return (
    <section style={{ border: '1px solid #eee', borderRadius: 12, padding: 16, background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, color: '#FF7043' }}>Attached Resume</h3>
        <button onClick={() => setEditOpen(true)} style={{ border: '1px solid #FF7043', color: '#FF7043', padding: '4px 8px', borderRadius: 6 }}>Edit</button>
      </div>
      <p style={{ marginTop: 8 }}>
        {resume ? (
          <>Attached: <a href={withChrome(`/resume/${resume}`)} style={{ color: '#FF7043' }}>View Resume</a></>
        ) : (
          'No resume attached yet.'
        )}
      </p>

      {editOpen && (
        <Dialog title="Attach Resume" onClose={() => setEditOpen(false)}>
          <input
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="Enter resume ID or filename"
            style={{ border: '1px solid #ddd', borderRadius: 6, padding: 8, width: '100%' }}
          />
        </Dialog>
      )}
    </section>
  );
}

function Dialog({ children, title, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'grid', placeItems: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 8, padding: 16, width: 400 }}>
        <h3>{title}</h3>
        {children}
        <button onClick={onClose} style={{ marginTop: 8, background: '#FF7043', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6 }}>Save</button>
      </div>
    </div>
  );
}
