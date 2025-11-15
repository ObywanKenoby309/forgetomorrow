// lib/auth-client.js
export async function getClientSession() {
  // DEV ONLY — instant login
  if (process.env.NODE_ENV === 'development') {
    return { user: { id: 'dev-user-123' } };
  }

  const token = localStorage.getItem('auth-token');
  if (!token) return null;
  try {
    const res = await fetch('/api/auth/session', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('auth-token');
}