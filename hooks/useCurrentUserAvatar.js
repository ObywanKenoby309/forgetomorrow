// hooks/useCurrentUserAvatar.js
<<<<<<< HEAD
import { useEffect, useState } from 'react';

export function useCurrentUserAvatar() {
  const [avatarUrl, setAvatarUrl] = useState(null);
=======
import { useEffect, useState } from "react";

export function useCurrentUserAvatar() {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [initials, setInitials] = useState("");
>>>>>>> 6ee98c0 (Add privacy delete user data system)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
<<<<<<< HEAD
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        // Not logged in → silently treat as "no avatar"
        if (res.status === 401 || res.status === 403) {
          if (!cancelled) {
            setAvatarUrl(null);
            setLoading(false);
          }
          return;
        }

        if (!res.ok) {
          console.error(
            '[useCurrentUserAvatar] non-OK response:',
            res.status
          );
          if (!cancelled) setLoading(false);
          return;
        }

        const data = await res.json();

        if (!cancelled) {
          const url =
            data?.user?.avatarUrl ||
            data?.user?.image ||
            null;
          setAvatarUrl(url);
          setLoading(false);
        }
      } catch (err) {
        console.error('[useCurrentUserAvatar] error', err);
=======
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
>>>>>>> 6ee98c0 (Add privacy delete user data system)
        if (!cancelled) setLoading(false);
      }
    }

    load();
<<<<<<< HEAD

=======
>>>>>>> 6ee98c0 (Add privacy delete user data system)
    return () => {
      cancelled = true;
    };
  }, []);

<<<<<<< HEAD
  return { avatarUrl, loading };
}

// Keep a default export too, in case anything imports it that way
export default useCurrentUserAvatar;
=======
  return { avatarUrl, initials, loading };
}
>>>>>>> 6ee98c0 (Add privacy delete user data system)
