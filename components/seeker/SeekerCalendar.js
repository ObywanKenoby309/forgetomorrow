// components/calendar/SeekerCalendar.js
import React from 'react';
import CalendarInterface from './CalendarInterface';

// Seeker-specific tuning
const SEEKER_EVENT_NUDGE = 0;   // keep inside the cell (0 or small negative/positive)
const SEEKER_WIDTH_DEDUCT = 10; // shrink entries a little to avoid kissing borders

export default function SeekerCalendar(props) {
  return (
    <CalendarInterface
      {...props}
      eventNudge={SEEKER_EVENT_NUDGE}
      eventWidthDeduct={SEEKER_WIDTH_DEDUCT}
    />
  );
}
