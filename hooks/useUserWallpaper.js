// hooks/useUserWallpaper.js
'use client';

import { useEffect, useState, useCallback } from "react";

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
 * - Loads from /api/auth/me
 * - Listens for the "profileHeaderUpdated" event to refresh live
 */
export function useUserWallpaper() {
  const [wallpaper, setWallpaper] = useState(EMPTY_WALLPAPER);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load current user");
      }

      const data = await res.json();
      const user = data?.user || {};

      const nextWallpaper = {
        url: user.wallpaperUrl ?? null,
        bannerMode: user.bannerMode ?? null,
        bannerHeight: user.bannerHeight ?? null,
        bannerFocalY: user.bannerFocalY ?? null,
      };

      setWallpaper(nextWallpaper);
    } catch (err) {
      console.error("[useUserWallpaper] refresh error:", err);
      setWallpaper(EMPTY_WALLPAPER);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    // Initial load
    refresh();

    // Listen for profile header changes from the editor
    const handler = () => {
      refresh();
    };

    window.addEventListener("profileHeaderUpdated", handler);

    return () => {
      window.removeEventListener("profileHeaderUpdated", handler);
    };
  }, [refresh]);

  return {
    wallpaper,
    wallpaperUrl: wallpaper.url,
    loading,
    refresh,
  };
}
