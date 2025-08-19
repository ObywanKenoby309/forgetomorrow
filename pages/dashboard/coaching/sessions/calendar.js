// pages/dashboard/coaching/sessions/calendar.js
import React from 'react';
import Link from 'next/link';
import CoachingSidebar from '../../../../components/coaching/CoachingSidebar';
import CoachingHeader from '../../../../components/coaching/CoachingHeader';
import CalendarInterface from '../../../../components/calendar/CalendarInterface';

const STORAGE_KEY = 'coachSessions_v1';

const seed = [
  { date: '2025-08-12', time: '09:00', client: 'Alex Turner',  type: 'Strategy',  status: 'Scheduled' },
  { date: '2025-08-12', time: '11:30', client: 'Priya N.',     type: 'Resume',    status: 'Scheduled' },
  { date: '2025-08-12', time: '14:00', client: 'Michael R.',   type: 'Interview', status: 'Scheduled' },
  { date: '2025-08-13', time: '10:00', client: 'Dana C.',      type: 'Strategy',  status: 'Scheduled' },
  { date: '2025-08-15', time: '13:00', client: 'Robert L.',    type: 'Resume',    status: 'Completed' },
  { date: '2025-08-16', time: '09:30', client: 'Jia L.',       type: 'Interview', status: 'No-show'  },
];

export default function CoachingSessionsCalendarPage() {
  return (
    <>
      <CoachingHeader />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '20px',
          padding: '40px 20px 20px',
          minHeight: '100vh',
          backgroundColor: '#ECEFF1',
        }}
      >
        <CoachingSidebar active="sessions" />

        <main style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ maxWidth: 1120 }}>
            <CalendarInterface
              title="Sessions Calendar"
              storageKey={STORAGE_KEY}
              seed={seed}
              typeChoices={['Strategy', 'Resume', 'Interview']}
              statusChoices={['Scheduled', 'Completed', 'No-show']}
              backHref="/dashboard/coaching/sessions"
              addLabel="+ Add Session"
            />
          </div>
        </main>
      </div>
    </>
  );
}
