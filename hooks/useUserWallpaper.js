// hooks/useUserWallpaper.js
'use client';

import { useEffect, useState } from 'react';

export function useUserWallpaper() {
  const [wallpaperUrl, setWallpaperUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/profile/header');
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }

        const data = await res.json();
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
      }
    }

    load();

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
