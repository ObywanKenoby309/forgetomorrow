// hooks/useUserWallpaper.js
'use client';

import { useCallback, useEffect, useState } from "react";

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
 * - Always returns a wallpaper object (never undefined)
 * - Exposes a simple wallpaperUrl for components that only need the URL
 * - Reacts to a global "profile-header-updated" event so changes are instant
 */
export function useUserWallpaper() {
  const [wallpaper, setWallpaper] = useState(EMPTY_WALLPAPER);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    let cancelled = false;

    try {
      setLoading(true);
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

    // cleanup closure
    return () => {
      cancelled = true;
    };
  }, []);

  // Initial load
  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/me");
        if (!res.ok) throw new Error("Failed to load current user");
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
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for global "profile-header-updated" event to refresh automatically
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = () => {
      // fire and forget; fetchCurrentUser already handles loading state
      fetchCurrentUser();
    };

    window.addEventListener("profile-header-updated", handler);
    return () => {
      window.removeEventListener("profile-header-updated", handler);
    };
  }, [fetchCurrentUser]);

  return {
    wallpaper,
    wallpaperUrl: wallpaper.url,
    loading,
    // in case you ever want to trigger it manually from a component
    refreshWallpaper: fetchCurrentUser,
  };
}
