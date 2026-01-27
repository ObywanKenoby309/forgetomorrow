// lib/auth-client.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getTokenSafe() {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem("auth-token");
  } catch {
    return null;
  }
}

/**
 * Universal session helper.
 * - Server/API: pass (req, res) -> uses next-auth getServerSession (NO localStorage).
 * - Client: no args -> uses bearer token stored in localStorage (guarded).
 */
export async function getClientSession(req, res) {
  // Server path (API routes)
  if (req) {
    try {
      return await getServerSession(req, res || {}, authOptions);
    } catch {
      return null;
    }
  }

  // DEV ONLY — instant login (client convenience)
  if (process.env.NODE_ENV === "development") {
    return { user: { id: "dev-user-123" } };
  }

  // Client path (guarded localStorage)
  const token = getTokenSafe();
  if (!token) return null;

  try {
    const res = await fetch("/api/auth/session", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function logout() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem("auth-token");
  } catch {
    // ignore
  }
}
