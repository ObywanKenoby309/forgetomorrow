// components/ContactsList.js
import React from 'react';

export default function ContactsList({ contacts = [], onViewProfile }) {
  if (contacts.length === 0) {
    return <p className="text-gray-500 italic">No contacts found.</p>;
  }

  return (
    <ul className="space-y-4">
      {contacts.map((contact) => (
        <li
          key={contact.id}
          className="flex items-center justify-between p-4 bg-white rounded shadow cursor-pointer hover:bg-[#FF7043] hover:text-white transition"
          onClick={() => onViewProfile(contact)}
          onKeyDown={(e) => e.key === 'Enter' && onViewProfile(contact)}
          role="button"
          tabIndex={0}
          aria-label={`View profile for ${contact.name}`}
        >
          <div className="flex items-center space-x-4">
            <img
              src={contact.photo}
              alt={`${contact.name} profile`}
              className="w-12 h-12 rounded-full border-2 border-[#FF7043]"
            />
            <div>
              <p className="font-semibold">{contact.name}</p>
              <p className="text-sm text-gray-600">{contact.status}</p>
            </div>
          </div>
          <button
            className="text-sm bg-[#FF7043] text-white px-3 py-1 rounded hover:bg-[#F4511E] transition"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile(contact);
            }}
            aria-label={`View profile for ${contact.name}`}
          >
            View Profile
          </button>
        </li>
      ))}
    </ul>
  );
}
