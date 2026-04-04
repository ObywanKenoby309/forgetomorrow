import React from 'react';
import { PlanProvider } from '@/context/PlanContext';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import RecruiterCalendar from '@/components/calendar/RecruiterCalendar';
import RecruiterTitleCard from '@/components/recruiter/RecruiterTitleCard';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

const STORAGE_KEY = 'recruiterCalendar_live_v1';

export default function RecruiterCalendarPage() {
  const greeting = getTimeGreeting();

  const HeaderBox = (
    <RecruiterTitleCard
      greeting={greeting}
      title="Recruiter Calendar"
      subtitle="Block interviews, intakes, outreach blocks, and offer milestones - all in one place."
      compact
    />
  );

  return (
    <PlanProvider>
      <RecruiterLayout
        title="Recruiter Calendar | ForgeTomorrow"
        header={HeaderBox}
        headerCard={false}
        right={null}
        activeNav="calendar"
      >
        <div style={{ width: '100%' }}>
          <RecruiterCalendar
            title="Month View"
            storageKey={STORAGE_KEY}
            seed={[]}
          />
        </div>
      </RecruiterLayout>
    </PlanProvider>
  );
}