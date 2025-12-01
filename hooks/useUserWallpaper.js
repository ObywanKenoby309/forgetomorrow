// hooks/useUserWallpaper.js
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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });

        // Not logged in → expected, just reset to empty + bail
        if (res.status === 401 || res.status === 403) {
          if (!cancelled) setWallpaper(EMPTY_WALLPAPER);
          return;
        }

        if (!res.ok) {
          console.warn("[useUserWallpaper] non-ok status", res.status);
          if (!cancelled) setWallpaper(EMPTY_WALLPAPER);
          return;
        }

        const data = await res.json();
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
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return wallpaper;
}

// Export BOTH so all existing imports keep working
export { useUserWallpaper };
export default useUserWallpaper;
