// components/foundry/FoundryCalendarButton.js
// Drop this into the seeker and recruiter calendar pages.
// Renders an "Open a Foundry" button that triggers the scheduler modal.
// Styled light to match the platform calendar UI.

import { useState, useEffect } from 'react';
import FoundrySchedulerModal from './FoundrySchedulerModal';

const ORANGE = '#FF7043';

const S = {
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,112,67,0.1)', border: '1px solid rgba(255,112,67,0.3)',
    color: ORANGE, fontSize: 12, fontWeight: 700, padding: '8px 14px',
    borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
};

export default function FoundryCalendarButton({ onScheduled }) {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    if (!open) return;
    fetch('/api/contacts/list')
      .then(r => r.json())
      .then(data => {
        if (data.contacts) {
          setContacts(data.contacts.map(c => ({
            id: c.contactUserId || c.id,
            name: c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unknown',
            avatarUrl: c.avatarUrl || null,
          })));
        }
      })
      .catch(() => {});
  }, [open]);

  return (
    <>
      <button style={S.btn} onClick={() => setOpen(true)}>
        🔨 Schedule a Foundry
      </button>

      {open && (
        <FoundrySchedulerModal
          dark={false}
          contacts={contacts}
          onClose={() => setOpen(false)}
          onScheduled={(result) => {
            setOpen(false);
            onScheduled?.(result);
          }}
        />
      )}
    </>
  );
}