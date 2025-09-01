// components/calendar/SeekerCalendar.js
import React from 'react';
import CalendarInterface from './CalendarInterface';

// Seeker-specific tuning (keeps entries slightly inset inside cells)
const SEEKER_EVENT_NUDGE = 0;
const SEEKER_WIDTH_DEDUCT = 10;

export default function SeekerCalendar(props) {
  return (
    <CalendarInterface
      {...props}
      eventNudge={SEEKER_EVENT_NUDGE}
      eventWidthDeduct={SEEKER_WIDTH_DEDUCT}
    />
  );
}
