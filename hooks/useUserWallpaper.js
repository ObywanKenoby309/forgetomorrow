// hooks/useUserWallpaper.js
import { useEffect, useState } from "react";

// Define the hook once
function useUserWallpaper() {
  const [wallpaper, setWallpaper] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });

        if (!res.ok) {
          // 401 when logged out = expected → clear wallpaper + bail quietly
          if (res.status === 401) {
            if (!cancelled) setWallpaper(null);
            return;
          }
          console.warn("[useUserWallpaper] non-ok status", res.status);
          return;
        }

        const data = await res.json();
        if (!cancelled && data?.user) {
          setWallpaper({
            wallpaperUrl: data.user.wallpaperUrl,
            bannerMode: data.user.bannerMode,
            bannerHeight: data.user.bannerHeight,
            bannerFocalY: data.user.bannerFocalY,
          });
        }
      } catch (err) {
        console.warn("[useUserWallpaper] load error (ignored)", err);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return wallpaper;
}

// Export BOTH named + default so all imports work
export { useUserWallpaper };
export default useUserWallpaper;
