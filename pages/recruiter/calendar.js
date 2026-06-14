// pages/recruiter/calendar.js
// Matches coach calendar pattern exactly — no PlanProvider, no memo complexity.
// PlanProvider was causing router.replace + plan polling to re-render the whole
// page tree every few seconds, causing the scroll freeze.

import React, { useEffect, useState, useCallback, useRef } from 'react';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import RecruiterCalendar from '@/components/calendar/RecruiterCalendar';
import RecruiterTitleCard from '@/components/recruiter/RecruiterTitleCard';
import CalendarDayPanel from '@/components/calendar/CalendarDayPanel';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

const STORAGE_KEY = 'recruiterCalendar_live_v1';

// Plain function — no memo needed since parent no longer re-renders on a timer
function CalendarRightRail({ selectedDate, dayEvents, onAdd, onEdit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <RightRailPlacementManager />
      <CalendarDayPanel
        selectedDate={selectedDate}
        events={dayEvents}
        onAdd={onAdd}
        onEdit={onEdit}
      />
    </div>
  );
}

export default function RecruiterCalendarPage() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);
  const calendarRef = useRef(null);

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
    <RecruiterTitleCard
      greeting={greeting}
      title="Recruiter Calendar"
      subtitle="Block interviews, intakes, outreach blocks, and offer milestones - all in one place."
      compact
    />
  );

  return (
    <RecruiterLayout
      title="Recruiter Calendar | ForgeTomorrow"
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
      activeNav="calendar"
    >
      <div style={{ width: '100%' }}>
        <RecruiterCalendar
          ref={calendarRef}
          title="Month View"
          storageKey={STORAGE_KEY}
          seed={[]}
          onDaySelect={handleDaySelect}
          selectedDate={selectedDate}
        />
      </div>
    </RecruiterLayout>
  );
}