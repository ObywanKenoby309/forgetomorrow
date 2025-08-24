// pages/coaching-dashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';

import KpiStrip from '@/components/coaching/dashboard/KpiStrip';
import UpcomingSessionsCard from '@/components/coaching/dashboard/UpcomingSessionsCard';
import ClientsTable from '@/components/coaching/dashboard/ClientsTable';
import CsatOverview from '@/components/coaching/dashboard/CsatOverview';
import DocsTools from '@/components/coaching/dashboard/DocsTools';
import SectionBlock from '@/components/coaching/dashboard/SectionBlock';
import ClientRequestsCard from '@/components/coaching/dashboard/ClientRequestsCard'; // ← NEW

const STORAGE_KEY = 'coachCSAT_v1';
const SESSIONS_KEY = 'coachSessions_v1';

// (Optional local helper; not required by child components)
function getStatusStyles(status) {
  if (status === 'At Risk') return { background: '#FDECEA', color: '#C62828' };
  if (status === 'New Intake') return { background: '#E3F2FD', color: '#1565C0' };
  return { background: '#E8F5E9', color: '#2E7D32' };
}

export default function CoachingDashboardPage() {
  // ---- CSAT: load from localStorage ----
  const [csat, setCsat] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadCsat = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setCsat(Array.isArray(arr) ? arr : []);
    } catch {
      setCsat([]);
    }
  }, []);

  useEffect(() => {
    loadCsat();
  }, [loadCsat]);

  const refreshCsat = () => {
    setRefreshing(true);
    setTimeout(() => {
      loadCsat();
      setRefreshing(false);
    }, 120);
  };

  const avgScore =
    csat.length > 0
      ? (
          csat.reduce(
            (sum, r) => sum + (Number(r.satisfaction) + Number(r.timeliness) + Number(r.quality)) / 3,
            0
          ) / csat.length
        ).toFixed(1)
      : '—';
  const totalResponses = csat.length;
  const recent = csat.slice(0, 3);

  // ---- Sessions: load from localStorage so Dashboard stays in sync with Sessions/Calendar ----
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
      setSessions(Array.isArray(saved) ? saved : []);
    } catch {
      setSessions([]);
    }
  }, []);

  // ---- KPIs derived from sessions storage ----
  const todayISO = new Date().toISOString().slice(0, 10);
  const sessionsToday = sessions.filter((s) => s.date === todayISO);
  const activeClients = new Set(sessions.map((s) => s.client)).size;

  const kpis = [
    { label: 'Sessions Today', value: sessionsToday.length },
    { label: 'Active Clients', value: activeClients },
    { label: 'Follow-ups Due', value: 6 }, // placeholder until real logic
  ];

  // ---- Upcoming Sessions (next 3 from "now") ----
  const toDate = (d, t) => new Date(`${d}T${t}:00`);
  const now = new Date();
  const upcomingNext3 = sessions
    .filter((s) => toDate(s.date, s.time) >= now)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 3);

  // --- Clients (mock list for the table) ---
  const clients = [
    { name: 'Alex Turner', status: 'Active', next: 'Aug 14, 10:00 AM' },
    { name: 'Priya N.', status: 'Active', next: 'Aug 15, 1:30 PM' },
    { name: 'Michael R.', status: 'At Risk', next: 'Aug 13, 3:00 PM' },
    { name: 'Dana C.', status: 'New Intake', next: 'Aug 16, 9:00 AM' },
    { name: 'Robert L.', status: 'Active', next: 'Aug 19, 2:30 PM' },
  ];

  return (
    <CoachingLayout
      title="Coaching Dashboard | ForgeTomorrow"
      /* ✅ Use the layout's built-in title box like Seeker's look */
      headerTitle="Your Coaching Dashboard"
      headerDescription="Track client progress, manage sessions, and review feedback — all in one place."
      right={<CoachingRightColumn />}
      activeNav="overview"
    >
      {/* CENTER COLUMN CONTENT */}
      <div style={{ display: 'grid', gap: 16, maxWidth: 860 }}>
        {/* 1) Today */}
        <SectionBlock title="Today" padding={12}>
          <KpiStrip items={kpis} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <UpcomingSessionsCard sessions={upcomingNext3} />

            {/* ⬇️ Replaced the simple gray placeholder with an interactive card */}
            <ClientRequestsCard />

            <SimpleCard title="Follow-ups Due">
              <div style={{ color: '#455A64' }}>6 follow-ups due by 5 PM.</div>
            </SimpleCard>
          </div>
        </SectionBlock>

        {/* 2) Clients */}
        <ClientsTable clients={clients} />

        {/* 3) CSAT Overview */}
        <CsatOverview
          csat={csat}
          avgScore={avgScore}
          totalResponses={totalResponses}
          recent={recent}
          refreshing={refreshing}
          onRefresh={refreshCsat}
        />

        {/* 4) Docs & Tools */}
        <DocsTools />
      </div>
    </CoachingLayout>
  );
}

/* ---------- Small helper used for one simple gray card ---------- */
function SimpleCard({ title, children }) {
  return (
    <div
      style={{
        background: '#FAFAFA',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 16,
        minHeight: 120,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
      {children || <div style={{ color: '#90A4AE' }}>Coming soon…</div>}
    </div>
  );
}
