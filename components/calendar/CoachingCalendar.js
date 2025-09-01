import React from 'react';
import CalendarInterface from './CalendarInterface';

export default function CoachingCalendar(props) {
  return (
    <CalendarInterface
      {...props}
      typeChoices={['Coaching', 'Interview', 'Application', 'Task', 'Appointment']}
    />
  );
}
