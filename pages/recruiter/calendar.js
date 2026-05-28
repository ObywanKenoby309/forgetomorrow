import React, { useState, useCallback, memo, useMemo, useRef } from 'react';
import { PlanProvider } from '@/context/PlanContext';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import RecruiterCalendar from '@/components/calendar/RecruiterCalendar';
import RecruiterTitleCard from '@/components/recruiter/RecruiterTitleCard';
import CalendarDayPanel from '@/components/calendar/CalendarDayPanel';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

const STORAGE_KEY = 'recruiterCalendar_live_v1';

// Memoized so RightRailPlacementManager's internal carousel interval
// never triggers a re-render of the calendar above it
// Custom equality — only re-render if date changes or event count/ids change
function rightRailEqual(prev, next) {
  if (prev.selectedDate !== next.selectedDate) return false;
  if (prev.dayEvents.length !== next.dayEvents.length) return false;
  for (let i = 0; i < prev.dayEvents.length; i++) {
    if (prev.dayEvents[i]?.id !== next.dayEvents[i]?.id) return false;
  }
  return true;
}

const CalendarRightRail = memo(function CalendarRightRail({ selectedDate, dayEvents, onAdd, onEdit }) {
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
}, rightRailEqual);

export default function RecruiterCalendarPage() {
  const greeting = getTimeGreeting();

  const [selectedDate, setSelectedDate] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);
  // Stable ref to track last events by date string — prevents memo busting
  const dayEventsRef = useRef([]);

  const handleDaySelect = useCallback((dateStr, events) => {
    setSelectedDate(dateStr);
    // Only update dayEvents if contents actually changed — prevents memo busting
    const next = events || [];
    const prev = dayEventsRef.current;
    const changed = next.length !== prev.length ||
      next.some((e, i) => e?.id !== prev[i]?.id || e?.time !== prev[i]?.time);
    if (changed) {
      dayEventsRef.current = next;
      setDayEvents(next);
    }
  }, []);

  // These are no-ops at page level — RecruiterCalendar owns its own modal
  const handleAdd = useCallback(() => {}, []);
  const handleEdit = useCallback(() => {}, []);

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
          />
        </div>
      </RecruiterLayout>
    </PlanProvider>
  );
}