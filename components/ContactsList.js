// components/ContactsList.jsx
import React from 'react';

/**
 * ContactsList
 *
 * Props:
 * - contacts: Array<{ id, name, status?, photo, groupId? }>
 * - groups:   Array<{ id, name }>
 * - onViewProfile?: (contact) => void
 * - onAssignGroup?: (contactId, groupIdOrEmptyString) => void  // optional; shows a group <select> if provided
 */
export default function ContactsList({
  contacts = [],
  groups = [],
  onViewProfile,
  onAssignGroup,
}) {
  if (!contacts.length) {
    return (
      <div className="text-gray-600 italic">
        You don’t have any contacts yet.
      </div>
    );
  }

  const groupNameFor = (gid) =>
    groups.find((g) => g.id === gid)?.name || null;

  return (
    <ul className="grid gap-3">
      {contacts.map((c) => {
        const chip = groupNameFor(c.groupId);

        return (
          <li
            key={c.id}
            className="flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-white"
          >
            {/* Left: avatar + name/status + group chip */}
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={c.photo}
                alt=""
                width={48}
                height={48}
                className="rounded-full border-2 border-[#FF7043] object-cover"
              />
              <div className="min-w-0">
                <div className="font-semibold truncate">{c.name}</div>
                {c.status ? (
                  <div className="text-sm text-gray-600 truncate">
                    {c.status}
                  </div>
                ) : null}

                {/* Group chip */}
                {chip ? (
                  <span className="inline-flex items-center text-xs font-semibold mt-1 px-2 py-0.5 rounded-full bg-[#FFF3E9] text-[#D84315]">
                    {chip}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Optional group assigner */}
              {typeof onAssignGroup === 'function' && (
                <select
                  value={c.groupId || ''}
                  onChange={(e) => onAssignGroup(c.id, e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
                  title="Assign category"
                >
                  <option value="">— Category —</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => onViewProfile?.(c)}
                className="text-sm px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                title="View profile"
              >
                View
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
