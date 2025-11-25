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
          setLoading(false);
          return;
        }

        const data = await res.json();
        // /api/profile/header returns the fields at the root
        const url = data.wallpaperUrl || null;

        if (!cancelled) {
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
    return () => {
      cancelled = true;
    };
  }, []);

  return { wallpaperUrl, loading };
}
