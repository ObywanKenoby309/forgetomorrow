// components/hooks/useSidebarCounts.js
import { useEffect, useState } from 'react';

const SIGNAL_KEY = 'signal_messages_v1';  // { threads:[{ unread, messages:[{read,...}]}], ... }
const CONTACTS_KEY = 'contact_center_v1'; // { incoming:[...], outgoing:[...], contacts:[...] }

function safeParse(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); }
  catch { return null; }
}

// mode = 'messages' (total unread messages) | 'threads' (threads w/ any unread)
function computeSignalCounts(data, mode = 'messages') {
  if (!data?.threads?.length) return 0;
  if (mode === 'messages') {
    // Count all unread messages NOT sent by me
    return data.threads.reduce((sum, t) => {
      const unreadInThread = (t.messages || []).filter(m => m.sender !== 'me' && !m.read).length;
      return sum + unreadInThread;
    }, 0);
  }
  return data.threads.filter(t => (t.unread || 0) > 0).length;
}

function computeConnectionsCounts(data) {
  return data?.incoming?.length || 0; // pending inbound requests
}

export default function useSidebarCounts() {
  const [counts, setCounts] = useState({ signal: 0, connections: 0 });

  const refresh = () => {
    if (typeof window === 'undefined') return;
    const signal = computeSignalCounts(safeParse(SIGNAL_KEY), 'messages');
    const connections = computeConnectionsCounts(safeParse(CONTACTS_KEY));
    setCounts({ signal, connections });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    refresh();

    // Live updates across tabs + local triggers
    const onStorage = (e) => {
      if (!e || e.key == null || [SIGNAL_KEY, CONTACTS_KEY].includes(e.key)) refresh();
    };
    const onTick = () => refresh();

    window.addEventListener('storage', onStorage);
    window.addEventListener('sidebar-counts', onTick);
    document.addEventListener('visibilitychange', onTick);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('sidebar-counts', onTick);
      document.removeEventListener('visibilitychange', onTick);
    };
  }, []);

  return counts;
}

// Call this after you update localStorage for messages/contacts
export function emitSidebarCountsUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sidebar-counts'));
  }
}
