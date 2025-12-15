// pages/dashboard/coaching/sessions/calendar.js
import React, { useEffect, useState } from 'react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingSessionsCalendarInterface from '@/components/calendar/CoachingSessionsCalendarInterface';

// 🔒 LIVE storage key (keeps any manual-only items the coach adds)
const STORAGE_KEY = 'coachSessions_live_v1';

export default function CoachingSessionsCalendarPage() {
  const [seedEvents, setSeedEvents] = useState([]);
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
          if (!cancelled) setSeedEvents([]);
          return;
        }

        const data = await res.json().catch(() => ({}));
        const rows = Array.isArray(data) ? data : data.sessions || [];

        // API payload shape from /api/coaching/sessions:
        // { id, date, time, client, type, status, clientId, clientType }
        const mapped = rows.map((s) => ({
          id: s.id,
          date: s.date,                 // "YYYY-MM-DD"
          time: s.time || '09:00',      // "HH:MM"
          title: s.client
            ? `${s.client} – ${s.type || 'Session'}`
            : s.type || 'Session',
          client: s.client || '',
          type: s.type || 'Strategy',
          status: s.status || 'Scheduled',
          notes: '',
          // show primary participant(s) under the title in the calendar
          participants: s.client || '',
        }));

        if (!cancelled) {
          setSeedEvents(mapped);
        }
      } catch (err) {
        console.error('Error loading sessions for calendar:', err);
        if (!cancelled) setSeedEvents([]);
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
      headerDescription="This is your command center for coaching time—use Add Session to schedule, and tap any block to edit."
      right={null} // full-width calendar
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
          storageKey={STORAGE_KEY}
          seed={seedEvents}
          typeChoices={['Strategy', 'Resume', 'Interview']}
          statusChoices={['Scheduled', 'Completed', 'No-show']}
          addLabel="+ Add Session"
        />
      </div>
    </CoachingLayout>
  );
}
