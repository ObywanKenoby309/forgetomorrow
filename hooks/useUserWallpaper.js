// hooks/useUserWallpaper.js
'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

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
  const { status } = useSession();
  const [wallpaper, setWallpaper] = useState(EMPTY_WALLPAPER);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    // ✅ Don’t call /api/auth/me while logged out (prevents extra 401/error noise)
    if (status !== "authenticated") {
      setWallpaper(EMPTY_WALLPAPER);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        setWallpaper(EMPTY_WALLPAPER);
        return;
      }

      const data = await res.json();
      const user = data?.user || null;

      if (!user) {
        setWallpaper(EMPTY_WALLPAPER);
        return;
      }

      const nextWallpaper = {
        url: user.wallpaperUrl ?? null,
        bannerMode: user.bannerMode ?? null,
        bannerHeight: user.bannerHeight ?? null,
        bannerFocalY: user.bannerFocalY ?? null,
      };

      setWallpaper(nextWallpaper);
    } catch {
      setWallpaper(EMPTY_WALLPAPER);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    if (status === "loading") return;

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
  }, [refresh, status]);

  return {
    wallpaper,
    wallpaperUrl: wallpaper.url,
    loading,
    refresh,
  };
}
