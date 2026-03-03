// pages/seeker/calendar.js
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerCalendar from '@/components/calendar/SeekerCalendar';

const STORAGE_KEY = 'seekerCalendar_live_v1';
const API_URL     = '/api/seeker/calendar';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

export default function SeekerCalendarPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();

  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * 🚨 HARD GATE — only seekers allowed here.
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

  if (chrome === 'coach' || chrome.startsWith('recruiter')) return null;

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) {
        console.error('Failed to load seeker calendar items:', res.status);
        setEvents([]);
        return;
      }
      const data  = await res.json().catch(() => ({}));
      const items = Array.isArray(data.items) ? data.items : [];
      setEvents(items.map(item => ({
        id:     item.id,
        date:   item.date ? String(item.date).slice(0, 10) : null,
        time:   item.time   || '',
        title:  item.title  || '',
        type:   item.type   || '',
        status: item.status || '',
        notes:  item.notes  || '',
      })));
    } catch (err) {
      console.error('Error loading seeker calendar items:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const HeaderBox = (
    <section style={{ ...GLASS, padding: 16, textAlign: 'center' }}>
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Your Calendar
      </h1>
      <p style={{ margin: '6px auto 0', color: '#546E7A', maxWidth: 720, fontWeight: 600 }}>
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
        title={loading ? 'My Calendar (loading…)' : 'My Calendar'}
        events={events}
        onRefresh={loadEvents}
        storageKey={STORAGE_KEY}
      />
    </SeekerLayout>
  );
}