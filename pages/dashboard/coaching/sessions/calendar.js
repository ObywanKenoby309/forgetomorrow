// pages/dashboard/coaching/sessions/calendar.js
import React from 'react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CalendarInterface from '@/components/calendar/CalendarInterface';

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
    <CoachingLayout
      title="Sessions Calendar | ForgeTomorrow"
      activeNav="sessions"
      headerDescription="View, add, and manage upcoming coaching sessions in calendar view."
      right={null} // <- Give the calendar full width (prevents misalignment)
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      {/* Center column content */}
      <div style={{ display: 'grid', gap: 16, maxWidth: '100%' }}>
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
    </CoachingLayout>
  );
}
