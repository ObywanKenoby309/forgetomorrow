// pages/seeker/applications.js
import React, { useEffect, useState, useMemo } from 'react';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
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

    const item = tracker[fromStage].find((j) => j.id === id);
    if (!item) return;

    // Optimistic move
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

    // ── INTERNAL Forge application: notes only, in-place ──────────────────────
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

    // ── EXTERNAL (seeker-owned) cards ─────────────────────────────────────────
    const stageChanged = status !== originalStage;

    // ✅ FIX #3: in-place update when stage hasn't changed — prevents ghost card
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

        // ✅ Remove the optimistic card (old id) and replace with real pinned card
        setTracker((prev) => ({
          ...prev,
          Pinned: [newPinnedCard, ...(prev.Pinned || []).filter((j) => j.id !== id)],
          [originalStage]: (prev[originalStage] || []).filter((j) => j.id !== id),
        }));
      } else {
        // Standard stage-to-stage or same-stage update
        const res = await fetch(`/api/seeker/applications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, company, location, url, notes, status }),
        });
        if (!res.ok) throw new Error('Update application failed');
        const { card } = await res.json();

        // ✅ Reconcile with server response in the correct column
        setTracker((prev) => ({
          ...prev,
          [status]: prev[status].map((j) => (j.id === id ? { ...j, ...card } : j)),
        }));
      }
    } catch (err) {
      console.error('Save edits error:', err);
      // Revert to original state
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

  const GLASS = {
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.58)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  };

  const WHITE_CARD = {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  };

  const PAGE_GLASS_WRAP = {
    ...GLASS,
    padding: 16,
    margin: '24px 0 0',
    width: '100%',
  };

  const HeaderBox = (
    <section style={{ ...GLASS, padding: 16, textAlign: 'center' }}>
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Applications
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Track your job search across stages, keep notes, and move roles forward.
      </p>
    </section>
  );

  // ✅ FIX #2: formInitial now includes locked + isRecruiterControlled
  // so ApplicationForm's isReadOnlyInternal fires correctly for internal cards
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
        locked: jobToEdit.job.locked ?? false,                            // ✅ ADDED
        isRecruiterControlled: jobToEdit.job.isRecruiterControlled ?? false, // ✅ ADDED
      };
    }

    return {
      title: '',
      company: '',
      location: '',
      url: '',
      notes: '',
      dateAdded: new Date().toISOString().split('T')[0],
      status: 'Applied',
    };
  }, [formMode, jobToEdit]);

  if (loading) {
    return (
      <SeekerLayout
        header={HeaderBox}
        right={<RightRailPlacementManager surfaceId="applications" />}
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
      right={<RightRailPlacementManager surfaceId="applications" />}
      rightTopOnly  // ✅ KPI strip (header area) stays contained; kanban board spans full content+right width
      activeNav="jobs"
    >
      <div style={PAGE_GLASS_WRAP}>
        <section style={{ ...WHITE_CARD, padding: 16 }}>
          <StageStrip tracker={tracker} />
        </section>

        <section style={{ ...WHITE_CARD, padding: 16, marginTop: 12 }}>
          <ApplicationsBoard
            key={JSON.stringify(tracker)}
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
            onMove={(id, fromStage, toStage, pinnedId) =>
              moveApplication(id, fromStage, toStage, pinnedId)
            }
            onDelete={deleteApplication}
            onEdit={startEdit}
            onView={onView}
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
        />
      )}
    </SeekerLayout>
  );
}