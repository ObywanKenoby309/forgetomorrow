// lib/coaching/followups.js
const SETTINGS_KEY = 'coachSettings_v1';
const FOLLOWUPS_KEY = 'coachFollowUps_v1';

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- Settings (coach-level) ---------- */
export function getSettings() {
  const s = readJSON(SETTINGS_KEY, {});
  if (typeof s.followupCadenceDays !== 'number') s.followupCadenceDays = 7; // default
  return s;
}
export function saveSettings(next) {
  const cur = getSettings();
  writeJSON(SETTINGS_KEY, { ...cur, ...next });
}

/* ---------- Follow-up items ---------- */
/*
item = {
  id: string,
  clientId: string,
  clientName: string,
  notes?: string,
  cadenceDays?: number,     // if recurring; falls back to settings.followupCadenceDays
  nextDueAt: string,        // ISO
  recurring: boolean,       // true = recurring cadence; false = one-off
  active: boolean,
}
*/
export function getAllFollowUps() {
  return readJSON(FOLLOWUPS_KEY, []);
}
export function saveAllFollowUps(list) {
  writeJSON(FOLLOWUPS_KEY, Array.isArray(list) ? list : []);
}
export function upsertClientFollowUp({ clientId, clientName, nextDueAt, cadenceDays, notes, recurring = true }) {
  const list = getAllFollowUps();
  const id = `fu_${clientId}`;
  const idx = list.findIndex(f => f.id === id);
  const base = {
    id,
    clientId,
    clientName,
    notes: notes || '',
    cadenceDays: typeof cadenceDays === 'number' ? cadenceDays : undefined,
    nextDueAt,
    recurring,
    active: true,
  };
  if (idx >= 0) list[idx] = { ...list[idx], ...base };
  else list.push(base);
  saveAllFollowUps(list);
  return base;
}
export function markDone(id) {
  const list = getAllFollowUps();
  const idx = list.findIndex(f => f.id === id);
  if (idx < 0) return;
  const f = list[idx];
  if (!f.recurring) {
    list[idx].active = false;
  } else {
    const cadence = f.cadenceDays ?? getSettings().followupCadenceDays ?? 7;
    const next = new Date();
    next.setDate(next.getDate() + cadence);
    list[idx].nextDueAt = next.toISOString();
    list[idx].active = true;
  }
  saveAllFollowUps(list);
}
export function snooze(id, days = 1) {
  const list = getAllFollowUps();
  const idx = list.findIndex(f => f.id === id);
  if (idx < 0) return;
  const due = new Date(list[idx].nextDueAt || Date.now());
  due.setDate(due.getDate() + days);
  list[idx].nextDueAt = due.toISOString();
  saveAllFollowUps(list);
}

/* ---------- Query helpers ---------- */
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function endOfWeek(d) {
  const x = new Date(d);
  const day = x.getDay(); // 0=Sun
  const add = 6 - day;
  x.setHours(23, 59, 59, 999);
  x.setDate(x.getDate() + add);
  return x;
}

export function listByWindow(window = 'today') {
  const now = new Date();
  const sToday = startOfDay(now);
  const eToday = endOfDay(now);
  const eWeek = endOfWeek(now);
  const list = getAllFollowUps().filter(f => f.active !== false && f.nextDueAt);
  return list.filter(f => {
    const due = new Date(f.nextDueAt);
    if (window === 'overdue') return due < sToday;
    if (window === 'today') return due <= eToday;
    if (window === 'this_week') return due <= eWeek;
    return true; // 'all'
  });
}
export function countDueToday() {
  return listByWindow('today').length;
}
