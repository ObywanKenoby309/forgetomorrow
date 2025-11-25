// hooks/useCurrentUserAvatar.js
import { useEffect, useState } from "react";

export function useCurrentUserAvatar() {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [initials, setInitials] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // This should call your authenticated profile endpoint
        const res = await fetch("/api/auth/me");
        if (!res.ok) return setLoading(false);

        const data = await res.json();
        const user = data?.user || data;
        if (!user) return setLoading(false);

        // 1️⃣ Pick the avatar image if available
        const url = user.avatarUrl || user.image || null;
        if (!cancelled) setAvatarUrl(url);

        // 2️⃣ Compute initials from first + last (no “FT” fallback)
        let base = "";
        if (user.firstName && user.lastName) {
          base = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        } else if (user.name) {
          const parts = user.name.trim().split(/\s+/);
          base =
            parts.length > 1
              ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
              : parts[0][0].toUpperCase();
        } else if (user.email) {
          base = user.email[0].toUpperCase();
        }

        if (!cancelled) setInitials(base || "");
      } catch (err) {
        console.error("[useCurrentUserAvatar] error", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { avatarUrl, initials, loading };
}
