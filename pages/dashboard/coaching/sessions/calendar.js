import React, { useEffect, useState, useCallback } from 'react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingSessionsCalendarInterface from '@/components/calendar/CoachingSessionsCalendarInterface';

export default function CoachingSessionsCalendarPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/coaching/sessions');
      if (!res.ok) {
        console.error('Failed to load coaching sessions for calendar');
        setSessions([]);
        return;
      }

      const data = await res.json().catch(() => ({}));
      const rows = Array.isArray(data) ? data : data.sessions || [];

      const mapped = rows.map((s) => ({
        id: s.id,
        date: s.date,
        time: s.time || '09:00',
        title: s.client
          ? `${s.client} – ${s.type || 'Session'}`
          : s.type || 'Session',
        client: s.client || '',
        type: s.type || 'Strategy',
        status: s.status || 'Scheduled',
        notes: s.notes || '',
        participants: s.participants || '',
      }));

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
