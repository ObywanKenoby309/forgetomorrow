// pages/dashboard/coaching/sessions/calendar.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingTitleCard from '@/components/coaching/CoachingTitleCard';
import CoachingSessionsCalendarInterface from '@/components/calendar/CoachingSessionsCalendarInterface';
import CalendarDayPanel from '@/components/calendar/CalendarDayPanel';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

const API_URL = '/api/coaching/sessions';

function mapRowsToEvents(rows) {
  return rows.map((s) => {
    const date = s.date || s.sessionDate || null;
    const time = s.time || s.sessionTime || '09:00';
    const timezone =
      s.timezone ||
      s.foundryTimezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'America/New_York';
    const client = s.client || s.clientName || s.client_name || '';

    const clientUserId =
      typeof s.clientId === 'string' && s.clientId.length > 0
        ? s.clientId
        : s.clientUserId || null;

    const clientTypeExplicit =
      s.clientType === 'internal' || s.clientType === 'external'
        ? s.clientType
        : null;

    const clientType = clientTypeExplicit || (clientUserId ? 'internal' : 'external');

    return {
      id: s.id,
      date,
      time,
      timezone,
      client,
      title: client,
      clientType,
      clientUserId,
      type: s.type || 'Strategy',
      status: s.status || 'Scheduled',
      notes: s.notes || '',
      source: s.source || 'coach',
    };
  });
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

export default function CoachingSessionsCalendarPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);
  const calendarRef = useRef(null);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) {
        console.error('Failed to load coaching sessions for calendar');
        setSessions([]);
        return;
      }
      const data = await res.json().catch(() => ({}));
      const rows = Array.isArray(data) ? data : data.sessions || [];
      const mapped = mapRowsToEvents(rows);
      setSessions(mapped);

      setDayEvents((current) => {
        if (!selectedDate) return current;
        return mapped.filter((event) => event.date === selectedDate);
      });
    } catch (err) {
      console.error('Error loading sessions for calendar:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleDaySelect = useCallback((dateStr, events) => {
    setSelectedDate(dateStr);
    setDayEvents(events || []);
  }, []);

  const handleAdd = useCallback((dateStr) => {
    calendarRef.current?.openAdd?.(dateStr);
  }, []);

  const handleEdit = useCallback((id) => {
    calendarRef.current?.openEdit?.(id);
  }, []);

  const greeting = getTimeGreeting();

  const HeaderBox = (
    <CoachingTitleCard
      greeting={greeting}
      title="Sessions Calendar"
      subtitle="Your command center for coaching time — scan your schedule at a glance."
      compact
    />
  );

  return (
    <CoachingLayout
      title="Sessions Calendar | ForgeTomorrow"
      activeNav="calendar"
      header={HeaderBox}
      headerCard={false}
      right={
        <CalendarRightRail
          selectedDate={selectedDate}
          dayEvents={dayEvents}
          onAdd={handleAdd}
          onEdit={handleEdit}
        />
      }
      rightVariant="light"
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      <div style={{ display: 'grid', gap: 24, width: '100%' }}>
        <CoachingSessionsCalendarInterface
          ref={calendarRef}
          title={loading ? 'Sessions Calendar (loading…)' : 'Sessions Calendar'}
          events={sessions}
          onRefresh={loadSessions}
          onDaySelect={handleDaySelect}
          selectedDate={selectedDate}
        />
      </div>
    </CoachingLayout>
  );
}
