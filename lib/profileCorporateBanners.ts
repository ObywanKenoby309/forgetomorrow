// lib/profileCorporateBanners.ts
// Central map of ForgeTomorrow corporate banners + matching wallpapers.
// Used for staff / internal accounts where the banner is locked.

export type CorporateBannerKey =
  | 'CEO'
  | 'CFO'
  | 'CMO'
  | 'ACCOUNTING'
  | 'PR'
  | 'STAFF_GENERAL';

// Core mapping: which banner + wallpaper each key uses.
// Paths are relative to the /public folder.
export const CORPORATE_BANNERS: Record<
  CorporateBannerKey,
  {
    label: string;
    bannerSrc: string;      // 120–220px tall hero banner (profile header)
    wallpaperSrc?: string;  // Optional full-page wallpaper for future use
  }
> = {
  CEO: {
    label: 'Chief Executive Officer',
    bannerSrc: '/corporate-banners/CEO.png', // <─ your locked CEO banner
    wallpaperSrc: '/profile-wallpaper/Leadership.jpg',
  },
  CFO: {
    label: 'Chief Financial Officer',
    bannerSrc: '/profile-banners/Forge_Future.png', // smoke and lava
    wallpaperSrc: '/profile-wallpaper/Forge.jpg',
  },
  CMO: {
    label: 'Chief Marketing Officer',
    bannerSrc: '/profile-banners/Illuminate_Network.png', // blue stars connecting
    wallpaperSrc: '/profile-wallpaper/Network.jpg',
  },
  ACCOUNTING: {
    label: 'Accounting / Finance',
    bannerSrc: '/profile-banners/Grow_Beyond.png', // green forest
    wallpaperSrc: '/profile-wallpaper/Growth.jpg',
  },
  PR: {
    label: 'Public Relations',
    bannerSrc: '/profile-banners/Future.png', // AI shaking human hand
    wallpaperSrc: '/profile-wallpaper/Future.jpg',
  },
  STAFF_GENERAL: {
    label: 'ForgeTomorrow Staff',
    bannerSrc: '/profile-banners/Build_Teams.png', // people standing together
    wallpaperSrc: '/profile-wallpaper/Building_Teams.jpg',
  },
};

/**
 * Return the corporate banner config from a raw key string (e.g. from Prisma).
 * If the key is not recognized, returns null.
 */
export function getCorporateBannerByKey(
  key: string | null | undefined,
) {
  if (!key) return null;

  const normalized = key.toUpperCase() as CorporateBannerKey;
  if (normalized in CORPORATE_BANNERS) {
    return CORPORATE_BANNERS[normalized as CorporateBannerKey];
  }
  return null;
}
