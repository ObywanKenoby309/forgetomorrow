// pages/dashboard/coaching/sessions/calendar.js
import React, { useEffect, useState } from 'react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingSessionsCalendarInterface from '@/components/calendar/CoachingSessionsCalendarInterface';

export default function CoachingSessionsCalendarPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pull live coaching sessions and project them into calendar events
  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      try {
        setLoading(true);
        const res = await fetch('/api/coaching/sessions');

        if (!res.ok) {
          console.error(
            'Failed to load coaching sessions for calendar:',
            res.status
          );
          if (!cancelled) setSessions([]);
          return;
        }

        const data = await res.json().catch(() => ({}));
        const rows = Array.isArray(data) ? data : data.sessions || [];

        // Expected payload from /api/coaching/sessions:
        // { id, date, time, client, type, status, clientId, clientType }
        const mapped = rows.map((s) => ({
          id: s.id,
          date: s.date, // "YYYY-MM-DD"
          time: s.time || '09:00', // "HH:MM"
          title: s.client
            ? `${s.client} – ${s.type || 'Session'}`
            : s.type || 'Session',
          client: s.client || '',
          type: s.type || 'Strategy',
          status: s.status || 'Scheduled',
          notes: s.notes || '',
          participants: s.participants || '', // optional – safe fallback
        }));

        if (!cancelled) {
          setSessions(mapped);
        }
      } catch (err) {
        console.error('Error loading sessions for calendar:', err);
        if (!cancelled) setSessions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSessions();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CoachingLayout
      title="Sessions Calendar | ForgeTomorrow"
      activeNav="calendar"
      headerDescription="This is your command center for coaching time—scan your week at a glance and stay fully booked (in a good way)."
      right={null}
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      <div
        style={{
          display: 'grid',
          gap: 24,
          width: '100%',
          paddingBottom: 8,
        }}
      >
        <CoachingSessionsCalendarInterface
          title={loading ? 'Sessions Calendar (loading…)' : 'Sessions Calendar'}
          events={sessions}
        />
      </div>
    </CoachingLayout>
  );
}
