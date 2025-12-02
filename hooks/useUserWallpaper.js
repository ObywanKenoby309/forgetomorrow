// hooks/useUserWallpaper.js
<<<<<<< HEAD
import { useEffect, useState } from "react";

// Stable empty shape so destructuring is always safe
const EMPTY_WALLPAPER = {
  wallpaperUrl: null,
  bannerMode: null,
  bannerHeight: null,
  bannerFocalY: null,
};

function useUserWallpaper() {
  const [wallpaper, setWallpaper] = useState(EMPTY_WALLPAPER);
=======
'use client';

import { useEffect, useState } from 'react';

export function useUserWallpaper() {
  const [wallpaperUrl, setWallpaperUrl] = useState(null);
  const [loading, setLoading] = useState(true);
>>>>>>> 6ee98c0 (Add privacy delete user data system)

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
<<<<<<< HEAD
        const res = await fetch("/api/auth/me", { credentials: "include" });

        // Not logged in → expected, just reset to empty + bail
        if (res.status === 401 || res.status === 403) {
          if (!cancelled) setWallpaper(EMPTY_WALLPAPER);
          return;
        }

        if (!res.ok) {
          console.warn("[useUserWallpaper] non-ok status", res.status);
          if (!cancelled) setWallpaper(EMPTY_WALLPAPER);
=======
        const res = await fetch('/api/profile/header');
        if (!res.ok) {
          if (!cancelled) setLoading(false);
>>>>>>> 6ee98c0 (Add privacy delete user data system)
          return;
        }

        const data = await res.json();
<<<<<<< HEAD
        if (!cancelled && data?.user) {
          setWallpaper({
            wallpaperUrl: data.user.wallpaperUrl ?? null,
            bannerMode: data.user.bannerMode ?? null,
            bannerHeight: data.user.bannerHeight ?? null,
            bannerFocalY: data.user.bannerFocalY ?? null,
          });
        }
      } catch (err) {
        console.warn("[useUserWallpaper] load error (ignored)", err);
        if (!cancelled) setWallpaper(EMPTY_WALLPAPER);
=======
        const user = data.user || data;

        if (!cancelled) {
          const url = user.wallpaperUrl || null;
          setWallpaperUrl(url);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[useUserWallpaper] load error', err);
          setLoading(false);
        }
>>>>>>> 6ee98c0 (Add privacy delete user data system)
      }
    }

    load();
<<<<<<< HEAD
    return () => {
      cancelled = true;
    };
  }, []);

  return wallpaper;
}

// Export BOTH so all existing imports keep working
export { useUserWallpaper };
export default useUserWallpaper;
=======

    // 🔔 Listen for live updates from ProfileHeader
    function handleUpdated(e) {
      if (cancelled) return;
      const detail = e.detail || {};
      const url = detail.wallpaperUrl || null;
      setWallpaperUrl(url);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('profile:wallpaper-updated', handleUpdated);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('profile:wallpaper-updated', handleUpdated);
      }
    };
  }, []);

  return { wallpaperUrl, loading };
}
>>>>>>> 6ee98c0 (Add privacy delete user data system)
