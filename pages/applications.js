// pages/applications.js
import React, { useEffect, useState } from 'react';
import SeekerSidebar from '../components/SeekerSidebar';
import ResumeTrackerSummary from '../components/ResumeTrackerSummary';
import ApplicationCard from '../components/applications/ApplicationCard';
import ApplicationForm from '../components/applications/ApplicationForm';

const STORAGE_KEY = 'applicationsTracker';
const STAGES = ["Pinned", "Applied", "Interviewing", "Offers", "Rejected"];

const mockTracker = {
  Pinned: [
    { id: 'p1', title: 'Success Manager — Acme', company: 'Acme', location: 'Remote', dateAdded: '2025-08-08', link: '', notes: '' },
    { id: 'p2', title: 'Ops Manager — Northwind', company: 'Northwind', location: 'Nashville, TN', dateAdded: '2025-08-06', link: '', notes: '' },
  ],
  Applied: [
    { id: 'a1', title: 'Director of Support — OpenPhone', company: 'OpenPhone', location: 'Remote', dateAdded: '2025-08-05', link: '', notes: '' },
    { id: 'a2', title: 'Customer Success Lead — Rhythm', company: 'Rhythm', location: 'Remote', dateAdded: '2025-08-04', link: '', notes: '' },
  ],
  Interviewing: [
    { id: 'i1', title: 'Strategic Ops Manager — Taproot', company: 'Taproot', location: 'Remote', dateAdded: '2025-08-07', link: '', notes: '' },
  ],
  Offers: [
    { id: 'o1', title: 'Client Success Leader — Experity', company: 'Experity', location: 'Remote', dateAdded: '2025-08-03', link: '', notes: '' },
  ],
  Rejected: [
    { id: 'r1', title: 'EA — Belay', company: 'Belay', location: 'Remote', dateAdded: '2025-08-02', link: '', notes: '' },
  ],
};

export default function ApplicationsPage() {
  const [tracker, setTracker] = useState(mockTracker);

  // modal state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' | 'edit'
  const [jobToEdit, setJobToEdit] = useState(null); // { job, stage }

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setTracker(JSON.parse(saved));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockTracker));
    }
  }, []);

  // Save to localStorage whenever tracker changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));
  }, [tracker]);

  // Add new application (respects selected status)
  const addApplication = (app) => {
    const id = Date.now().toString();
    const dateAdded = app.dateAdded || new Date().toISOString().split('T')[0];
    const targetStage = STAGES.includes(app.status) ? app.status : 'Pinned';
    const newJob = {
      id,
      title: app.title,
      company: app.company,
      location: app.location || '',
      link: app.link || '',
      notes: app.notes || '',
      dateAdded,
    };
    setTracker((prev) => ({
      ...prev,
      [targetStage]: [newJob, ...(prev[targetStage] || [])],
    }));
    setShowForm(false);
  };

  // Move application by arrows
  const moveApplication = (id, fromStage, direction) => {
    const currentIndex = STAGES.indexOf(fromStage);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= STAGES.length) return;

    setTracker((prev) => {
      const item = prev[fromStage].find((job) => job.id === id);
      if (!item) return prev;
      return {
        ...prev,
        [fromStage]: prev[fromStage].filter((job) => job.id !== id),
        [STAGES[targetIndex]]: [{ ...item }, ...prev[STAGES[targetIndex]]],
      };
    });
  };

  // Delete application
  const deleteApplication = (id, stage) => {
    if (!confirm('Delete this application?')) return;
    setTracker((prev) => ({
      ...prev,
      [stage]: prev[stage].filter((job) => job.id !== id),
    }));
  };

  // Start edit
  const startEdit = (job, stage) => {
    setJobToEdit({ job, stage });
    setFormMode('edit');
    setShowForm(true);
  };

  // Save edits (may also change stage)
  const saveEdits = (updated) => {
    const { id, title, company, location, link, notes, dateAdded, status, originalStage } = updated;
    const targetStage = STAGES.includes(status) ? status : originalStage;

    setTracker((prev) => {
      // remove from original stage
      const removed = {
        ...prev,
        [originalStage]: prev[originalStage].filter((j) => j.id !== id),
      };
      // insert into target stage at top
      const updatedJob = { id, title, company, location, link, notes, dateAdded };
      return {
        ...removed,
        [targetStage]: [updatedJob, ...removed[targetStage]],
      };
    });

    setShowForm(false);
    setJobToEdit(null);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '20px',
        padding: '120px 20px 20px',
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      }}
    >
      <SeekerSidebar />

      <main style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ResumeTrackerSummary trackerData={tracker} />

        <div>
          <button
            onClick={() => { setFormMode('add'); setShowForm(true); }}
            style={{
              backgroundColor: '#FF7043',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            + Add Application
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
          {STAGES.map((stage) => (
            <div key={stage} style={{ background: 'white', borderRadius: '12px', padding: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
              <h2 style={{ color: '#FF7043', marginTop: 0 }}>{stage}</h2>
              {tracker[stage] && tracker[stage].length > 0 ? (
                tracker[stage].map((job) => (
                  <ApplicationCard
                    key={job.id}
                    job={job}
                    stage={stage}
                    onMove={moveApplication}
                    onDelete={deleteApplication}
                    onEdit={startEdit}
                    stages={STAGES}
                  />
                ))
              ) : (
                <div style={{ color: '#90A4AE' }}>No items.</div>
              )}
            </div>
          ))}
        </div>
      </main>

      {showForm && (
        <ApplicationForm
          mode={formMode}
          onClose={() => { setShowForm(false); setJobToEdit(null); }}
          onSave={formMode === 'add' ? addApplication : saveEdits}
          initial={
            formMode === 'edit' && jobToEdit
              ? {
                  id: jobToEdit.job.id,
                  title: jobToEdit.job.title,
                  company: jobToEdit.job.company,
                  location: jobToEdit.job.location || '',
                  link: jobToEdit.job.link || '',
                  notes: jobToEdit.job.notes || '',
                  dateAdded: jobToEdit.job.dateAdded || new Date().toISOString().split('T')[0],
                  status: jobToEdit.stage,
                  originalStage: jobToEdit.stage,
                }
              : {
                  title: '',
                  company: '',
                  location: '',
                  link: '',
                  notes: '',
                  dateAdded: new Date().toISOString().split('T')[0],
                  status: 'Pinned',
                }
          }
          stages={STAGES}
        />
      )}
    </div>
  );
}
