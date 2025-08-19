// components/seeker/SeekerCalendar.js
// Thin wrapper so we can reuse the exact same calendar component Seekers-side.
// ⬇️ If your coaches calendar lives at a different path/name, update this import.
import CalendarInterface from '@/components/CalendarInterface';

export default function SeekerCalendarPage() {
  return <CalendarInterface />;
}
