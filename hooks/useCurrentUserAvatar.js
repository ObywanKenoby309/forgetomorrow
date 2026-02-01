// hooks/useCurrentUserAvatar.js
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

/**
 * Minimal hook to get the current user's avatar URL.
 * For now this safely falls back to null if we can't load a user.
 */
export function useCurrentUserAvatar() {
  const { status } = useSession();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);

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

        if (!cancelled) {
          setAvatarUrl(url);
        }
      } catch {
        if (!cancelled) setAvatarUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // ✅ Don’t call /api/auth/me while logged out (prevents extra 401/error noise)
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    if (status === "loading") return;

    if (status === "unauthenticated") {
      setAvatarUrl(null);
      setLoading(false);
      return;
    }

    fetchCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [status]);

  return { avatarUrl, loading };
}
