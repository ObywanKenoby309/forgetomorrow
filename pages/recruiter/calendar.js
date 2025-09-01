import React from 'react';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import RecruiterCalendar from '@/components/calendar/RecruiterCalendar';

const seed = [
  { date: '2025-08-12', time: '09:00', title: 'Intake — ACME (Backend Eng)',  type: 'Intake',     status: 'Scheduled' },
  { date: '2025-08-12', time: '11:00', title: 'Outreach: 8 candidates',       type: 'Outreach',   status: 'Scheduled' },
  { date: '2025-08-13', time: '10:30', title: 'Phone Screen — J. Rivera',     type: 'Interview',  status: 'Scheduled' },
  { date: '2025-08-14', time: '15:00', title: 'Offer Review — Contoso',       type: 'Offer',      status: 'Scheduled' },
];

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
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Recruiter Calendar
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Block interviews, intakes, outreach blocks, and offer milestones—all in one place.
      </p>
    </section>
  );

  return (
    <SeekerLayout
      title="Recruiter Calendar | ForgeTomorrow"
      header={HeaderBox}
      right={null}
      activeNav="calendar"
      forceChrome="recruiter-smb"
      rightVariant="light"
    >
      <div style={{ width: '100%' }}>
        <RecruiterCalendar
          title="Month View"
          seed={seed}            // ✅ optional seeding
        />
      </div>
    </SeekerLayout>
  );
}
