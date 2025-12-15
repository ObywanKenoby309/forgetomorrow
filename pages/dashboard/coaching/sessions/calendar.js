// pages/dashboard/coaching/sessions/calendar.js
import React, { useEffect, useState, useCallback } from 'react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingSessionsCalendarInterface from '@/components/calendar/CoachingSessionsCalendarInterface';

const API_URL = '/api/coaching/sessions';

function mapRowsToEvents(rows) {
  return rows.map((s) => {
    const date = s.date || s.sessionDate || null;
    const time = s.time || s.sessionTime || '09:00';
    const client =
      s.client ||
      s.clientName ||
      s.client_name ||
      '';

    const clientUserId =
      typeof s.clientId === 'string' && s.clientId.length > 0
        ? s.clientId
        : s.clientUserId || null;

    const clientTypeExplicit =
      s.clientType === 'internal' || s.clientType === 'external'
        ? s.clientType
        : null;

    const clientType =
      clientTypeExplicit ||
      (clientUserId ? 'internal' : 'external');

    return {
      id: s.id,
      date,
      time,
      client,
      clientType,
      clientUserId,
      type: s.type || 'Strategy',
      status: s.status || 'Scheduled',
      notes: s.notes || '',
    };
  });
}

export default function CoachingSessionsCalendarPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const mapped = mapRowsToEvents(rows);

      setSessions(mapped);
    } catch (err) {
      console.error('Error loading sessions for calendar:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return (
    <CoachingLayout
      title="Sessions Calendar | ForgeTomorrow"
      activeNav="calendar"
      headerDescription="This is your command center for coaching time—scan your schedule at a glance."
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
