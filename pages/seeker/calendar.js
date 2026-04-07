// pages/seeker/calendar.js
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import { getTimeGreeting } from '@/lib/dashboardGreeting';
import SeekerCalendar from '@/components/calendar/SeekerCalendar';

const STORAGE_KEY = 'seekerCalendar_live_v1';
const API_URL = '/api/seeker/calendar';

export default function SeekerCalendarPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();

  const [events, setEvents] = useState([]);
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
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) {
        console.error('Failed to load seeker calendar items:', res.status);
        setEvents([]);
        return;
      }
      const data = await res.json().catch(() => ({}));
      const items = Array.isArray(data.items) ? data.items : [];
      setEvents(
        items.map((item) => ({
          id: item.id,
          date: item.date ? String(item.date).slice(0, 10) : null,
          time: item.time || '',
          title: item.title || '',
          type: item.type || '',
          status: item.status || '',
          notes: item.notes || '',
        }))
      );
    } catch (err) {
      console.error('Error loading seeker calendar items:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const greeting = getTimeGreeting();

  const HeaderBox = (
    <SeekerTitleCard
      greeting={greeting}
      title="Your Calendar"
      subtitle="Track interviews, application deadlines, and tasks in one place."
    />
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