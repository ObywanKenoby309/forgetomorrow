// pages/dashboard/coaching/sessions/calendar.js
import React, { useEffect, useState, useCallback } from 'react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingSessionsCalendarInterface from '@/components/calendar/CoachingSessionsCalendarInterface';

const API_URL = '/api/coaching/sessions';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

function mapRowsToEvents(rows) {
  return rows.map((s) => {
    const date   = s.date || s.sessionDate || null;
    const time   = s.time || s.sessionTime || '09:00';
    const client = s.client || s.clientName || s.client_name || '';

    const clientUserId =
      typeof s.clientId === 'string' && s.clientId.length > 0
        ? s.clientId
        : s.clientUserId || null;

    const clientTypeExplicit =
      s.clientType === 'internal' || s.clientType === 'external'
        ? s.clientType
        : null;

    const clientType = clientTypeExplicit || (clientUserId ? 'internal' : 'external');

    return {
      id: s.id,
      date,
      time,
      client,
      clientType,
      clientUserId,
      type:   s.type   || 'Strategy',
      status: s.status || 'Scheduled',
      notes:  s.notes  || '',
    };
  });
}

export default function CoachingSessionsCalendarPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) {
        console.error('Failed to load coaching sessions for calendar');
        setSessions([]);
        return;
      }
      const data = await res.json().catch(() => ({}));
      const rows = Array.isArray(data) ? data : data.sessions || [];
      setSessions(mapRowsToEvents(rows));
    } catch (err) {
      console.error('Error loading sessions for calendar:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const HeaderBox = (
    <section style={{ ...GLASS, padding: 16, textAlign: 'center' }}>
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Sessions Calendar
      </h1>
      <p style={{ margin: '6px auto 0', color: '#546E7A', maxWidth: 720, fontWeight: 600 }}>
        Your command center for coaching time — scan your schedule at a glance.
      </p>
    </section>
  );

  return (
    <CoachingLayout
      title="Sessions Calendar | ForgeTomorrow"
      activeNav="calendar"
      header={HeaderBox}
      right={null}
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      <div style={{ display: 'grid', gap: 24, width: '100%' }}>
        <CoachingSessionsCalendarInterface
          title={loading ? 'Sessions Calendar (loading…)' : 'Sessions Calendar'}
          events={sessions}
          onRefresh={loadSessions}
        />
      </div>
    </CoachingLayout>
  );
}