// components/EventList.js
import React from 'react';

export default function EventList({ events = [], onEventDetails }) {
  if (events.length === 0) {
    return <p className="text-gray-500 italic">No upcoming events</p>;
  }

  return (
    <ul className="space-y-4 max-h-64 overflow-y-auto">
      {events.map((event) => (
        <li
          key={event.id}
          className="p-4 rounded border border-gray-300 hover:bg-gray-100 cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => onEventDetails(event)}
          onKeyDown={(e) => e.key === 'Enter' && onEventDetails(event)}
          aria-label={`View details for ${event.title}`}
        >
          <h3 className="font-semibold text-gray-900">{event.title}</h3>
          <p className="text-gray-600">{event.datetime}</p>
          <p className="text-gray-600 text-sm">{event.description}</p>
        </li>
      ))}
    </ul>
  );
}
