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

const STAGES = ['Pinned', 'Applied', 'Interviewing', 'Offers', 'Closed Out'];

const stageKey = (stage) =>
  ({
    Pinned: 'neutral',
    Applied: 'applied',
    Interviewing: 'interviewing',
    Offers: 'offers',
    'Closed Out': 'info',
  }[stage] || 'neutral');

function StageStrip({ tracker }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(5, minmax(0,1fr))',
      }}
    >
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
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 12,
                opacity: 0.9,
                whiteSpace: 'nowrap',
              }}
            >
              {stage}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {count}
            </div>
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

  const [tracker, setTracker] = useState({
    Pinned: [],
    Applied: [],
    Interviewing: [],
    Offers: [],
    'Closed Out': [],
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [jobToEdit, setJobToEdit] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState({ job: null, stage: null });

  useEffect(() => {
  async function load() {
    setLoading(true);
    try {
      // Fetch pinned
      const pinnedRes = await fetch('/api/seeker/pinned-jobs');
      const pinnedData = pinnedRes.ok ? await pinnedRes.json() : { jobs: [] };

      // Map pinned to card shape
      const pinnedCards = (pinnedData.jobs || []).map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        worksite: j.worksite,
        compensation: j.compensation,
        type: j.type,
        dateAdded: new Date(j.pinnedAt).toISOString().split('T')[0],
        notes: '',
        url: '',
      }));

      // Fetch applications
      const appsRes = await fetch('/api/seeker/applications');
      const appsData = appsRes.ok ? await appsRes.json() : { applications: {} };

      const grouped = {
        Applied: [],
        Interviewing: [],
        Offers: [],
        'Closed Out': [], // ← fixed with space to match STAGES
      };

      // Map applications to card shape
      Object.keys(appsData.applications || {}).forEach((status) => {
        if (grouped[status]) {
          grouped[status] = appsData.applications[status].map((a) => ({
            ...a,
            dateAdded: a.dateAdded || new Date(a.appliedAt).toISOString().split('T')[0],
          }));
        } else if (status === 'ClosedOut') { // fallback for old data
          grouped['Closed Out'] = appsData.applications[status].map((a) => ({
            ...a,
            dateAdded: a.dateAdded || new Date(a.appliedAt).toISOString().split('T')[0],
          }));
        }
      });

      setTracker({
        Pinned: pinnedCards,
        ...grouped,
      });
    } catch (err) {
      console.error('Load tracker error:', err);
    } finally {
      setLoading(false);
    }
  }
  load();
}, []);

  const addApplication = async (app) => {
  try {
    if (app.status === 'Pinned') {
      // Manual pin
      const res = await fetch('/api/seeker/pinned-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: app.title,
          company: app.company,
          location: app.location,
          url: app.url,
        }),
      });
      if (res.ok) {
        const { pinned } = await res.json();
        const card = {
          id: pinned.id || pinned.jobId,
          title: pinned.title || '',
          company: pinned.company || '',
          location: pinned.location || '',
          url: pinned.url || '',
          notes: '',
          dateAdded: new Date(pinned.pinnedAt).toISOString().split('T')[0],
        };
        setTracker((prev) => ({
          ...prev,
          Pinned: [card, ...prev.Pinned],
        }));
      }
    } else {
      // Regular application
      const res = await fetch('/api/seeker/applications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(app),
      });
      if (res.ok) {
        const { card } = await res.json();
        const targetStage = app.status || 'Applied';
        setTracker((prev) => ({
          ...prev,
          [targetStage]: [card, ...(prev[targetStage] || [])],
        }));
      }
    }
  } catch (err) {
    console.error('Add error:', err);
  }
  setShowForm(false);
};

  const moveApplication = async (id, fromStage, direction) => {
    const currentIndex = STAGES.indexOf(fromStage);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 1 || targetIndex >= STAGES.length) return; // Can't move from/to Pinned with arrows

    const targetStage = STAGES[targetIndex];

    try {
      const res = await fetch(`/api/seeker/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStage }),
      });
      if (res.ok) {
        setTracker((prev) => {
          const item = prev[fromStage].find((j) => j.id === id);
          if (!item) return prev;
          return {
            ...prev,
            [fromStage]: prev[fromStage].filter((j) => j.id !== id),
            [targetStage]: [item, ...(prev[targetStage] || [])],
          };
        });
      }
    } catch (err) {
      console.error('Move application error:', err);
    }
  };

  const deleteApplication = async (id, stage) => {
    if (!confirm('Delete this application?')) return;
    try {
      const res = await fetch(`/api/seeker/applications/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTracker((prev) => ({
          ...prev,
          [stage]: prev[stage].filter((j) => j.id !== id),
        }));
      }
    } catch (err) {
      console.error('Delete application error:', err);
    }
    if (detailsOpen && details.job?.id === id) {
      setDetailsOpen(false);
    }
  };

  const startEdit = (job, stage) => {
    setJobToEdit({ job, stage });
    setFormMode('edit');
    setShowForm(true);
  };

  const saveEdits = async (u) => {
    // Edit not implemented in API yet — placeholder
    alert('Edit coming soon');
    setShowForm(false);
    setJobToEdit(null);
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

  if (loading) {
    return (
      <SeekerLayout header={HeaderBox} right={RightRail}>
        <div className="text-center py-20">Loading your applications...</div>
      </SeekerLayout>
    );
  }

  return (
    <SeekerLayout
      title="Applications | ForgeTomorrow"
      header={HeaderBox}
      right={RightRail}
      activeNav="jobs"
    >
      <div style={{ display: 'grid', gap: 16 }}>
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
      {showForm && (
        <ApplicationForm
          mode={formMode}
          onClose={() => {
            setShowForm(false);
            setJobToEdit(null);
          }}
          onSave={formMode === 'add' ? addApplication : saveEdits}
          onDelete={
            formMode === 'edit' && jobToEdit
              ? (id, stage) => deleteApplication(id, stage)
              : undefined
          }
          initial={
  formMode === 'edit' && jobToEdit
    ? {
        id: jobToEdit.job.id,
        title: jobToEdit.job.title,
        company: jobToEdit.job.company,
        location: jobToEdit.job.location || '',
        url: jobToEdit.job.link || '',
        notes: jobToEdit.job.notes || '',
        dateAdded: jobToEdit.job.dateAdded || new Date().toISOString().split('T')[0],
        status: jobToEdit.stage,
        originalStage: jobToEdit.stage,
      }
    : {
        title: '',
        company: '',
        location: '',
        url: '',
        notes: '',
        dateAdded: new Date().toISOString().split('T')[0],
        status: 'Applied',
      }
}
          stages={STAGES} // include Pinned
        />
      )}
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