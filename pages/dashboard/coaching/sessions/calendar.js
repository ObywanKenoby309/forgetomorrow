// pages/dashboard/coaching/sessions/calendar.js
import React from 'react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CalendarInterface from '@/components/calendar/CalendarInterface';

// 🔒 Live storage key so any old mock data doesn't leak in
const STORAGE_KEY = 'coachSessions_live_v1';

export default function CoachingSessionsCalendarPage() {
  return (
    <CoachingLayout
      title="Sessions Calendar | ForgeTomorrow"
      activeNav="calendar" // calendar tab highlighted in sidebar
      headerDescription="View, add, and manage upcoming coaching sessions in calendar view."
      right={null} // full-width calendar, no right rail
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      {/* Center column content */}
      <div style={{ display: 'grid', gap: 16, maxWidth: '100%' }}>
        <CalendarInterface
          title="Sessions Calendar"
          storageKey={STORAGE_KEY}
          // no fake seed data; calendar will start empty and use whatever the coach adds
          seed={[]}
          typeChoices={['Strategy', 'Resume', 'Interview']}
          statusChoices={['Scheduled', 'Completed', 'No-show']}
          backHref="/dashboard/coaching/sessions"
          addLabel="+ Add Session"
        />
      </div>
    </CoachingLayout>
  );
}
