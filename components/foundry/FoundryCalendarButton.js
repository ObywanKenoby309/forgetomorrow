// components/foundry/FoundryCalendarButton.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import FoundrySchedulerModal from './FoundrySchedulerModal';

const ORANGE = '#FF7043';
const CAN_HOST = ['COACH', 'RECRUITER', 'ADMIN', 'OWNER', 'SITE_ADMIN'];

const S = {
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,112,67,0.09)', border: '1px solid rgba(255,112,67,0.3)',
    color: ORANGE, fontSize: 12, fontWeight: 700, padding: '8px 14px',
    borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.15s', whiteSpace: 'nowrap',
  },
};

export default function FoundryCalendarButton({ onScheduled }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState([]);

  // ALL hooks run unconditionally — no early returns before this line
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

  // Safe to return null here — all hooks already ran
  if (status === 'loading') return null;
  const userRole = String(session?.user?.role || '').toUpperCase();
  if (!CAN_HOST.includes(userRole)) return null;

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