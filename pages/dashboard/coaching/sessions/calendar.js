// pages/dashboard/coaching/sessions/calendar.js
import React from 'react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CalendarInterface from '@/components/calendar/CalendarInterface';

const STORAGE_KEY = 'coachSessions_v1';

export default function CoachingSessionsCalendarPage() {
  return (
    <CoachingLayout
      title="Sessions Calendar | ForgeTomorrow"
      activeNav="calendar" // <- highlight Calendar in sidebar
      headerDescription="View, add, and manage upcoming coaching sessions in calendar view."
      right={null} // full-width calendar
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      {/* Center column content */}
      <div style={{ display: 'grid', gap: 16, maxWidth: '100%' }}>
        <CalendarInterface
          title="Sessions Calendar"
          storageKey={STORAGE_KEY}
          seed={[]} // <- no fake seed data; calendar starts empty
          typeChoices={['Strategy', 'Resume', 'Interview']}
          statusChoices={['Scheduled', 'Completed', 'No-show']}
          backHref="/dashboard/coaching/sessions"
          addLabel="+ Add Session"
        />
      </div>
    </CoachingLayout>
  );
}
