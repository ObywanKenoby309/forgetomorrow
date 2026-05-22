// components/ContactsList.js
import React from 'react';
import MemberAvatarActions from '@/components/member/MemberAvatarActions';

export default function ContactsList({
  contacts = [],
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
    <ul className="space-y-3">
      {contacts.map((contact) => {
        const imageSrc  = contact.avatarUrl || contact.photo || '/demo-profile.jpg';
        const name      = contact.name || 'Member';
        const subText   = contact.headline || contact.status || '';

        return (
          <li
            key={contact.id}
            className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar — MemberAvatarActions handles View portfolio, Message, Connect */}
              <MemberAvatarActions
                targetUserId={contact.id}
                targetUserSlug={contact.slug}
                targetName={name}
              >
                <img
                  src={imageSrc}
                  alt={`${name} profile`}
                  className="w-11 h-11 rounded-full border-2 border-[#FF7043] object-cover bg-gray-200 cursor-pointer flex-shrink-0"
                />
              </MemberAvatarActions>

              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{name}</p>
                {subText && <p className="text-sm text-gray-500 truncate">{subText}</p>}
              </div>
            </div>

            {/* Disconnect is contact-specific — stays as an explicit button */}
            <button
              type="button"
              className="text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 transition flex-shrink-0 ml-3"
              onClick={() => onDisconnect?.(contact)}
              aria-label={`Disconnect from ${name}`}
            >
              Disconnect
            </button>
          </li>
        );
      })}
    </ul>
  );
}