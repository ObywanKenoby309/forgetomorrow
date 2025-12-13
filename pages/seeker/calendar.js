// pages/seeker/calendar.js
import React from 'react';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerCalendar from '@/components/calendar/SeekerCalendar';

// 🔒 New LIVE storage key to prevent legacy mock bleed-through
const STORAGE_KEY = 'seekerCalendar_live_v1';

export default function SeekerCalendarPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();

  // Decide which sidebar nav key to use based on chrome:
  // - Native seeker → "calendar"
  // - Coach / Recruiter chrome → "seeker-calendar" (Seeker Tools section)
  const chromeKey = chrome || 'seeker';
  const activeNav =
    chromeKey === 'coach' || chromeKey.startsWith('recruiter')
      ? 'seeker-calendar'
      : 'calendar';

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
        Your Calendar
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 720,
        }}
      >
        Track interviews, application deadlines, and tasks in one place.
      </p>
    </section>
  );

  return (
    <SeekerLayout
      title="Calendar | ForgeTomorrow"
      header={HeaderBox}
      right={null}
      activeNav={activeNav}
    >
      {/* Full-width calendar, live mode only */}
      <SeekerCalendar
        title="Month View"
        storageKey={STORAGE_KEY}
        seed={[]} // 🚫 no mock data — live only
        // omit typeChoices/statusChoices to use full defaults
      />
    </SeekerLayout>
  );
}
