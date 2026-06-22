// pages/seeker/applications.js
import React, { useEffect, useState, useMemo } from 'react';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import ApplicationForm from '@/components/applications/ApplicationForm';
import ApplicationDetailsModal from '@/components/applications/ApplicationDetailsModal';
import ApplicationsBoard from '@/components/applications/ApplicationsBoard';
import InterviewPrepOverlay from '@/components/applications/InterviewPrepOverlay';
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

function StageStrip({ tracker, wrapperStyle }) {
  // ✅ Matches the platform-wide mobile breakpoint (SeekerLayout, etc).
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Mobile stage counts now live inside ApplicationsBoard itself
  // (Board lane headers + Focus tabs), so this strip is desktop-only.
  if (isMobile) return null;

  return (
    <section style={wrapperStyle}>
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(5, minmax(0,1fr))',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
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
                padding: '7px 12px',
                display: 'grid',
                gap: 2,
                textAlign: 'center',
                minWidth: 0,
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.9, whiteSpace: 'nowrap' }}>{stage}</div>
              <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1 }}>{count}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function SeekerApplicationsPage() {
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
  const [prepOpen, setPrepOpen] = useState(false);
  const [prepApplication, setPrepApplication] = useState(null);
  const [addStage, setAddStage] = useState(null);

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

    const item = tracker[fromStage].find((j) => j.id === id);
    if (!item) return;

    setTracker((prev) => ({
      ...prev,
      [fromStage]: prev[fromStage].filter((j) => j.id !== id),
      [toStage]: [item, ...prev[toStage]],
    }));

    try {
      if (fromStage === 'Pinned') {
        const createRes = await fetch('/api/seeker/applications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: item.title,
            company: item.company,
            location: item.location || '',
            url: item.url || '',
            notes: item.notes || '',
            status: toStage,
          }),
        });
        if (!createRes.ok) throw new Error('Create failed');
        const { card: newCard } = await createRes.json();

        await fetch('/api/seeker/pinned-jobs', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pinnedId: item.pinnedId || item.id }),
        });

        setTracker((prev) => ({
          ...prev,
          [toStage]: prev[toStage].map((j) => (j.id === id ? newCard : j)),
        }));
      } else if (toStage === 'Pinned') {
        const pinRes = await fetch('/api/seeker/pinned-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: item.title,
            company: item.company,
            location: item.location || '',
            url: item.url || '',
          }),
        });
        if (!pinRes.ok) throw new Error('Pin failed');
        const { pinned: newPinned } = await pinRes.json();

        const newPinnedCard = {
          pinnedId: newPinned.id,
          id: newPinned.id,
          title: newPinned.title || item.title,
          company: newPinned.company || item.company,
          location: newPinned.location || item.location,
          url: newPinned.url || item.url,
          notes: item.notes || '',
          dateAdded: new Date(newPinned.pinnedAt).toISOString().split('T')[0],
        };

        await fetch(`/api/seeker/applications/${id}`, { method: 'DELETE' });

        setTracker((prev) => ({
          ...prev,
          Pinned: [newPinnedCard, ...(prev.Pinned || []).filter((j) => j.id !== id)],
        }));
      } else {
        const res = await fetch(`/api/seeker/applications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: toStage }),
        });
        if (!res.ok) throw new Error('Patch failed');
      }
    } catch (err) {
      console.error('Move error:', err);
      setTracker((prev) => ({
        ...prev,
        [toStage]: prev[toStage].filter((j) => j.id !== id),
        [fromStage]: [item, ...prev[fromStage]],
      }));
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

  const saveEdits = async (updatedApp) => {
    const { id, title, company, location, url, notes, status, originalStage } = updatedApp;

    const originalItem = tracker[originalStage]?.find((j) => j.id === id);
    if (!originalItem) return;

    const isInternalForgeApp = !!originalItem.jobId && originalStage !== 'Pinned';

    if (isInternalForgeApp) {
      setTracker((prev) => ({
        ...prev,
        [originalStage]: (prev[originalStage] || []).map((j) =>
          j.id === id ? { ...j, notes } : j
        ),
      }));

      try {
        const res = await fetch(`/api/seeker/applications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes, seekerNotes: notes }),
        });
        if (!res.ok) throw new Error('Update internal notes failed');
      } catch (err) {
        console.error('Save internal notes error:', err);
        setTracker((prev) => ({
          ...prev,
          [originalStage]: (prev[originalStage] || []).map((j) =>
            j.id === id ? { ...j, notes: originalItem.notes || '' } : j
          ),
        }));
      } finally {
        setShowForm(false);
        setJobToEdit(null);
      }

      return;
    }

    const stageChanged = status !== originalStage;

    setTracker((prev) => {
      const updatedItem = { ...originalItem, title, company, location, url, notes };
      if (!stageChanged) {
        return {
          ...prev,
          [originalStage]: prev[originalStage].map((j) => (j.id === id ? updatedItem : j)),
        };
      }
      return {
        ...prev,
        [originalStage]: prev[originalStage].filter((j) => j.id !== id),
        [status]: [updatedItem, ...(prev[status] || [])],
      };
    });

    try {
      if (originalStage === 'Pinned') {
        const res = await fetch('/api/seeker/pinned-jobs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pinnedId: originalItem.pinnedId || id,
            title,
            company,
            location,
            url,
          }),
        });
        if (!res.ok) throw new Error('Update pinned failed');
        const { pinned } = await res.json();

        setTracker((prev) => ({
          ...prev,
          [status]: prev[status].map((j) =>
            j.id === id ? { ...j, ...pinned, notes } : j
          ),
        }));
      } else if (status === 'Pinned') {
        const pinRes = await fetch('/api/seeker/pinned-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, company, location, url }),
        });
        if (!pinRes.ok) throw new Error('Pin failed');
        const { pinned } = await pinRes.json();

        const newPinnedCard = {
          pinnedId: pinned.id,
          id: pinned.id,
          title: pinned.title || title,
          company: pinned.company || company,
          location: pinned.location || location,
          url: pinned.url || url,
          notes,
          dateAdded: new Date(pinned.pinnedAt).toISOString().split('T')[0],
        };

        await fetch(`/api/seeker/applications/${id}`, { method: 'DELETE' });

        setTracker((prev) => ({
          ...prev,
          Pinned: [newPinnedCard, ...(prev.Pinned || []).filter((j) => j.id !== id)],
          [originalStage]: (prev[originalStage] || []).filter((j) => j.id !== id),
        }));
      } else {
        const res = await fetch(`/api/seeker/applications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, company, location, url, notes, status }),
        });
        if (!res.ok) throw new Error('Update application failed');
        const { card } = await res.json();

        setTracker((prev) => ({
          ...prev,
          [status]: prev[status].map((j) => (j.id === id ? { ...j, ...card } : j)),
        }));
      }
    } catch (err) {
      console.error('Save edits error:', err);
      setTracker((prev) => {
        if (!stageChanged) {
          return {
            ...prev,
            [originalStage]: prev[originalStage].map((j) => (j.id === id ? originalItem : j)),
          };
        }
        return {
          ...prev,
          [status]: (prev[status] || []).filter((j) => j.id !== id),
          [originalStage]: [originalItem, ...(prev[originalStage] || [])],
        };
      });
    } finally {
      setShowForm(false);
      setJobToEdit(null);
    }
  };

  const onView = (job, stage) => {
    setDetails({ job, stage });
    setDetailsOpen(true);
  };

  const openInterviewPrep = (job, stage) => {
    if (!job?.id) return;
    setPrepApplication({ job, stage });
    setPrepOpen(true);
  };

  const closeInterviewPrep = () => {
    setPrepOpen(false);
    setPrepApplication(null);
  };

  const GLASS = {
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.58)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
  };

  const GLASS_CARD = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: 12,
    boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
  };

const ApplicationsRightRail = (
  <div
    style={{
      width: '100%',
      maxWidth: 218,
      margin: '0 auto -72px',
      padding: '8px',
      borderRadius: 22,
      border: '1px solid rgba(255,112,67,0.16)',
      background:
        'linear-gradient(180deg, rgba(255,244,238,0.56), rgba(255,255,255,0.28))',
      boxShadow: '0 14px 34px rgba(15,23,42,0.10)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      boxSizing: 'border-box',
    }}
  >
    <div
      style={{
        width: '100%',
        transform: 'scale(0.68)',
        transformOrigin: 'top center',
      }}
    >
      <RightRailPlacementManager surfaceId="applications" />
    </div>
  </div>
);

const HeaderBox = (
  <div style={{ display: 'grid', gap: 12, width: '100%', minWidth: 0 }}>
    <SeekerTitleCard
      title="Applications"
      subtitle="Track your job search across stages, keep notes, and move roles forward."
    />

    <StageStrip tracker={tracker} wrapperStyle={{ ...GLASS_CARD, padding: '14px 16px' }} />
  </div>
);

  const formInitial = useMemo(() => {
    if (formMode === 'edit' && jobToEdit) {
      return {
        id: jobToEdit.job.id,
        title: jobToEdit.job.title,
        company: jobToEdit.job.company,
        location: jobToEdit.job.location || '',
        url: jobToEdit.job.url || '',
        notes: jobToEdit.job.notes || '',
        dateAdded: jobToEdit.job.dateAdded || '',
        status: jobToEdit.stage,
        originalStage: jobToEdit.stage,
        jobId: jobToEdit.job.jobId || null,
        locked: jobToEdit.job.locked ?? false,
        isRecruiterControlled: jobToEdit.job.isRecruiterControlled ?? false,
      };
    }

    return {
      title: '',
      company: '',
      location: '',
      url: '',
      notes: '',
      dateAdded: new Date().toISOString().split('T')[0],
      status: addStage || 'Applied',
    };
  }, [formMode, jobToEdit, addStage]);

  if (loading) {
    return (
      <SeekerLayout
  header={HeaderBox}
  right={ApplicationsRightRail}
  rightVariant="light"
  rightTopOnly
>
        <div className="text-center py-20">Loading your applications...</div>
      </SeekerLayout>
    );
  }

  return (
    <SeekerLayout
  title="Applications | ForgeTomorrow"
  header={HeaderBox}
  right={ApplicationsRightRail}
  rightVariant="light"
  rightTopOnly
  activeNav="jobs"
>
      <div style={{ marginTop: 0 }}>
        <section style={{ padding: 0, marginTop: 0 }}>
          <ApplicationsBoard
            key={JSON.stringify(tracker)}
            stagesData={tracker}
            compact={false}
            columns={5}
            onAdd={(stage) => {
              setAddStage(stage || null);
              setFormMode('add');
              setShowForm(true);
            }}
            onMove={(id, fromStage, toStage, pinnedId) =>
              moveApplication(id, fromStage, toStage, pinnedId)
            }
            onDelete={deleteApplication}
            onEdit={startEdit}
            onView={onView}
            onOpenPrep={openInterviewPrep}
          />
        </section>
      </div>

      {showForm && (
        <ApplicationForm
          key={formMode === 'edit' ? `edit-${formInitial?.id}` : 'add'}
          mode={formMode}
          onClose={() => {
            setShowForm(false);
            setJobToEdit(null);
            setAddStage(null);
          }}
          onSave={formMode === 'add' ? addApplication : saveEdits}
          onDelete={
            formMode === 'edit' && jobToEdit
              ? () => deleteApplication(jobToEdit.job, jobToEdit.stage)
              : undefined
          }
          initial={formInitial}
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
          onOpenPrep={openInterviewPrep}
        />
      )}

      <InterviewPrepOverlay
        open={prepOpen}
        applicationId={prepApplication?.job?.id || null}
        applicationLabel={prepApplication?.job?.title || ''}
        onClose={closeInterviewPrep}
      />
    </SeekerLayout>
  );
}