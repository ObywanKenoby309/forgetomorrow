// pages/seeker/applications.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';
import ApplicationForm from '@/components/applications/ApplicationForm';
import ApplicationDetailsModal from '@/components/applications/ApplicationDetailsModal';
import ApplicationsBoard from '@/components/applications/ApplicationsBoard';
import { colorFor } from '@/components/seeker/dashboard/seekerColors';

const STORAGE_KEY = 'applicationsTracker';
const STAGES = ['Pinned', 'Applied', 'Interviewing', 'Offers', 'Rejected'];

// empty tracker: no seeded/demo applications
const EMPTY_TRACKER = {
  Pinned: [],
  Applied: [],
  Interviewing: [],
  Offers: [],
  Rejected: [],
};

// map stage -> palette key
// NOTE: Rejected now uses a neutral palette instead of a "failure/red" color.
const stageKey = (stage) =>
  ({
    Pinned: 'neutral',
    Applied: 'applied',
    Interviewing: 'interviewing',
    Offers: 'offers',
    Rejected: 'neutral', // changed from 'rejected' to 'neutral' for softer UX
  }[stage] || 'info');

function StageStrip({ tracker }) {
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(5, minmax(0,1fr))' }}>
      {STAGES.map((stage) => {
        const count = tracker?.[stage]?.length || 0;
        const c = colorFor(stageKey(stage));
        return (
          <div
            key={stage}
            style={{
              background: c.bg,
              color: c.text,
              border: `1px solid ${c.solid}`,
              borderRadius: 10,
              padding: '10px 12px',
              display: 'grid',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.9 }}>{stage}</div>
            <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{count}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function SeekerApplicationsPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // start empty; only user-created items will appear
  const [tracker, setTracker] = useState(EMPTY_TRACKER);

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' | 'edit'
  const [jobToEdit, setJobToEdit] = useState(null); // { job, stage }
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState({ job: null, stage: null });

  // hydrate from localStorage if user has saved tracker
  useEffect(() => {
    try {
      const saved =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;

      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setTracker({
            Pinned: parsed.Pinned || [],
            Applied: parsed.Applied || [],
            Interviewing: parsed.Interviewing || [],
            Offers: parsed.Offers || [],
            Rejected: parsed.Rejected || [],
          });
        }
      } else {
        // ensure a clean starting state is persisted
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(EMPTY_TRACKER));
        }
      }
    } catch {
      // if anything goes wrong, just keep an empty tracker
      setTracker(EMPTY_TRACKER);
    }
  }, []);

  // persist tracker changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));
      }
    } catch {
      // ignore storage failures
    }
  }, [tracker]);

  const STAGES_LIST = STAGES;

  const addApplication = (app) => {
    const id = Date.now().toString();
    const dateAdded = app.dateAdded || new Date().toISOString().split('T')[0];
    const targetStage = STAGES_LIST.includes(app.status) ? app.status : 'Pinned';
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
    const currentIndex = STAGES_LIST.indexOf(fromStage);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= STAGES_LIST.length) return;

    setTracker((prev) => {
      const item = prev[fromStage].find((j) => j.id === id);
      if (!item) return prev;
      return {
        ...prev,
        [fromStage]: prev[fromStage].filter((j) => j.id !== id),
        [STAGES_LIST[targetIndex]]: [item, ...(prev[STAGES_LIST[targetIndex]] || [])],
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

  const saveEdits = (u) => {
    const {
      id,
      title,
      company,
      location,
      link,
      notes,
      dateAdded,
      status,
      originalStage,
    } = u;

    const targetStage = STAGES_LIST.includes(status) ? status : originalStage;

    setTracker((prev) => {
      const removed = {
        ...prev,
        [originalStage]: prev[originalStage].filter((j) => j.id !== id),
      };
      const updatedJob = { id, title, company, location, link, notes, dateAdded };
      return {
        ...removed,
        [targetStage]: [updatedJob, ...(removed[targetStage] || [])],
      };
    });

    setShowForm(false);
    setJobToEdit(null);

    if (detailsOpen && details.job?.id === id) {
      setDetails({
        job: { id, title, company, location, link, notes, dateAdded },
        stage: targetStage,
      });
    }
  };

  const onView = (job, stage) => {
    setDetails({ job, stage });
    setDetailsOpen(true);
  };

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
      <h1
        style={{
          margin: 0,
          color: '#FF7043',
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        Applications
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 720,
        }}
      >
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
    <SeekerLayout
      title="Applications | ForgeTomorrow"
      header={HeaderBox}
      right={RightRail}
      activeNav="jobs"
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Color-coded stage summary (palette-aligned) */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #eee',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <StageStrip tracker={tracker} />
        </section>

        {/* Board — leftActions (button) + right actions (helper text) */}
        <ApplicationsBoard
          stagesData={tracker}
          compact={false}
          columns={5}
          title="Applications"
          leftActions={
            <button
              onClick={() => {
                setFormMode('add');
                setShowForm(true);
              }}
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
              <Link
                href={withChrome('/seeker-dashboard')}
                style={{ color: '#FF7043', fontWeight: 600 }}
              >
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
          onClose={() => {
            setShowForm(false);
            setJobToEdit(null);
          }}
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
                  dateAdded:
                    jobToEdit.job.dateAdded ||
                    new Date().toISOString().split('T')[0],
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
