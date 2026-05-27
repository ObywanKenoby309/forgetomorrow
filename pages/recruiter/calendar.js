// pages/recruiter/calendar.js
import React, { useRef, useState, useCallback } from 'react';
import { PlanProvider } from '@/context/PlanContext';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import RecruiterCalendar from '@/components/calendar/RecruiterCalendar';
import RecruiterTitleCard from '@/components/recruiter/RecruiterTitleCard';
import CalendarDayPanel from '@/components/calendar/CalendarDayPanel';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

const STORAGE_KEY = 'recruiterCalendar_live_v1';

// Right rail: persistent day panel stacked above ads
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

export default function RecruiterCalendarPage() {
  const greeting = getTimeGreeting();
  const calendarActionsRef = useRef({ add: null, edit: null });

  // Lifted state — shared between calendar grid and right rail panel
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);

  const handleDaySelect = useCallback((dateStr, events) => {
    setSelectedDate(dateStr);
    setDayEvents(events || []);
  }, []);

  const handleCalendarActionsReady = useCallback((actions) => {
    calendarActionsRef.current = actions || { add: null, edit: null };
  }, []);

  const handleAdd = useCallback((dateStr) => {
    calendarActionsRef.current?.add?.(dateStr || selectedDate);
  }, [selectedDate]);

  const handleEdit = useCallback((eventId) => {
    calendarActionsRef.current?.edit?.(eventId);
  }, []);

  const HeaderBox = (
    <RecruiterTitleCard
      greeting={greeting}
      title="Recruiter Calendar"
      subtitle="Block interviews, intakes, outreach blocks, and offer milestones."
      compact
    />
  );

  return (
    <PlanProvider>
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
            title="Month View"
            storageKey={STORAGE_KEY}
            seed={[]}
            onDaySelect={handleDaySelect}
            selectedDate={selectedDate}
            onRegisterActions={handleCalendarActionsReady}
          />
        </div>
      </RecruiterLayout>
    </PlanProvider>
  );
}
