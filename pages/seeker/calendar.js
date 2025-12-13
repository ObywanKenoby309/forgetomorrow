// pages/seeker/calendar.js
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerCalendar from '@/components/calendar/SeekerCalendar';

// 🔒 Live storage key — no mock bleed
const STORAGE_KEY = 'seekerCalendar_live_v1';

export default function SeekerCalendarPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();

  /**
   * 🚨 HARD GATE
   * Only SEEKERS are allowed on this page.
   * Coaches / Recruiters are redirected to their own calendar.
   */
  useEffect(() => {
    if (chrome === 'coach') {
      router.replace('/dashboard/coaching/sessions/calendar');
      return;
    }

    if (chrome.startsWith('recruiter')) {
      router.replace('/dashboard/recruiter/calendar');
      return;
    }
  }, [chrome, router]);

  // If someone is being redirected, render nothing
  if (chrome === 'coach' || chrome.startsWith('recruiter')) {
    return null;
  }

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
      activeNav="calendar"
    >
      <SeekerCalendar
        title="Month View"
        storageKey={STORAGE_KEY}
        seed={[]} // 🚫 LIVE ONLY
      />
    </SeekerLayout>
  );
}
