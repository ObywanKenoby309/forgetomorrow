// components/calendar/SeekerCalendar.js
import React from 'react';
import CalendarInterface from './CalendarInterface';

/**
 * Thin wrapper so Seeker can have its own tuning without forking logic.
 * Adjust the two props below as needed.
 */
export default function SeekerCalendar(props) {
  return (
    <CalendarInterface
      {...props}
      // Seeker-specific visual tuning:
      eventNudge={-11}        // negative = move left; positive = move right
      eventWidthDeduct={-1}    // shrink width by N px to avoid kissing borders
    />
  );
}
