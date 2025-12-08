// pages/dashboard/coaching/sessions/calendar.js
import React from 'react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CalendarInterface from '@/components/calendar/CalendarInterface';

const STORAGE_KEY = 'coachSessions_v1';

// No fake demo data — start clean
const seed = [];

export default function CoachingSessionsCalendarPage() {
  return (
    <CoachingLayout
      title="Sessions Calendar | ForgeTomorrow"
      activeNav="calendar"      // ✅ Highlight the Calendar tab
      headerTitle="Sessions Calendar"
      headerDescription="View, add, and manage upcoming coaching sessions in a clean calendar view."
      right={null}              // Full-width calendar
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
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
