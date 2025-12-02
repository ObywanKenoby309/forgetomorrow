// hooks/useCurrentUserAvatar.js
import { useEffect, useState } from "react";

/**
 * Minimal hook to get the current user's avatar URL.
 * For now this safely falls back to null if we can't load a user.
 */
export function useCurrentUserAvatar() {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCurrentUser() {
      try {
        // If you have a different "current user" endpoint, update this path.
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          throw new Error("Failed to load current user");
        }

        const data = await res.json();

        if (!cancelled) {
          const url =
            data?.user?.avatarUrl ||
            data?.user?.image ||
            null;

          setAvatarUrl(url);
        }
      } catch (err) {
        if (!cancelled) {
          setAvatarUrl(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (typeof window !== "undefined") {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return { avatarUrl, loading };
}
