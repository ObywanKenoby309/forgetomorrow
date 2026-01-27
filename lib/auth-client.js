// lib/auth-client.js
export async function getClientSession(req) {
  // If we're on the server, do NOT touch localStorage, ever.
  if (typeof window === 'undefined') {
    // If you pass req from API routes, you can read Authorization/Cookie here later.
    return null;
  }

  // DEV ONLY — instant login (browser-only)
  if (process.env.NODE_ENV === 'development') {
    return { user: { id: 'dev-user-123' } };
  }

  const token = window.localStorage.getItem('auth-token');
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
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('auth-token');
  }
}
