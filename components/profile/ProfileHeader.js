// components/profile/ProfileHeader.js
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';

import ProfileBannerSelector from './ProfileBannerSelector';
import ProfileAvatarSelector from './ProfileAvatarSelector';
import { profileBanners } from '@/lib/profileBanners';
import { profileWallpapers } from '@/lib/profileWallpapers';

// ✅ MIN ADD: reuse the same resolver logic used elsewhere
import { useCurrentUserAvatar } from '@/hooks/useCurrentUserAvatar';

export default function ProfileHeader() {
  const { data: session, status: authStatus } = useSession();

  const sessionAvatarUrl = useMemo(() => {
    const u = session?.user || null;
    return u && (u.avatarUrl || u.image) ? (u.avatarUrl || u.image) : null;
  }, [session]);

  const { avatarUrl: resolvedAvatarUrl, loading: resolvedAvatarLoading } = useCurrentUserAvatar();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState(null);
  const [slugValue, setSlugValue] = useState('');

  // Display-only here (editing moved out of Appearance UX)
  const [pronouns, setPronouns] = useState('');
  const [headline, setHeadline] = useState('');

  // ✅ IMPORTANT: do NOT default to a demo avatar (causes generic-first pop)
  // Seed from session immediately if present.
  const [avatarUrl, setAvatarUrl] = useState(sessionAvatarUrl || '');
  const [coverUrl, setCoverUrl] = useState('');
  const [wallpaperUrl, setWallpaperUrl] = useState('');

  const [bannerH, setBannerH] = useState(220);
  const [bannerMode, setBannerMode] = useState('cover'); // "cover" | "fit"
  const [focalY, setFocalY] = useState(50);

  // 'private' | 'public' | 'recruiters'
  const [visibility, setVisibility] = useState('private');

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // expand/collapse controls for "More options…"
  const [bannerMoreOpen, setBannerMoreOpen] = useState(false);
  const [wallpaperMoreOpen, setWallpaperMoreOpen] = useState(false);

  // ✅ Mobile detection to prevent header overflow + keep Edit visible
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Sticky avatar: once we have an image URL, never regress to empty on refresh jitter
  const [stickyAvatarUrl, setStickyAvatarUrl] = useState(sessionAvatarUrl || '');
  useEffect(() => {
    const best = sessionAvatarUrl || resolvedAvatarUrl || '';
    if (best) setStickyAvatarUrl(best);
  }, [sessionAvatarUrl, resolvedAvatarUrl]);

  // Track header load so we can confidently decide "no avatar"
  const [headerLoaded, setHeaderLoaded] = useState(false);

  // Load everything from the server (single source of truth)
  useEffect(() => {
    let cancel = false;

    (async () => {
      try {
        const res = await fetch('/api/profile/header');
        if (!res.ok) throw new Error('Failed to load profile');

        const data = await res.json();
        const user = data.user || data;
        if (!user || cancel) return;

        const fullName = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ');

        // Fallback: if header endpoint doesn't include name fields, pull from /api/profile/details
        if (!fullName) {
          try {
            const dres = await fetch('/api/profile/details');
            if (dres.ok) {
              const d = await dres.json();
              const details = d.details || d;
              const dn = details?.name ? String(details.name) : '';
              const dp = details?.pronouns ? String(details.pronouns) : '';
              const dh = details?.headline ? String(details.headline) : '';
              if (!cancel) {
                setName(dn || 'Unnamed');
                if (!pronouns) setPronouns(dp || '');
                if (!headline) setHeadline(dh || '');
              }
            } else {
              if (!cancel) setName('Unnamed');
            }
          } catch {
            if (!cancel) setName('Unnamed');
          }
        } else {
          setName(fullName);
        }

        setSlug(user.slug || null);
        setSlugValue(user.slug || '');

        setPronouns(user.pronouns || '');
        setHeadline(user.headline || '');

        // ✅ Avatar: prefer session/resolver first, then server value. Never force a demo avatar.
        const serverAvatar = typeof user.avatarUrl === 'string' ? user.avatarUrl : '';
        const bestAvatar = sessionAvatarUrl || resolvedAvatarUrl || serverAvatar || '';
        setAvatarUrl(bestAvatar);
        if (bestAvatar) setStickyAvatarUrl(bestAvatar);

        const corporateBanner = data.corporateBanner || user.corporateBanner || null;
        const effectiveCoverUrl = (corporateBanner && corporateBanner.bannerSrc) || user.coverUrl || '';
        setCoverUrl(effectiveCoverUrl);

        setWallpaperUrl(user.wallpaperUrl || '');

        const h = user.bannerHeight != null ? user.bannerHeight : 220;
        setBannerH(clamp(h, 80, 400));

        const mode = user.bannerMode === 'fit' ? 'fit' : 'cover';
        setBannerMode(mode);

        const fy = user.bannerFocalY != null ? user.bannerFocalY : 50;
        setFocalY(clamp(fy, 0, 100));

        const pv = (user.profileVisibility || '').toString().toUpperCase();
        if (pv === 'PUBLIC') setVisibility('public');
        else if (pv === 'RECRUITERS_ONLY' || pv === 'RECRUITERS') setVisibility('recruiters');
        else if (user.isProfilePublic) setVisibility('public');
        else setVisibility('private');
      } catch (err) {
        if (!cancel) {
          console.error('Failed to load profile header', err);
          setName('Unnamed');
        }
      } finally {
        if (!cancel) setHeaderLoaded(true);
      }
    })();

    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Derive certainty: show no letters until we know there is no avatar.
  const avatarIsKnown = useMemo(() => {
    // If we already have an image URL, we are done.
    if (stickyAvatarUrl) return true;

    // If auth is still loading, we are not sure yet.
    if (authStatus === 'loading') return false;

    // If header is not loaded yet, we are not sure yet.
    if (!headerLoaded) return false;

    // If our resolver is still loading, we are not sure yet.
    if (resolvedAvatarLoading) return false;

    // At this point, we have checked session, header, and resolver.
    return true;
  }, [stickyAvatarUrl, authStatus, headerLoaded, resolvedAvatarLoading]);

  const avatarFinalUrl = useMemo(() => {
    return stickyAvatarUrl || avatarUrl || '';
  }, [stickyAvatarUrl, avatarUrl]);

  const initials = useMemo(() => {
    const n = String(name || '').trim();
    if (!n) return 'FT';
    const parts = n.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || 'F';
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
    return (a + b).toUpperCase().slice(0, 2) || 'FT';
  }, [name]);

  const fullUrl = slug ? `https://forgetomorrow.com/u/${slug}` : null;
  const fullUrlFromInput = slugValue
    ? `https://forgetomorrow.com/u/${slugValue}`
    : 'https://forgetomorrow.com/u/your-custom-url';

  const copySlug = () => {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl);
  };

  const visibilityLabel =
    visibility === 'public'
      ? 'Public'
      : visibility === 'recruiters'
      ? 'Recruiters only'
      : 'Private';

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    const cleanedSlug = slugValue.trim().toLowerCase().replace(/\s+/g, '-');

    const profileVisibility =
      visibility === 'public'
        ? 'PUBLIC'
        : visibility === 'recruiters'
        ? 'RECRUITERS_ONLY'
        : 'PRIVATE';

    try {
      const res = await fetch('/api/profile/header', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarUrl: avatarUrl || null,
          coverUrl: coverUrl || null,
          wallpaperUrl: wallpaperUrl || null,
          bannerMode,
          bannerHeight: bannerH,
          bannerFocalY: focalY,
          slug: cleanedSlug,

          profileVisibility,
          isProfilePublic: profileVisibility === 'PUBLIC',
        }),
      });

      let data = {};
      if (!res.ok) {
        try {
          data = await res.json();
        } catch (_) {}
        throw new Error(data.error || 'Failed to save profile');
      } else {
        try {
          data = await res.json();
        } catch (_) {}
      }

      const user = data.user || data;

      if (user.slug) {
        setSlug(user.slug);
        setSlugValue(user.slug);
      } else {
        setSlug(cleanedSlug);
        setSlugValue(cleanedSlug);
      }

      const effectiveWallpaper = user.wallpaperUrl ?? null;
      setWallpaperUrl(effectiveWallpaper || '');

      // ✅ If we just saved an avatar, make it sticky immediately.
      const bestAvatarAfterSave =
        sessionAvatarUrl || resolvedAvatarUrl || (typeof user.avatarUrl === 'string' ? user.avatarUrl : '') || avatarUrl || '';
      if (bestAvatarAfterSave) setStickyAvatarUrl(bestAvatarAfterSave);
      setAvatarUrl(bestAvatarAfterSave);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('profileHeaderUpdated', {
            detail: { wallpaperUrl: effectiveWallpaper },
          })
        );
      }

      setEditOpen(false);
    } catch (err) {
      console.error('Failed to save profile header', err);
      setSaveError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Mobile rule: show full width (no side crop)
  // Height is derived from width using an aspect ratio box.
  const MOBILE_BANNER_ASPECT = '3 / 1';

  return (
    <section
      style={{
        border: 'none',
        borderTop: 'none',
        borderRadius: 12,
        overflow: 'visible',
        background: 'transparent',
        maxWidth: '100%',
      }}
    >
      {coverUrl &&
        (isMobile ? (
          <BannerFitAspect url={coverUrl} aspectRatio={MOBILE_BANNER_ASPECT} />
        ) : bannerMode === 'cover' ? (
          <BannerCover url={coverUrl} height={bannerH} focalY={focalY} />
        ) : (
          <BannerFit url={coverUrl} height={bannerH} />
        ))}

      {/* Header Row (GLASS) */}
      <div
        style={{
          padding: 16,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 12,
          alignItems: isMobile ? 'stretch' : 'center',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.22)',
          background: 'rgba(255,255,255,0.58)',
          boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          maxWidth: '100%',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
          {/* Avatars must remain perfectly circular everywhere */}
          <div
            style={{
              width: isMobile ? 76 : 96,
              height: isMobile ? 76 : 96,
              borderRadius: 9999,
              overflow: 'hidden',
              border: '3px solid #FF7043',
              flexShrink: 0,
              display: 'block',
              boxSizing: 'border-box',
              lineHeight: 0,
              background: 'rgba(0,0,0,0.06)',
            }}
          >
            {/* ✅ RULE: no letter until we KNOW there is no avatar */}
            {!avatarIsKnown ? (
              <div
                aria-hidden="true"
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'rgba(0,0,0,0.08)',
                  animation: 'ftPulse 1.2s ease-in-out infinite',
                }}
              />
            ) : avatarFinalUrl ? (
              <img
                data-ft-avatar="1"
                src={avatarFinalUrl}
                alt="Profile avatar"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'linear-gradient(135deg, #FF7043, #F4511E)',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: isMobile ? 22 : 26,
                  letterSpacing: 0.5,
                }}
                aria-label="No avatar set"
              >
                {initials}
              </div>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                color: '#263238',
                wordBreak: 'break-word',
              }}
            >
              {name}
            </h2>

            {slug && (
              <div
                onClick={copySlug}
                style={{
                  fontSize: 13,
                  color: '#FF7043',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  width: '100%',
                  overflowWrap: 'anywhere',
                }}
              >
                {fullUrl}
              </div>
            )}

            {pronouns ? (
              <p style={{ margin: 0, fontSize: 14, color: '#607D8B' }}>{pronouns}</p>
            ) : null}
            {headline ? (
              <p style={{ margin: 0, fontSize: 15, color: '#455A64' }}>{headline}</p>
            ) : null}

            <p style={{ margin: 0, fontSize: 12, color: '#90A4AE' }}>
              Profile visibility: {visibilityLabel}
            </p>
          </div>
        </div>

        <button
          onClick={() => setEditOpen(true)}
          style={{
            border: '1px solid #FF7043',
            padding: '10px 12px',
            borderRadius: 10,
            color: '#FF7043',
            background: 'rgba(255,255,255,0.75)',
            cursor: 'pointer',
            fontWeight: 800,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            width: isMobile ? '100%' : 'auto',
            flexShrink: 0,
          }}
        >
          Edit
        </button>
      </div>

      {editOpen && (
        <Dialog title="Edit Profile Appearance" onClose={() => setEditOpen(false)} open={editOpen}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Name</span>
              <div
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  background: '#f9f9f9',
                  color: '#666',
                  fontStyle: 'italic',
                }}
              >
                {name || 'Unnamed'} <small>(set during signup)</small>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Personal URL</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: '#455A64' }}>https://forgetomorrow.com/u/</span>
                <input
                  value={slugValue}
                  onChange={(e) => setSlugValue(e.target.value)}
                  placeholder="your-name-here"
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    padding: 6,
                    minWidth: 160,
                    maxWidth: '100%',
                  }}
                />
              </div>
              <small style={{ color: '#90A4AE' }}>
                Letters, numbers, and hyphens only. This is the link you can share publicly.
              </small>
              <small style={{ color: '#607D8B' }}>Preview: {fullUrlFromInput}</small>
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Profile visibility</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <VisibilityPill
                  label="Private"
                  active={visibility === 'private'}
                  onClick={() => setVisibility('private')}
                />
                <VisibilityPill
                  label="Public"
                  active={visibility === 'public'}
                  onClick={() => setVisibility('public')}
                />
                <VisibilityPill
                  label="Recruiters only"
                  active={visibility === 'recruiters'}
                  onClick={() => setVisibility('recruiters')}
                />
              </div>
              <small style={{ color: '#90A4AE' }}>
                Public: anyone with your link can view. Recruiters only: hidden from public; visible only
                to approved recruiters.
              </small>
            </div>

            <ProfileAvatarSelector value={avatarUrl || ''} onChange={setAvatarUrl} />

            {/* BANNER SELECTION (RESTORED) */}
            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Profile banner</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setCoverUrl('')}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: coverUrl ? '1px solid #CFD8DC' : '2px solid #FF7043',
                    background: coverUrl ? 'white' : '#FFF3E0',
                    color: '#455A64',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  No banner
                </button>

                {profileBanners.slice(0, 3).map((b) => {
                  const active = coverUrl === b.src;
                  return (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => setCoverUrl(b.src)}
                      style={{
                        borderRadius: 999,
                        padding: 2,
                        border: active ? '2px solid #FF7043' : '1px solid #CFD8DC',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src={b.src}
                        alt={b.name}
                        style={{ width: 72, height: 36, borderRadius: 999, objectFit: 'cover' }}
                      />
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setBannerMoreOpen((v) => !v)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: '1px solid #CFD8DC',
                    background: 'white',
                    color: '#455A64',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {bannerMoreOpen ? 'Hide options' : 'More options…'}
                </button>
              </div>

              {bannerMoreOpen && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #ECEFF1',
                    background: '#FAFAFA',
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 12, color: '#607D8B' }}>All banner options</div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: 10,
                    }}
                  >
                    {profileBanners.map((b) => {
                      const active = coverUrl === b.src;
                      return (
                        <button
                          key={b.key}
                          type="button"
                          onClick={() => setCoverUrl(b.src)}
                          style={{
                            borderRadius: 10,
                            padding: 6,
                            border: active ? '2px solid #FF7043' : '1px solid #e0e0e0',
                            background: active ? '#FFF3E0' : 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'grid',
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              borderRadius: 8,
                              overflow: 'hidden',
                              border: '1px solid #ddd',
                              height: 64,
                              background: '#eceff1',
                            }}
                          >
                            <img
                              src={b.src}
                              alt={b.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#263238' }}>{b.name}</div>
                          <div style={{ fontSize: 11, color: '#78909C' }}>{b.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* WALLPAPER SELECTION (RESTORED) */}
            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Page wallpaper (optional)</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setWallpaperUrl('')}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: wallpaperUrl ? '1px solid #CFD8DC' : '2px solid #FF7043',
                    background: wallpaperUrl ? 'white' : '#FFF3E0',
                    color: '#455A64',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  No wallpaper
                </button>

                {profileWallpapers.slice(0, 3).map((w) => {
                  const active = wallpaperUrl === w.src;
                  return (
                    <button
                      key={w.key}
                      type="button"
                      onClick={() => setWallpaperUrl(w.src)}
                      style={{
                        borderRadius: 999,
                        padding: 2,
                        border: active ? '2px solid #FF7043' : '1px solid #CFD8DC',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src={w.src}
                        alt={w.name}
                        style={{ width: 72, height: 36, borderRadius: 999, objectFit: 'cover' }}
                      />
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setWallpaperMoreOpen((v) => !v)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: '1px solid #CFD8DC',
                    background: 'white',
                    color: '#455A64',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {wallpaperMoreOpen ? 'Hide options' : 'More options…'}
                </button>
              </div>

              {wallpaperMoreOpen && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #ECEFF1',
                    background: '#FAFAFA',
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 12, color: '#607D8B' }}>All wallpaper options</div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: 10,
                    }}
                  >
                    {profileWallpapers.map((w) => {
                      const active = wallpaperUrl === w.src;
                      return (
                        <button
                          key={w.key}
                          type="button"
                          onClick={() => setWallpaperUrl(w.src)}
                          style={{
                            borderRadius: 10,
                            padding: 6,
                            border: active ? '2px solid #FF7043' : '1px solid #e0e0e0',
                            background: active ? '#FFF3E0' : 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'grid',
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              borderRadius: 8,
                              overflow: 'hidden',
                              border: '1px solid #ddd',
                              height: 64,
                              background: '#eceff1',
                            }}
                          >
                            <img
                              src={w.src}
                              alt={w.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#263238' }}>{w.name}</div>
                          <div style={{ fontSize: 11, color: '#78909C' }}>{w.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mode + height controls */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Banner mode</span>
              <ModeToggle value={bannerMode} onChange={setBannerMode} />
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Banner height</span>
              <input
                type="range"
                min={80}
                max={400}
                value={bannerH}
                onChange={(e) => setBannerH(Number(e.target.value))}
              />
              <small style={{ color: '#607D8B' }}>{bannerH}px</small>
              <small style={{ color: '#90A4AE' }}>
                Note: Desktop uses this height. Mobile derives height from width to show full banner.
              </small>
            </div>

            {bannerMode === 'cover' && (
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Vertical focus (cover)</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={focalY}
                  onChange={(e) => setFocalY(Number(e.target.value))}
                />
                <small style={{ color: '#607D8B' }}>
                  Position {focalY}% (0 = top, 100 = bottom)
                </small>
              </div>
            )}

            {coverUrl && (
              <div style={{ display: 'grid', gap: 8 }}>
                <small style={{ color: '#607D8B' }}>Banner preview</small>
                <div
                  style={{
                    width: '100%',
                    border: '1px solid #eee',
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}
                >
                  {bannerMode === 'cover' ? (
                    <BannerCover url={coverUrl} height={120} focalY={focalY} />
                  ) : (
                    <BannerFit url={coverUrl} height={120} />
                  )}
                </div>
              </div>
            )}

            {saveError && <small style={{ color: '#d32f2f' }}>{saveError}</small>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => setEditOpen(false)}
                style={{
                  background: 'white',
                  color: '#455A64',
                  border: '1px solid #cfd8dc',
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: '#FF7043',
                  color: 'white',
                  border: '1px solid #FF7043',
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: saving ? 'default' : 'pointer',
                  opacity: saving ? 0.8 : 1,
                }}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>

            <small style={{ color: '#90A4AE' }}>
              Tip: Click your profile URL to copy it. Your avatar, banner, wallpaper, and profile text are
              now saved to your account and will load on any device.
            </small>
          </div>
        </Dialog>
      )}

      {/* Simple pulse keyframes scoped here */}
      <style jsx>{`
        @keyframes ftPulse {
          0% {
            opacity: 0.55;
          }
          50% {
            opacity: 0.95;
          }
          100% {
            opacity: 0.55;
          }
        }
      `}</style>
    </section>
  );
}

/* ===== Banner, Toggle, Dialog ===== */

function BannerCover({ url, height, focalY }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
      }}
    >
      <img
        src={url}
        alt=""
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          maxHeight: Math.max(height, 220),
          objectFit: 'cover',
          objectPosition: `center ${focalY}%`,
        }}
      />
    </div>
  );
}

function BannerFit({ url, height }) {
  return (
    <div style={{ position: 'relative', height, width: '100%', overflow: 'hidden' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(10px) brightness(0.9)',
          transform: 'scale(1.05)',
        }}
      />
      <img
        src={url}
        alt=""
        style={{
          position: 'relative',
          height: '100%',
          width: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}

function BannerFitAspect({ url, aspectRatio }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        overflow: 'hidden',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        background: 'rgba(255,255,255,0.12)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(10px) brightness(0.9)',
          transform: 'scale(1.05)',
        }}
      />
      <img
        src={url}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}

function VisibilityPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 999,
        border: '1px solid ' + (active ? '#FF7043' : '#cfd8dc'),
        background: active ? '#FF7043' : 'white',
        color: active ? 'white' : '#455A64',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function ModeToggle({ value, onChange }) {
  const btn = (val, label) => (
    <button
      type="button"
      onClick={() => onChange(val)}
      style={{
        padding: '6px 10px',
        border: '1px solid ' + (value === val ? '#FF7043' : '#cfd8dc'),
        color: value === val ? '#FF7043' : '#455A64',
        background: 'white',
        borderRadius: 6,
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {btn('cover', 'Cover')}
      {btn('fit', 'Fit')}
    </div>
  );
}

function Dialog({ children, title, onClose, open }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (typeof document === 'undefined') return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!mounted) return null;
  if (typeof document === 'undefined') return null;

  const modal = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 9999,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 8,
          padding: 16,
          width: 720,
          maxWidth: '98vw',
          maxHeight: '92vh',
          overflowY: 'auto',
          display: 'grid',
          gap: 10,
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        }}
      >
        <h3 style={{ margin: 0 }}>{title}</h3>
        {children}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}