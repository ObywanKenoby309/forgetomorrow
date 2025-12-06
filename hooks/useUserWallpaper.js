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
 * Behaves defensively:
 * - Always returns a wallpaper object (never undefined)
 * - Exposes wallpaperUrl for consumers that only need the URL
 * - Listens for `profile-header-updated` and refetches live
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

    // Only run in the browser
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    // Initial load
    fetchCurrentUser();

    // Listen for profile header updates and refetch when they happen
    const handleHeaderUpdated = () => {
      // optional: you can log during debugging
      // console.log("[useUserWallpaper] profile-header-updated → refetch");
      fetchCurrentUser();
    };

    window.addEventListener("profile-header-updated", handleHeaderUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("profile-header-updated", handleHeaderUpdated);
    };
  }, []);

  return {
    wallpaper,
    wallpaperUrl: wallpaper.url,
    loading,
  };
}
