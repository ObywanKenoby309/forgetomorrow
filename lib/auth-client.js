// lib/auth-client.js
// Client-side helper for NextAuth session.
// Keep this for legacy imports across the codebase.

export async function getClientSession(timeoutMs = 4000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function logout() {
  try {
    // Avoid importing next-auth/react here (keeps this file dependency-light)
    await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken: "" }).toString(),
    });
  } catch {
    // no-op
  }
}
