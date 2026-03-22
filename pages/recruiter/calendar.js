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

const ORANGE = '#FF7043';
const MUTED = '#64748B';

export default function RecruiterCalendarPage() {
  const HeaderBox = (
    <section style={{ ...GLASS, borderRadius: 18, padding: 16, textAlign: 'center' }}>
      <div style={{ margin: 0, color: ORANGE, fontSize: 24, fontWeight: 900 }}>
        Recruiter Calendar
      </div>
      <div style={{ marginTop: 6, color: MUTED, maxWidth: 720, fontSize: 14, lineHeight: 1.5, marginInline: 'auto' }}>
        Block interviews, intakes, outreach blocks, and offer milestones — all in one place.
      </div>
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