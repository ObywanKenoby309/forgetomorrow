// pages/seeker/calendar.js
import React from 'react';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerCalendar from '@/components/calendar/SeekerCalendar';

const STORAGE_KEY = 'seekerCalendar_v1';

const seed = [
  { date: '2025-08-12', time: '09:00', client: 'Phone Screen — Acme',       type: 'Interview',   status: 'Scheduled' },
  { date: '2025-08-12', time: '13:00', client: 'Submit Resume to Northwind', type: 'Application', status: 'Scheduled' },
  { date: '2025-08-13', time: '10:00', client: 'Portfolio Review',           type: 'Task',        status: 'Scheduled' },
];

export default function SeekerCalendarPage() {
  const HeaderBox = (
    <section style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', border: '1px solid #eee', textAlign: 'center' }}>
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>Your Calendar</h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        Track interviews, application deadlines, and tasks in one place.
      </p>
    </section>
  );

  return (
    <SeekerLayout title="Calendar | ForgeTomorrow" header={HeaderBox} right={null} activeNav="calendar">
      <div style={{ maxWidth: 1120 }}>
        <SeekerCalendar
          title="Month View"
          storageKey={STORAGE_KEY}
          seed={seed}
          typeChoices={['Interview', 'Application', 'Task']}
          statusChoices={['Scheduled', 'Completed', 'No-show']}
          addLabel="+ Add Item"
        />
      </div>
    </SeekerLayout>
  );
}
