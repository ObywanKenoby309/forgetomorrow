// hooks/useCurrentUserAvatar.js
import { useEffect, useState } from 'react';

export function useCurrentUserAvatar() {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
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
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { avatarUrl, loading };
}

// Keep a default export too, in case anything imports it that way
export default useCurrentUserAvatar;
