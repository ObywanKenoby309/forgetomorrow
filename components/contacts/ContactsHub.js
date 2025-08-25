// components/contacts/ContactsHub.jsx
import { useEffect, useMemo, useState } from 'react';
import { readContactsData } from '@/lib/contactsStore';

// Optional: if you have writeContactsData in your lib, import it.
// If not, we’ll no-op to avoid crashes.
let writeContactsData = null;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  ({ writeContactsData } = require('@/lib/contactsStore'));
} catch {}

export default function ContactsHub() {
  const [tab, setTab] = useState('all'); // 'all' | 'groups' | 'find'
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });

  // find tab state
  const [query, setQuery] = useState('');

  // groups tab state
  const [newGroup, setNewGroup] = useState('');

  useEffect(() => {
    const { contacts, groups, requests } = readContactsData();
    setContacts(contacts || []);
    setGroups(groups || []);
    setRequests(requests || { incoming: [], outgoing: [] });
  }, []);

  const counts = useMemo(
    () => ({
      contacts: contacts.length,
      incoming: requests.incoming?.length || 0,
      outgoing: requests.outgoing?.length || 0,
      groups: groups.length,
    }),
    [contacts, requests, groups]
  );

  const saveGroups = (next) => {
    setGroups(next);
    if (writeContactsData) {
      // Persist back if your store supports it.
      writeContactsData({ contacts, groups: next, requests });
    } else {
      try {
        const payload = { contacts, groups: next, requests };
        localStorage.setItem('contactsHub_v1', JSON.stringify(payload));
      } catch {}
    }
  };

  const addGroup = () => {
    const name = newGroup.trim();
    if (!name) return;
    if (groups.some((g) => g.toLowerCase() === name.toLowerCase())) return alert('Group already exists.');
    saveGroups([...groups, name]);
    setNewGroup('');
  };

  const removeGroup = (name) => {
    if (!confirm(`Remove group "${name}"?`)) return;
    saveGroups(groups.filter((g) => g !== name));
  };

  // Simple components

  const Tab = ({ id, children, badge }) => (
    <button
      onClick={() => setTab(id)}
      className={`px-3 py-2 rounded-md border text-sm font-semibold ${
        tab === id ? 'bg-[#FFF3E9] border-[#ff8a65] text-[#D84315]' : 'bg-white border-[#eee] text-[#374151]'
      }`}
    >
      <span>{children}</span>
      {typeof badge === 'number' && (
        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-[#ECEFF1] text-xs font-bold text-[#374151]">
          {badge}
        </span>
      )}
    </button>
  );

  const ContactRow = ({ c }) => (
    <div className="flex items-center justify-between border-b last:border-b-0 py-3">
      <div className="flex items-center gap-3">
        <img src={c.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
        <div>
          <div className="font-semibold">{c.name}</div>
          <div className="text-xs text-gray-500">{c.status || '—'}</div>
        </div>
      </div>
      <button
        className="text-sm px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
        onClick={() => alert(`Open profile for ${c.name} (coming soon)`)}
      >
        View
      </button>
    </div>
  );

  return (
    <section className="bg-white rounded-lg shadow border border-[#eee] p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-extrabold text-[#FF7043]">Contacts</h1>
        <div className="flex gap-2">
          <Tab id="all" badge={counts.contacts}>All Contacts</Tab>
          <Tab id="groups" badge={counts.groups}>Groups</Tab>
          <Tab id="find">Find</Tab>
        </div>
      </div>

      {/* Panels */}
      {tab === 'all' && (
        <div className="divide-y">
          {contacts.length === 0 ? (
            <div className="text-gray-500">No contacts yet.</div>
          ) : (
            contacts.map((c) => <ContactRow key={c.id} c={c} />)
          )}
        </div>
      )}

      {tab === 'groups' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              placeholder="Create a new group (e.g., Mentors, Hiring Managers)"
              className="flex-1 border rounded-md px-3 py-2"
            />
            <button
              onClick={addGroup}
              className="px-3 py-2 rounded-md bg-[#ff8a65] text-white font-semibold"
            >
              Add Group
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="text-gray-500">No groups yet. Create your first group above.</div>
          ) : (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groups.map((g) => (
                <li key={g} className="border rounded-md p-3 flex items-center justify-between">
                  <div className="font-semibold">{g}</div>
                  <button
                    className="text-sm px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                    onClick={() => removeGroup(g)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'find' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people by name, company, role…"
              className="flex-1 border rounded-md px-3 py-2"
            />
            <button
              className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
              onClick={() => alert(`Search "${query}" (coming soon)`)}
            >
              Search
            </button>
          </div>
          <div className="text-xs text-gray-500">
            (Future: suggestions like “People you may know,” second-degree connections, etc.)
          </div>
        </div>
      )}
    </section>
  );
}
