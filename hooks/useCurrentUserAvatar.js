// hooks/useCurrentUserAvatar.js
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

/**
 * Minimal hook to get the current user's avatar URL.
 * Prefer session payload for instant UI; fallback to /api/auth/me only if needed.
 */
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
  const [loading, setLoading] = useState(status === "loading");

  useEffect(() => {
    let cancelled = false;

    async function fetchCurrentUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setAvatarUrl(null);
          return;
        }

        const data = await res.json();
        const url = data?.user?.avatarUrl || data?.user?.image || null;

        if (!cancelled) setAvatarUrl(url);
      } catch {
        if (!cancelled) setAvatarUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
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
      setLoading(false);
      return;
    }

    // ✅ If session already has avatar, use it immediately and skip fetch
    if (sessionAvatarUrl) {
      setAvatarUrl(sessionAvatarUrl);
      setLoading(false);
      return;
    }

    // ✅ Authenticated but no avatar in session — fetch once as fallback
    setLoading(true);
    fetchCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [status, sessionAvatarUrl]);

  return { avatarUrl, loading };
}