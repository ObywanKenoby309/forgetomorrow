// hooks/useUserWallpaper.js
'use client';

import { useEffect, useState } from "react";

// Stable empty shape so destructuring is always safe
const EMPTY_WALLPAPER = {
  url: null,
  bannerMode: null,
  bannerHeight: null,
  bannerFocalY: null,
};

/**
 * Returns the current user's wallpaper + header banner settings.
 *
 * It is defensive:
 * - Always returns a wallpaper object (never undefined)
 * - Exposes a simple wallpaperUrl for components that only need the URL
 */
export function useUserWallpaper() {
  const [wallpaper, setWallpaper] = useState(EMPTY_WALLPAPER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCurrentUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          throw new Error("Failed to load current user");
        }

        const data = await res.json();

        if (cancelled) return;

        const user = data?.user || {};

        const nextWallpaper = {
          url: user.wallpaperUrl ?? null,
          bannerMode: user.bannerMode ?? null,
          bannerHeight: user.bannerHeight ?? null,
          bannerFocalY: user.bannerFocalY ?? null,
        };

        setWallpaper(nextWallpaper);
      } catch (err) {
        if (!cancelled) {
          setWallpaper(EMPTY_WALLPAPER);
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

  return {
    wallpaper,
    wallpaperUrl: wallpaper.url,
    loading,
  };
}
