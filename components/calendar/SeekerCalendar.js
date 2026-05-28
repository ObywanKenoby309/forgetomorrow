// components/calendar/SeekerCalendar.js
import React, { forwardRef } from 'react';
import SeekerCalendarInterface from './SeekerCalendarInterface';

// Kept for compatibility if anything passes these;
// the interface simply ignores them for now.
const SEEKER_EVENT_NUDGE = 0;
const SEEKER_WIDTH_DEDUCT = 10;

const SeekerCalendar = forwardRef(function SeekerCalendar(props, ref) {
  return (
    <SeekerCalendarInterface
      ref={ref}
      {...props}
      eventNudge={SEEKER_EVENT_NUDGE}
      eventWidthDeduct={SEEKER_WIDTH_DEDUCT}
    />
  );
});

export default SeekerCalendar;
