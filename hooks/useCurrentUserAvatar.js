// hooks/useCurrentUserAvatar.js
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

/**
 * Minimal hook to get the current user's avatar URL, display name, and initials.
 * Prefer session payload for instant UI; fallback to /api/auth/me only if needed.
 *
 * RULE: do not mark "loading=false" unless we are certain:
 * - session has avatar, OR
 * - /api/auth/me returns OK (even if avatarUrl is null), OR
 * - unauthenticated
 *
 * If /api/auth/me errors or returns non-OK, stay loading so UI shows skeleton (no letters).
 */

function computeInitials(user) {
  if (!user) return "FT";
  const first = String(user.firstName || "").trim();
  const last  = String(user.lastName  || "").trim();
  if (first && last)  return (first[0] + last[0]).toUpperCase();
  if (first)          return first.slice(0, 2).toUpperCase();
  const full = String(user.name || user.email || "").trim();
  if (full) {
    const parts = full.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return full.slice(0, 2).toUpperCase();
  }
  return "FT";
}

function computeDisplayName(user) {
  if (!user) return "";
  const first = String(user.firstName || "").trim();
  const last  = String(user.lastName  || "").trim();
  if (first || last) return `${first} ${last}`.trim();
  return String(user.name || "").trim();
}

export function useCurrentUserAvatar() {
  const sessionHook = typeof useSession === "function" ? useSession() : null;
  const status = sessionHook?.status || "loading";
  const session = sessionHook?.data || null;

  // ✅ Instant source (no fetch): session already contains avatarUrl after NextAuth update
  const sessionAvatarUrl = useMemo(() => {
    const u = session?.user || null;
    return u && (u.avatarUrl || u.image) ? u.avatarUrl || u.image : null;
  }, [session]);

  // ✅ Initialize from session immediately to avoid first-paint null → later avatar "pop"
  const [avatarUrl, setAvatarUrl] = useState(sessionAvatarUrl);
  const [userData, setUserData] = useState(null);

  // ✅ "loading" means: we have NOT conclusively determined avatar vs no-avatar yet
  const [loading, setLoading] = useState(status === "loading");

  useEffect(() => {
    let cancelled = false;

    async function fetchCurrentUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });

        // ❗ If this call fails or returns non-OK, we are NOT sure.
        // Keep loading=true so UI shows skeleton (no letters) until session catches up.
        if (!res.ok) return;

        const data = await res.json();
        const url = data?.user?.avatarUrl || data?.user?.image || null;

        if (cancelled) return;

        // ✅ /api/auth/me returned OK: we are now certain (avatar or no avatar)
        setAvatarUrl(url);
        setUserData(data?.user || null);
        setLoading(false);
      } catch {
        // ❗ Not sure. Keep loading=true (skeleton) so we never flash a letter.
        // Do not set avatarUrl null here.
      }
    }

    // ✅ SSR guard
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    // ✅ Keep loading in sync with NextAuth status
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (status === "unauthenticated") {
      setAvatarUrl(null);
      setUserData(null);
      setLoading(false);
      return;
    }

    // ✅ If session already has avatar, use it immediately and stop loading (certain)
    if (sessionAvatarUrl) {
      setAvatarUrl(sessionAvatarUrl);
      // Still fetch to get name/initials from full user record
      fetchCurrentUser();
      return;
    }

    // ✅ Authenticated but no avatar in session — we are NOT certain yet.
    // Stay loading until /api/auth/me returns OK (avatar or null).
    setLoading(true);
    fetchCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [status, sessionAvatarUrl]);

  const initials = useMemo(() => computeInitials(userData), [userData]);
  const displayName = useMemo(() => computeDisplayName(userData), [userData]);

  return { avatarUrl, loading, initials, displayName };
}