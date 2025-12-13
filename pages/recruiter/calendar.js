// pages/recruiter/calendar.js
import React from 'react';
import { PlanProvider } from '@/context/PlanContext';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import RecruiterCalendar from '@/components/calendar/RecruiterCalendar';

// 🔒 Live storage key (separate from any old mock keys)
const STORAGE_KEY = 'recruiterCalendar_live_v1';

export default function RecruiterCalendarPage() {
  const HeaderBox = (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          margin: 0,
          color: '#FF7043',
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        Recruiter Calendar
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 720,
        }}
      >
        Block interviews, intakes, outreach blocks, and offer milestones—all in
        one place.
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
        {/* Full-width recruiter calendar, no mock data */}
        <div style={{ width: '100%' }}>
          <RecruiterCalendar
            title="Month View"
            storageKey={STORAGE_KEY}
            seed={[]} // 🚫 no placeholders — live events only
          />
        </div>
      </RecruiterLayout>
    </PlanProvider>
  );
}
