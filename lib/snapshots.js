// /lib/snapshots.js
// Lightweight snapshot store using localStorage.
// Can be swapped to Supabase later; keep function signatures.

const KEY = 'ft_saved_resumes';

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}

export function getAllSnapshots() {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(KEY) : '[]';
  return safeParse(raw, []);
}

export function getSnapshot(id) {
  return getAllSnapshots().find(s => s.id === id) || null;
}

export function saveSnapshot(name, payload) {
  const list = getAllSnapshots();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const snapshot = { id, name: name?.trim() || `Snapshot ${new Date().toLocaleString()}`, createdAt: now, payload };
  localStorage.setItem(KEY, JSON.stringify([snapshot, ...list]));
  return snapshot;
}

export function deleteSnapshot(id) {
  const list = getAllSnapshots().filter(s => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
  return true;
}

export function clearAllSnapshots() {
  localStorage.removeItem(KEY);
}
