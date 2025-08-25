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
import ClientRequestsCard from '@/components/coaching/dashboard/ClientRequestsCard';
import FollowUpsCard from '@/components/coaching/dashboard/FollowUpsCard';

const STORAGE_KEY = 'coachCSAT_v1';
const SESSIONS_KEY = 'coachSessions_v1';

export default function CoachingDashboardPage() {
  // ---- CSAT ----
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
  useEffect(() => { loadCsat(); }, [loadCsat]);

  const refreshCsat = () => {
    setRefreshing(true);
    setTimeout(() => { loadCsat(); setRefreshing(false); }, 120);
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

  // ---- Sessions ----
  const [sessions, setSessions] = useState([]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
      setSessions(Array.isArray(saved) ? saved : []);
    } catch { setSessions([]); }
  }, []);

  // KPIs
  const todayISO = new Date().toISOString().slice(0, 10);
  const sessionsToday = sessions.filter((s) => s.date === todayISO);
  const activeClients = new Set(sessions.map((s) => s.client)).size;
  const kpis = [
    { label: 'Sessions Today', value: sessionsToday.length },
    { label: 'Active Clients', value: activeClients },
    { label: 'Follow-ups Due', value: 6 }, // placeholder until wired to util (optional)
  ];

  // Upcoming (next 3)
  const toDate = (d, t) => new Date(`${d}T${t}:00`);
  const now = new Date();
  const upcomingNext3 = sessions
    .filter((s) => toDate(s.date, s.time) >= now)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 3);

  // Clients (mock)
  const clients = [
    { name: 'Alex Turner', status: 'Active', next: 'Aug 14, 10:00 AM' },
    { name: 'Priya N.', status: 'Active', next: 'Aug 15, 1:30 PM' },
    { name: 'Michael R.', status: 'At Risk', next: 'Aug 13, 3:00 PM' },
    { name: 'Dana C.', status: 'New Intake', next: 'Aug 16, 9:00 AM' },
    { name: 'Robert L.', status: 'Active', next: 'Aug 19, 2:30 PM' },
  ];

  const rowWrapStyle = { display: 'flex', gap: 12, alignItems: 'stretch' };
  const stretchItemStyle = { flex: 1, display: 'flex' };

  return (
    <CoachingLayout
      title="Coaching Dashboard | ForgeTomorrow"
      headerTitle="Your Coaching Dashboard"
      headerDescription="Track client progress, manage sessions, and review feedback — all in one place."
      right={<CoachingRightColumn />}
      activeNav="overview"
      // 👇 NEW: control which sections start open in the CoachingSidebar
      sidebarInitialOpen={{ coaching: false, seeker: false }}
    >
      <div style={{ display: 'grid', gap: 16, maxWidth: 860 }}>
        {/* Today */}
        <SectionBlock title="Today" padding={12}>
          <KpiStrip items={kpis} />
          <div style={rowWrapStyle}>
            <div style={stretchItemStyle}><UpcomingSessionsCard sessions={upcomingNext3} /></div>
            <div style={stretchItemStyle}><ClientRequestsCard /></div>
            <div style={stretchItemStyle}><FollowUpsCard /></div>
          </div>
        </SectionBlock>

        {/* Clients */}
        <ClientsTable clients={clients} />

        {/* CSAT Overview */}
        <CsatOverview
          csat={csat}
          avgScore={avgScore}
          totalResponses={totalResponses}
          recent={recent}
          refreshing={refreshing}
          onRefresh={refreshCsat}
        />

        {/* Docs & Tools */}
        <DocsTools />
      </div>
    </CoachingLayout>
  );
}
