// components/ContactsList.js
import React from 'react';

export default function ContactsList({
  contacts = [],
  onViewProfile,
  onDisconnect,
  loading = false,
}) {
  if (loading && contacts.length === 0) {
    return <p className="text-gray-500 italic">Loading your contacts…</p>;
  }

  if (contacts.length === 0) {
    return <p className="text-gray-500 italic">No contacts found yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {contacts.map((contact) => {
        const imageSrc =
          contact.avatarUrl || contact.photo || '/demo-profile.jpg';

        const statusText = contact.status || contact.headline || '';

        return (
          <li
            key={contact.id}
            className="flex items-center justify-between p-4 bg-white rounded shadow cursor-pointer hover:bg-[#FF7043] hover:text-white transition"
            onClick={() => onViewProfile?.(contact)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onViewProfile?.(contact);
            }}
            role="button"
            tabIndex={0}
            aria-label={`View profile for ${contact.name || 'Member'}`}
          >
            <div className="flex items-center space-x-4">
              <img
                src={imageSrc}
                alt={`${contact.name || 'Member'} profile`}
                className="w-12 h-12 rounded-full border-2 border-[#FF7043] object-cover bg-gray-200"
              />
              <div>
                <p className="font-semibold">
                  {contact.name || 'Member'}
                </p>
                {statusText && (
                  <p className="text-sm text-gray-600 group-hover:text-white">
                    {statusText}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="text-sm bg-white text-[#FF7043] px-3 py-1 rounded border border-[#FF7043] hover:bg-[#FFF3E9] transition"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile?.(contact);
                }}
                aria-label={`View profile for ${contact.name || 'Member'}`}
              >
                View
              </button>

              <button
                className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  onDisconnect?.(contact);
                }}
                aria-label={`Disconnect from ${contact.name || 'Member'}`}
              >
                Disconnect
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
