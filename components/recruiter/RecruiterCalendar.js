// components/recruiter/RecruiterCalendar.js

import React, { useEffect, useState, useCallback, useRef } from 'react';
import RecruiterCalendar from '@/components/calendar/RecruiterCalendar';

const STORAGE_KEY = 'recruiterCalendar_live_v1';

export default function RecruiterCalendarComponent() {
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


  return (
  <section
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 16,
      width: "100%",
    }}
  >
    <RecruiterCalendar
      ref={calendarRef}
      title="Month View"
      storageKey={STORAGE_KEY}
      seed={[]}
      onDaySelect={handleDaySelect}
      selectedDate={selectedDate}
    />
  </section>
);
}