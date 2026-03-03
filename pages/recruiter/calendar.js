// pages/recruiter/calendar.js
import React from 'react';
import { PlanProvider } from '@/context/PlanContext';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import RecruiterCalendar from '@/components/calendar/RecruiterCalendar';

const STORAGE_KEY = 'recruiterCalendar_live_v1';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

export default function RecruiterCalendarPage() {
  const HeaderBox = (
    <section style={{ ...GLASS, padding: 16, textAlign: 'center' }}>
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Recruiter Calendar
      </h1>
      <p style={{ margin: '6px auto 0', color: '#546E7A', maxWidth: 720, fontWeight: 600 }}>
        Block interviews, intakes, outreach blocks, and offer milestones — all in one place.
      </p>
    </section>
  );

  return (
    <PlanProvider>
      <RecruiterLayout
        title="Recruiter Calendar | ForgeTomorrow"
        header={HeaderBox}
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