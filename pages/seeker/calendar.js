// pages/seeker/calendar.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import { getTimeGreeting } from '@/lib/dashboardGreeting';
import SeekerCalendar from '@/components/calendar/SeekerCalendar';
import CalendarDayPanel from '@/components/calendar/CalendarDayPanel';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

const STORAGE_KEY = 'seekerCalendar_live_v1';
const API_URL = '/api/seeker/calendar';

function mapItemsToEvents(items) {
  return items.map((item) => ({
    id: item.id,
    date: item.date ? String(item.date).slice(0, 10) : null,
    time: item.time || '09:00',
    timezone:
      item.timezone ||
      item.foundryTimezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'America/New_York',
    title: item.title || '',
    type: item.type || 'Interview',
    status: item.status || 'Scheduled',
    notes: item.notes || '',
    source: item.source || 'personal',
    sourceItemId: item.sourceItemId || null,
    enableVideo: Boolean(item.enableVideo || item.foundryRoomId || item.foundryJoinUrl || item.foundryGuestJoinUrl),
    foundryRoomId: item.foundryRoomId || null,
    foundryJoinUrl: item.foundryJoinUrl || null,
    foundryGuestJoinUrl: item.foundryGuestJoinUrl || null,
    foundryTimezone: item.foundryTimezone || item.timezone || null,
  }));
}

function CalendarRightRail({ selectedDate, dayEvents, onAdd, onEdit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', marginBottom: -24 }}>
        <RightRailPlacementManager />
      </div>

      <CalendarDayPanel
        selectedDate={selectedDate}
        events={dayEvents}
        onAdd={onAdd}
        onEdit={onEdit}
      />
    </div>
  );
}

export default function SeekerCalendarPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);
  const calendarRef = useRef(null);

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
      const mapped = mapItemsToEvents(items);

      setEvents(mapped);

      setDayEvents((current) => {
        if (!selectedDate) return current;
        return mapped.filter((event) => event.date === selectedDate);
      });
    } catch (err) {
      console.error('Error loading seeker calendar items:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [router, selectedDate]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  if (chrome === 'coach' || chrome.startsWith('recruiter')) return null;

  const handleDaySelect = useCallback((dateStr, eventsForDate) => {
    setSelectedDate(dateStr);
    setDayEvents(eventsForDate || []);
  }, []);

  const handleAdd = useCallback((dateStr) => {
    calendarRef.current?.openAdd?.(dateStr);
  }, []);

  const handleEdit = useCallback((id) => {
    calendarRef.current?.openEdit?.(id);
  }, []);

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
      right={
        <CalendarRightRail
          selectedDate={selectedDate}
          dayEvents={dayEvents}
          onAdd={handleAdd}
          onEdit={handleEdit}
        />
      }
      rightVariant="light"
      activeNav="calendar"
    >
      <SeekerCalendar
        ref={calendarRef}
        title={loading ? 'My Calendar (loading…)' : 'My Calendar'}
        events={events}
        onRefresh={loadEvents}
        onDaySelect={handleDaySelect}
        selectedDate={selectedDate}
        storageKey={STORAGE_KEY}
      />
    </SeekerLayout>
  );
}
