// pages/applications.js
import React, { useEffect, useState } from 'react';
import SeekerSidebar from '../components/SeekerSidebar';
import ResumeTrackerSummary from '../components/ResumeTrackerSummary';
import ApplicationCard from '../components/applications/ApplicationCard';
import AddApplicationForm from '../components/applications/AddApplicationForm';

const STORAGE_KEY = 'applicationsTracker';

const STAGES = ["Pinned", "Applied", "Interviewing", "Offers", "Rejected"];

const mockTracker = {
  Pinned: [
    { id: 'p1', title: 'Success Manager — Acme', company: 'Acme', location: 'Remote', dateAdded: '2025-08-08' },
    { id: 'p2', title: 'Ops Manager — Northwind', company: 'Northwind', location: 'Nashville, TN', dateAdded: '2025-08-06' },
  ],
  Applied: [
    { id: 'a1', title: 'Director of Support — OpenPhone', company: 'OpenPhone', location: 'Remote', dateAdded: '2025-08-05' },
    { id: 'a2', title: 'Customer Success Lead — Rhythm', company: 'Rhythm', location: 'Remote', dateAdded: '2025-08-04' },
  ],
  Interviewing: [
    { id: 'i1', title: 'Strategic Ops Manager — Taproot', company: 'Taproot', location: 'Remote', dateAdded: '2025-08-07' },
  ],
  Offers: [
    { id: 'o1', title: 'Client Success Leader — Experity', company: 'Experity', location: 'Remote', dateAdded: '2025-08-03' },
  ],
  Rejected: [
    { id: 'r1', title: 'EA — Belay', company: 'Belay', location: 'Remote', dateAdded: '2025-08-02' },
  ],
};

export default function ApplicationsPage() {
  const [tracker, setTracker] = useState(mockTracker);
  const [showAddModal, setShowAddModal] = useState(false);

  // Load from localStorage
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

  const addApplication = (app) => {
    setTracker((prev) => ({
      ...prev,
      Pinned: [{ ...app, id: Date.now().toString(), dateAdded: new Date().toISOString().split('T')[0] }, ...prev.Pinned],
    }));
    setShowAddModal(false);
  };

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

  const deleteApplication = (id, stage) => {
    if (!confirm('Delete this application?')) return;
    setTracker((prev) => ({
      ...prev,
      [stage]: prev[stage].filter((job) => job.id !== id),
    }));
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

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            alignSelf: 'flex-start',
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
                  />
                ))
              ) : (
                <div style={{ color: '#90A4AE' }}>No items.</div>
              )}
            </div>
          ))}
        </div>
      </main>

      {showAddModal && <AddApplicationForm onClose={() => setShowAddModal(false)} onSave={addApplication} />}
    </div>
  );
}
