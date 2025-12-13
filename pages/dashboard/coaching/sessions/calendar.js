import React from 'react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CalendarInterface from '@/components/calendar/CalendarInterface';

// 🔒 LIVE storage key (no legacy or mock data)
const STORAGE_KEY = 'coachSessions_live_v1';

export default function CoachingSessionsCalendarPage() {
  return (
    <CoachingLayout
      title="Sessions Calendar | ForgeTomorrow"
      activeNav="calendar"
      headerDescription="View, add, and manage upcoming coaching sessions in calendar view."
      right={null} // full-width calendar
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      {/* Full-width calendar */}
      <div style={{ display: 'grid', gap: 16, width: '100%' }}>
        <CalendarInterface
          title="Sessions Calendar"
          storageKey={STORAGE_KEY}
          seed={[]} // 🚫 no mock data — live only
          typeChoices={['Strategy', 'Resume', 'Interview']}
          statusChoices={['Scheduled', 'Completed', 'No-show']}
          backHref="/dashboard/coaching/sessions"
          addLabel="+ Add Session"
        />
      </div>
    </CoachingLayout>
  );
}
