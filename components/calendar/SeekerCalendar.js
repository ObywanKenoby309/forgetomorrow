// components/calendar/SeekerCalendar.js
import React from 'react';
import SeekerCalendarInterface from './SeekerCalendarInterface';

// Kept for compatibility if anything passes these;
// the interface simply ignores them for now.
const SEEKER_EVENT_NUDGE = 0;
const SEEKER_WIDTH_DEDUCT = 10;

export default function SeekerCalendar(props) {
  return (
    <SeekerCalendarInterface
      {...props}
      eventNudge={SEEKER_EVENT_NUDGE}
      eventWidthDeduct={SEEKER_WIDTH_DEDUCT}
    />
  );
}
