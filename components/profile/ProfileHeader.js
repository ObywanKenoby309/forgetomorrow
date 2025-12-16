// components/profile/ProfileHeader.js
'use client';

import React, { useEffect, useState } from 'react';
import ProfileBannerSelector from './ProfileBannerSelector';
import ProfileAvatarSelector from './ProfileAvatarSelector';
import { profileBanners } from '@/lib/profileBanners';
import { profileWallpapers } from '@/lib/profileWallpapers';

export default function ProfileHeader() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState(null);
  const [slugValue, setSlugValue] = useState('');

  // Display-only here (editing moved out of Appearance UX)
  const [pronouns, setPronouns] = useState('');
  const [headline, setHeadline] = useState('');

  const [avatarUrl, setAvatarUrl] = useState('/profile-avatars/demo-avatar.jpg');
  const [coverUrl, setCoverUrl] = useState('');
  const [wallpaperUrl, setWallpaperUrl] = useState('');

  const [bannerH, setBannerH] = useState(120);
  const [bannerMode, setBannerMode] = useState('cover'); // "cover" | "fit"
  const [focalY, setFocalY] = useState(50);

  // 'private' | 'public' | 'recruiters'
  const [visibility, setVisibility] = useState('private');

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // expand/collapse controls for “More options…”
  const [bannerMoreOpen, setBannerMoreOpen] = useState(false);
  const [wallpaperMoreOpen, setWallpaperMoreOpen] = useState(false);

  // Load everything from the server (single source of truth)
  useEffect(() => {
    let cancel = false;

    (async () => {
      try {
        const res = await fetch('/api/profile/header');
        if (!res.ok) throw new Error('Failed to load profile');

        const data = await res.json();
        const user = data.user || data; // support both {user: {...}} and flat payloads
        if (!user || cancel) return;

        const fullName =
          user.name ||
          [user.firstName, user.lastName].filter(Boolean).join(' ');

        setName(fullName || 'Unnamed');
        setSlug(user.slug || null);
        setSlugValue(user.slug || '');

        setPronouns(user.pronouns || '');
        setHeadline(user.headline || '');

        setAvatarUrl(user.avatarUrl || '/profile-avatars/demo-avatar.jpg');

        // Prefer corporate banner from the API if present, otherwise use coverUrl
        const corporateBanner =
          data.corporateBanner || user.corporateBanner || null;
        const effectiveCoverUrl =
          (corporateBanner && corporateBanner.bannerSrc) ||
          user.coverUrl ||
          '';
        setCoverUrl(effectiveCoverUrl);

        setWallpaperUrl(user.wallpaperUrl || '');

        const h = user.bannerHeight != null ? user.bannerHeight : 120;
        setBannerH(clamp(h, 80, 220));

        const mode = user.bannerMode === 'fit' ? 'fit' : 'cover';
        setBannerMode(mode);

        const fy = user.bannerFocalY != null ? user.bannerFocalY : 50;
        setFocalY(clamp(fy, 0, 100));

        // ✅ FIX: map DB enum -> UI 3-state, accept legacy values
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
      }
    })();

    return () => {
      cancel = true;
    };
  }, []);

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

    // Basic client-side cleaning: lower-case, trim spaces, spaces -> hyphens
    const cleanedSlug = slugValue.trim().toLowerCase().replace(/\s+/g, '-');

    // ✅ FIX: UI -> DB enum
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
          // NOTE: Pronouns + Headline are NOT edited in Appearance UX
          avatarUrl,
          coverUrl: coverUrl || null,
          wallpaperUrl: wallpaperUrl || null,
          bannerMode,
          bannerHeight: bannerH,
          bannerFocalY: focalY,
          slug: cleanedSlug,

          // ✅ FIX: persist enum + keep legacy boolean synced
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

      // Update displayed slug to match what the server accepted
      if (user.slug) {
        setSlug(user.slug);
        setSlugValue(user.slug);
      } else {
        setSlug(cleanedSlug);
        setSlugValue(cleanedSlug);
      }

      // 🔄 sync wallpaper with server truth (null = no wallpaper)
      const effectiveWallpaper = user.wallpaperUrl ?? null;
      setWallpaperUrl(effectiveWallpaper || '');

      // 🔔 broadcast to the rest of the app (layouts using useUserWallpaper)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('profileHeaderUpdated', {
            detail: {
              wallpaperUrl: effectiveWallpaper,
            },
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

  return (
    <section
      style={{
        border: '1px solid #eee',
        borderTop: 'none',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'white',
      }}
    >
      {coverUrl &&
        (bannerMode === 'cover' ? (
          <BannerCover url={coverUrl} height={bannerH} focalY={focalY} />
        ) : (
          <BannerFit url={coverUrl} height={bannerH} />
        ))}

      {/* Header Row */}
      <div style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <img
          src={avatarUrl}
          alt="Profile avatar"
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            border: '3px solid #FF7043',
            objectFit: 'cover',
          }}
        />

        {/* Middle content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: '#263238' }}>{name}</h2>

          {slug && (
            <div
              onClick={copySlug}
              style={{
                fontSize: 13,
                color: '#FF7043',
                cursor: 'pointer',
                textDecoration: 'underline',
                width: 'fit-content',
              }}
            >
              {fullUrl}
            </div>
          )}

          {pronouns && (
            <p style={{ margin: 0, fontSize: 14, color: '#607D8B' }}>{pronouns}</p>
          )}

          {headline && (
            <p style={{ margin: 0, fontSize: 15, color: '#455A64' }}>{headline}</p>
          )}

          {/* Visibility hint */}
          <p style={{ margin: 0, fontSize: 12, color: '#90A4AE' }}>
            Profile visibility: {visibilityLabel}
          </p>
        </div>

        <button
          onClick={() => setEditOpen(true)}
          style={{
            border: '1px solid #FF7043',
            padding: '6px 12px',
            borderRadius: 8,
            color: '#FF7043',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          Edit
        </button>
      </div>

      {/* Edit dialog */}
      {editOpen && (
        <Dialog title="Edit Profile Appearance" onClose={() => setEditOpen(false)}>
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

            {/* Personal URL / slug editor */}
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Personal URL</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: '#455A64' }}>
                  https://forgetomorrow.com/u/
                </span>
                <input
                  value={slugValue}
                  onChange={(e) => setSlugValue(e.target.value)}
                  placeholder="your-name-here"
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    padding: 6,
                    minWidth: 160,
                  }}
                />
              </div>
              <small style={{ color: '#90A4AE' }}>
                Letters, numbers, and hyphens only. This is the link you can share publicly.
              </small>
              <small style={{ color: '#607D8B' }}>
                Preview: {fullUrlFromInput}
              </small>
            </div>

            {/* Profile visibility selector */}
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
                Public: anyone with your link can view. Recruiters only: hidden from public; visible only to approved recruiters.
              </small>
            </div>

            {/* Avatar selector */}
            <ProfileAvatarSelector value={avatarUrl} onChange={setAvatarUrl} />

            {/* BANNER SELECTION */}
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
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#263238' }}>
                            {b.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#78909C' }}>{b.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* WALLPAPER SELECTION */}
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
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#263238' }}>
                            {w.name}
                          </div>
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
                max={220}
                value={bannerH}
                onChange={(e) => setBannerH(Number(e.target.value))}
              />
              <small style={{ color: '#607D8B' }}>{bannerH}px</small>
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
                <div style={{ width: '100%', border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' }}>
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
              Tip: Click your profile URL to copy it. Your avatar, banner, wallpaper, and profile text are now saved to your account and will load on any device.
            </small>
          </div>
        </Dialog>
      )}
    </section>
  );
}

/* ===== Banner, Toggle, Dialog ===== */

function BannerCover({ url, height, focalY }) {
  return (
    <div
      style={{
        height,
        width: '100%',
        backgroundImage: `url(${url})`,
        backgroundSize: 'cover',
        backgroundPosition: `center ${focalY}%`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}

function BannerFit({ url, height }) {
  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
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

function Dialog({ children, title, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
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
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
