// pages/seeker/applications.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';

import ResumeTrackerSummary from '@/components/ResumeTrackerSummary';
import ApplicationForm from '@/components/applications/ApplicationForm';
import ApplicationDetailsModal from '@/components/applications/ApplicationDetailsModal';
import ApplicationsBoard from '@/components/applications/ApplicationsBoard';

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

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' | 'edit'
  const [jobToEdit, setJobToEdit] = useState(null); // { job, stage }
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState({ job: null, stage: null });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setTracker(JSON.parse(saved));
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(mockTracker));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker)); } catch {}
  }, [tracker]);

  const STAGES_LIST = STAGES;
  const addApplication = (app) => {
    const id = Date.now().toString();
    const dateAdded = app.dateAdded || new Date().toISOString().split('T')[0];
    const targetStage = STAGES_LIST.includes(app.status) ? app.status : 'Pinned';
    const newJob = { id, title: app.title, company: app.company, location: app.location || '', link: app.link || '', notes: app.notes || '', dateAdded };
    setTracker((prev) => ({ ...prev, [targetStage]: [newJob, ...(prev[targetStage] || [])] }));
    setShowForm(false);
  };
  const moveApplication = (id, fromStage, direction) => {
    const currentIndex = STAGES_LIST.indexOf(fromStage);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= STAGES_LIST.length) return;
    setTracker((prev) => {
      const item = prev[fromStage].find((j) => j.id === id);
      if (!item) return prev;
      return {
        ...prev,
        [fromStage]: prev[fromStage].filter((j) => j.id !== id),
        [STAGES_LIST[targetIndex]]: [item, ...prev[STAGES_LIST[targetIndex]]],
      };
    });
  };
  const deleteApplication = (id, stage) => {
    if (!confirm('Delete this application?')) return;
    setTracker((prev) => ({ ...prev, [stage]: prev[stage].filter((j) => j.id !== id) }));
    if (detailsOpen && details.job?.id === id && details.stage === stage) {
      setDetailsOpen(false); setDetails({ job: null, stage: null });
    }
  };
  const startEdit = (job, stage) => { setJobToEdit({ job, stage }); setFormMode('edit'); setShowForm(true); };
  const saveEdits = (u) => {
    const { id, title, company, location, link, notes, dateAdded, status, originalStage } = u;
    const targetStage = STAGES_LIST.includes(status) ? status : originalStage;
    setTracker((prev) => {
      const removed = { ...prev, [originalStage]: prev[originalStage].filter((j) => j.id !== id) };
      const updatedJob = { id, title, company, location, link, notes, dateAdded };
      return { ...removed, [targetStage]: [updatedJob, ...removed[targetStage]] };
    });
    setShowForm(false); setJobToEdit(null);
    if (detailsOpen && details.job?.id === id) setDetails({ job: { id, title, company, location, link, notes, dateAdded }, stage: targetStage });
  };
  const onView = (job, stage) => { setDetails({ job, stage }); setDetailsOpen(true); };

  const HeaderBox = (
    <section style={{
      background: 'white', border: '1px solid #eee', borderRadius: 12, padding: 16,
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)', textAlign: 'center',
    }}>
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>Applications</h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Track your job search across stages, keep notes, and move roles forward.
      </p>
    </section>
  );

  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="applications" />
    </div>
  );

  return (
    <SeekerLayout title="Applications | ForgeTomorrow" header={HeaderBox} right={RightRail} activeNav="jobs">
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Summary */}
        <section style={{ background:'white', borderRadius:12, padding:16, border:'1px solid #eee', boxShadow:'0 2px 6px rgba(0,0,0,0.06)' }}>
          <ResumeTrackerSummary trackerData={tracker} />
        </section>

        {/* Board — leftActions (button) + right actions (helper text) */}
        <ApplicationsBoard
          stagesData={tracker}
          compact={false}
          columns={5}
          title="Applications"
          leftActions={
            <button
              onClick={() => { setFormMode('add'); setShowForm(true); }}
              style={{
                backgroundColor: '#FF7043',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Add Application
            </button>
          }
          actions={
            <span style={{ color: '#607D8B', fontSize: 13 }}>
              or manage on the{' '}
              <Link href="/seeker-dashboard" style={{ color: '#FF7043', fontWeight: 600 }}>
                Dashboard
              </Link>
            </span>
          }
          onMove={moveApplication}
          onDelete={deleteApplication}
          onEdit={startEdit}
          onView={onView}
        />
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
