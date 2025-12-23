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
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.9, whiteSpace: 'nowrap' }}>{stage}</div>
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
        const pinnedRes = await fetch('/api/seeker/pinned-jobs');
        const pinnedData = pinnedRes.ok ? await pinnedRes.json() : { jobs: [] };
        const pinnedCards = (pinnedData.jobs || []).map((j) => ({
          pinnedId: j.pinnedId,
          jobId: j.jobId || null,
          id: j.pinnedId,
          title: j.title,
          company: j.company,
          location: j.location,
          worksite: j.worksite,
          compensation: j.compensation,
          type: j.type,
          dateAdded: new Date(j.pinnedAt).toISOString().split('T')[0],
          notes: '',
          url: j.url || '',
        }));

        const appsRes = await fetch('/api/seeker/applications');
        const appsData = appsRes.ok ? await appsRes.json() : { applications: {} };
        const grouped = {
          Applied: [],
          Interviewing: [],
          Offers: [],
          'Closed Out': [],
        };
        Object.keys(appsData.applications || {}).forEach((status) => {
          if (grouped[status]) grouped[status] = appsData.applications[status];
          else if (status === 'ClosedOut') grouped['Closed Out'] = appsData.applications[status];
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
            pinnedId: pinned.id,
            jobId: pinned.jobId || null,
            id: pinned.id,
            title: pinned.title || app.title || '',
            company: pinned.company || app.company || '',
            location: pinned.location || app.location || '',
            url: pinned.url || app.url || '',
            notes: '',
            dateAdded: new Date(pinned.pinnedAt).toISOString().split('T')[0],
          };
          setTracker((prev) => ({
            ...prev,
            Pinned: [card, ...prev.Pinned],
          }));
        }
      } else {
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

  const moveApplication = async (id, fromStage, toStage, pinnedId) => {
    if (fromStage === toStage) return;

    // Special: Pinned -> Applied only
    if (fromStage === 'Pinned' && toStage === 'Applied') {
      const pinnedItem = tracker[fromStage].find((j) => j.id === id);
      if (!pinnedItem) return;

      try {
        const createRes = await fetch('/api/seeker/applications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: pinnedItem.title,
            company: pinnedItem.company,
            location: pinnedItem.location || '',
            url: pinnedItem.url || '',
            notes: pinnedItem.notes || '',
            status: 'Applied',
          }),
        });

        if (!createRes.ok) throw new Error('Create failed');

        const createData = await createRes.json();
        const createdCard = createData.card;

        await fetch('/api/seeker/pinned-jobs', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pinnedId: pinnedItem.pinnedId || pinnedItem.id }),
        });

        setTracker((prev) => ({
          ...prev,
          Pinned: prev.Pinned.filter((j) => j.id !== id),
          Applied: [createdCard, ...prev.Applied],
        }));
      } catch (err) {
        console.error('Pinned -> Applied error:', err);
      }
      return;
    }

    // Block moving into Pinned
    if (toStage === 'Pinned') return;

    // Normal application move
    try {
      const res = await fetch(`/api/seeker/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: toStage }),
      });

      if (!res.ok) throw new Error('Patch failed');

      setTracker((prev) => {
        const item = prev[fromStage].find((j) => j.id === id);
        if (!item) return prev;
        return {
          ...prev,
          [fromStage]: prev[fromStage].filter((j) => j.id !== id),
          [toStage]: [item, ...prev[toStage]],
        };
      });
    } catch (err) {
      console.error('Move application error:', err);
    }
  };

  const deleteApplication = async (job, stage) => {
    if (!confirm('Delete this item?')) return;
    try {
      if (stage === 'Pinned') {
        await fetch('/api/seeker/pinned-jobs', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pinnedId: job.pinnedId || job.id }),
        });
      } else {
        await fetch(`/api/seeker/applications/${job.id}`, { method: 'DELETE' });
      }
      setTracker((prev) => ({
        ...prev,
        [stage]: prev[stage].filter((j) => j.id !== job.id),
      }));
    } catch (err) {
      console.error('Delete error:', err);
    }
    if (detailsOpen && details.job?.id === job.id) setDetailsOpen(false);
  };

  const startEdit = (job, stage) => {
    setJobToEdit({ job, stage });
    setFormMode('edit');
    setShowForm(true);
  };

  const saveEdits = async () => {
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
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Applications
      </h1>
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
          onMove={(id, fromStage, toStage, pinnedId) =>
            moveApplication(id, fromStage, toStage, pinnedId)
          }
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
                  dateAdded:
                    jobToEdit.job.dateAdded || new Date().toISOString().split('T')[0],
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
          stages={STAGES}
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