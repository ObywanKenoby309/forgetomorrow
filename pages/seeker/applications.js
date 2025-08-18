// pages/seeker/applications.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';

import ResumeTrackerSummary from '@/components/ResumeTrackerSummary';
import ApplicationCard from '@/components/applications/ApplicationCard';
import ApplicationForm from '@/components/applications/ApplicationForm';
import ApplicationDetailsModal from '@/components/applications/ApplicationDetailsModal';

const STORAGE_KEY = 'applicationsTracker';
const STAGES = ['Pinned', 'Applied', 'Interviewing', 'Offers', 'Rejected'];

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

export default function SeekerApplicationsPage() {
  const [tracker, setTracker] = useState(mockTracker);

  // Add/Edit form modal
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' | 'edit'
  const [jobToEdit, setJobToEdit] = useState(null); // { job, stage }

  // Details modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState({ job: null, stage: null });

  // Load/save to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setTracker(JSON.parse(saved));
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(mockTracker));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));
    } catch {}
  }, [tracker]);

  // Actions
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

  const moveApplication = (id, fromStage, direction) => {
    const currentIndex = STAGES.indexOf(fromStage);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= STAGES.length) return;

    setTracker((prev) => {
      const item = prev[fromStage].find((j) => j.id === id);
      if (!item) return prev;
      return {
        ...prev,
        [fromStage]: prev[fromStage].filter((j) => j.id !== id),
        [STAGES[targetIndex]]: [item, ...prev[STAGES[targetIndex]]],
      };
    });
  };

  const deleteApplication = (id, stage) => {
    if (!confirm('Delete this application?')) return;
    setTracker((prev) => ({
      ...prev,
      [stage]: prev[stage].filter((j) => j.id !== id),
    }));
    if (detailsOpen && details.job?.id === id && details.stage === stage) {
      setDetailsOpen(false);
      setDetails({ job: null, stage: null });
    }
  };

  const startEdit = (job, stage) => {
    setJobToEdit({ job, stage });
    setFormMode('edit');
    setShowForm(true);
  };

  const saveEdits = (updated) => {
    const { id, title, company, location, link, notes, dateAdded, status, originalStage } = updated;
    const targetStage = STAGES.includes(status) ? status : originalStage;

    setTracker((prev) => {
      const removed = {
        ...prev,
        [originalStage]: prev[originalStage].filter((j) => j.id !== id),
      };
      const updatedJob = { id, title, company, location, link, notes, dateAdded };
      return {
        ...removed,
        [targetStage]: [updatedJob, ...removed[targetStage]],
      };
    });

    setShowForm(false);
    setJobToEdit(null);

    if (detailsOpen && details.job?.id === id) {
      setDetails({ job: { id, title, company, location, link, notes, dateAdded }, stage: targetStage });
    }
  };

  const onView = (job, stage) => {
    setDetails({ job, stage });
    setDetailsOpen(true);
  };

  // Header (center, top)
  const HeaderBox = (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}
    >
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Applications
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Track your job search across stages, keep notes, and move roles forward.
      </p>
    </section>
  );

  // Right rail (Shortcuts only, to match the rest of seeker UX)
  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="applications" />
    </div>
  );

  return (
    <SeekerLayout
      title="Applications | ForgeTomorrow"
      header={HeaderBox}
      right={RightRail}
      activeNav="jobs" // or 'applications' if you add that key to SeekerSidebar
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Summary */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #eee',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <ResumeTrackerSummary trackerData={tracker} />
        </section>

        {/* Add button */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 12,
            border: '1px solid #eee',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <button
            onClick={() => { setFormMode('add'); setShowForm(true); }}
            style={{
              backgroundColor: '#FF7043',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 8,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            + Add Application
          </button>
          <span style={{ marginLeft: 12, color: '#607D8B', fontSize: 13 }}>
            or manage applications on the{' '}
            <Link href="/seeker-dashboard" style={{ color: '#FF7043', fontWeight: 600 }}>
              Dashboard
            </Link>
          </span>
        </section>

        {/* Board */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 12,
            border: '1px solid #eee',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {STAGES.map((stage) => (
              <div
                key={stage}
                style={{
                  background: 'white',
                  borderRadius: 10,
                  padding: 10,
                  border: '1px solid #eee',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  minHeight: 120,
                  display: 'grid',
                  alignContent: 'start',
                  gap: 8,
                }}
              >
                <h2 style={{ color: '#FF7043', margin: 0, fontSize: 16 }}>{stage}</h2>
                {tracker[stage] && tracker[stage].length > 0 ? (
                  tracker[stage].map((job) => (
                    <ApplicationCard
                      key={job.id}
                      job={job}
                      stage={stage}
                      onMove={moveApplication}
                      onDelete={deleteApplication}
                      onEdit={startEdit}
                      onView={onView}
                      stages={STAGES}
                    />
                  ))
                ) : (
                  <div style={{ color: '#90A4AE', fontSize: 13 }}>No items.</div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Add/Edit Form Modal */}
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

      {/* Details Modal */}
      {detailsOpen && details.job && (
        <ApplicationDetailsModal
          job={details.job}
          stage={details.stage}
          onClose={() => setDetailsOpen(false)}
          onEdit={startEdit}
          onDelete={deleteApplication}
        />
      )}
    </SeekerLayout>
  );
}
