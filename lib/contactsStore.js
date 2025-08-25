// lib/contactsStore.js
export const LS_KEYS = {
  CONTACTS: 'ft_contacts_v1',
  GROUPS: 'ft_contact_groups_v1',
  REQUESTS: 'ft_contact_requests_v1',
  FOLLOWS: 'ft_follows_v1', // NEW
};

const parse = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
};

const write = (key, val) => {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

// --- Reads ---
export function readContactsData() {
  const contacts = parse(LS_KEYS.CONTACTS, []);              // [{id, name, photo, groupId?: string}]
  const groups   = parse(LS_KEYS.GROUPS, []);                // [{id, name}]
  const requests = parse(LS_KEYS.REQUESTS, { incoming: [], outgoing: [] });
  const follows  = parse(LS_KEYS.FOLLOWS, { people: [], pages: [], newsletters: [] }); // NEW
  return { contacts, groups, requests, follows };
}

// --- Writes ---
export function saveContacts(contacts) { write(LS_KEYS.CONTACTS, contacts); }
export function saveGroups(groups) { write(LS_KEYS.GROUPS, groups); }
export function saveRequests(requests) { write(LS_KEYS.REQUESTS, requests); }
export function saveFollows(follows) { write(LS_KEYS.FOLLOWS, follows); }

// --- Bulk actions (1 & 2) ---
export function acceptInvite(id) {
  const { contacts, requests } = readContactsData();
  const idx = requests.incoming.findIndex(r => r.id === id);
  if (idx >= 0) {
    const [req] = requests.incoming.splice(idx, 1);
    contacts.push({ id: req.id, name: req.name, photo: req.photo, status: 'Connected' });
    saveRequests(requests);
    saveContacts(contacts);
  }
}
export function declineInvite(id) {
  const data = readContactsData();
  data.requests.incoming = data.requests.incoming.filter(r => r.id !== id);
  saveRequests(data.requests);
}
export function cancelOutgoing(id) {
  const data = readContactsData();
  data.requests.outgoing = data.requests.outgoing.filter(r => r.id !== id);
  saveRequests(data.requests);
}
export function acceptAllIncoming() {
  const { contacts, requests } = readContactsData();
  requests.incoming.forEach(req => {
    contacts.push({ id: req.id, name: req.name, photo: req.photo, status: 'Connected' });
  });
  requests.incoming = [];
  saveContacts(contacts);
  saveRequests(requests);
}
export function cancelAllOutgoing() {
  const data = readContactsData();
  data.requests.outgoing = [];
  saveRequests(data.requests);
}

// --- Groups (3) ---
const rid = () => (globalThis.crypto?.randomUUID?.() || String(Date.now()) + Math.random().toString(36).slice(2));
export function addGroup(name) {
  const groups = parse(LS_KEYS.GROUPS, []);
  const g = { id: rid(), name: name.trim() };
  groups.push(g);
  saveGroups(groups);
  return g;
}
export function assignContactToGroup(contactId, groupId) {
  const contacts = parse(LS_KEYS.CONTACTS, []);
  const c = contacts.find(x => x.id === contactId);
  if (c) { c.groupId = groupId || null; saveContacts(contacts); }
}
export function renameGroup(groupId, newName) {
  const groups = parse(LS_KEYS.GROUPS, []);
  const g = groups.find(x => x.id === groupId);
  if (g) { g.name = newName.trim(); saveGroups(groups); }
}
export function deleteGroup(groupId) {
  const groups = parse(LS_KEYS.GROUPS, []);
  const contacts = parse(LS_KEYS.CONTACTS, []);
  const nextGroups = groups.filter(g => g.id !== groupId);
  contacts.forEach(c => { if (c.groupId === groupId) c.groupId = null; });
  saveGroups(nextGroups); saveContacts(contacts);
}

// --- Follows (4–6) ---
export function followPerson(person) {
  const follows = parse(LS_KEYS.FOLLOWS, { people: [], pages: [], newsletters: [] });
  if (!follows.people.some(p => p.id === person.id)) follows.people.push(person);
  saveFollows(follows);
}
export function unfollowPerson(id) {
  const follows = parse(LS_KEYS.FOLLOWS, { people: [], pages: [], newsletters: [] });
  follows.people = follows.people.filter(p => p.id !== id);
  saveFollows(follows);
}
export function followPage(page) {
  const follows = parse(LS_KEYS.FOLLOWS, { people: [], pages: [], newsletters: [] });
  if (!follows.pages.some(p => p.id === page.id)) follows.pages.push(page);
  saveFollows(follows);
}
export function unfollowPage(id) {
  const follows = parse(LS_KEYS.FOLLOWS, { people: [], pages: [], newsletters: [] });
  follows.pages = follows.pages.filter(p => p.id !== id);
  saveFollows(follows);
}
export function followNewsletter(news) {
  const follows = parse(LS_KEYS.FOLLOWS, { people: [], pages: [], newsletters: [] });
  if (!follows.newsletters.some(n => n.id === news.id)) follows.newsletters.push(news);
  saveFollows(follows);
}
export function unfollowNewsletter(id) {
  const follows = parse(LS_KEYS.FOLLOWS, { people: [], pages: [], newsletters: [] });
  follows.newsletters = follows.newsletters.filter(n => n.id !== id);
  saveFollows(follows);
}
