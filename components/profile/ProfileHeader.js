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

  const [pronouns, setPronouns] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('/demo-avatar.png');
  const [coverUrl, setCoverUrl] = useState('');
  const [wallpaperUrl, setWallpaperUrl] = useState('');

  const [bannerH, setBannerH] = useState(120);
  const [bannerMode, setBannerMode] = useState('cover');
  const [focalY, setFocalY] = useState(50);

  // UI state: 'private' | 'public' | 'recruiters'
  const [visibility, setVisibility] = useState('private');

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [bannerMoreOpen, setBannerMoreOpen] = useState(false);
  const [wallpaperMoreOpen, setWallpaperMoreOpen] = useState(false);

  useEffect(() => {
    let cancel = false;

    (async () => {
      try {
        const res = await fetch('/api/profile/header');
        if (!res.ok) throw new Error('Failed to load profile');

        const data = await res.json();
        const user = data.user || data;
        if (!user || cancel) return;

        const fullName =
          user.name || [user.firstName, user.lastName].filter(Boolean).join(' ');

        setName(fullName || 'Unnamed');
        setSlug(user.slug || null);
        setSlugValue(user.slug || '');

        setPronouns(user.pronouns || '');
        setHeadline(user.headline || '');
        setLocation(user.location || '');

        setAvatarUrl(user.avatarUrl || '/demo-avatar.png');

        const corporateBanner = data.corporateBanner || user.corporateBanner || null;
        const effectiveCoverUrl =
          (corporateBanner && corporateBanner.bannerSrc) || user.coverUrl || '';
        setCoverUrl(effectiveCoverUrl);

        setWallpaperUrl(user.wallpaperUrl || '');

        const h = user.bannerHeight != null ? user.bannerHeight : 120;
        setBannerH(clamp(h, 80, 220));

        const mode = user.bannerMode === 'fit' ? 'fit' : 'cover';
        setBannerMode(mode);

        const fy = user.bannerFocalY != null ? user.bannerFocalY : 50;
        setFocalY(clamp(fy, 0, 100));

        // Source of truth is profileVisibility when present.
        // Fallback to isProfilePublic for older rows.
        const pv = (user.profileVisibility || '').toString().toUpperCase();
        if (pv === 'PUBLIC') setVisibility('public');
        else if (pv === 'RECRUITERS_ONLY') setVisibility('recruiters'); // ✅ FIX
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

    const cleanedSlug = slugValue.trim().toLowerCase().replace(/\s+/g, '-');

    // Map UI -> DB enum
    const profileVisibility =
      visibility === 'public'
        ? 'PUBLIC'
        : visibility === 'recruiters'
        ? 'RECRUITERS_ONLY' // ✅ FIX
        : 'PRIVATE';

    try {
      const res = await fetch('/api/profile/header', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline,
          pronouns,
          location,
          avatarUrl,
          coverUrl: coverUrl || null,
          wallpaperUrl: wallpaperUrl || null,
          bannerMode,
          bannerHeight: bannerH,
          bannerFocalY: focalY,
          slug: cleanedSlug,

          // NEW (real)
          profileVisibility,

          // Legacy sync (kept for older logic elsewhere)
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

          {/* Location kept as profile header display; you already removed status from this editor */}
          <p style={{ margin: 0, fontSize: 14, color: '#455A64' }}>
            {location && `Location: ${location}`}
          </p>

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

      {editOpen && (
        <Dialog title="Profile Appearance" onClose={() => setEditOpen(false)}>
          <div style={{ display: 'grid', gap: 12 }}>
            {/* ...everything else unchanged... */}

            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Profile visibility</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <VisibilityPill
                  label="Private"
                  value="private"
                  active={visibility === 'private'}
                  onClick={() => setVisibility('private')}
                />
                <VisibilityPill
                  label="Public"
                  value="public"
                  active={visibility === 'public'}
                  onClick={() => setVisibility('public')}
                />
                <VisibilityPill
                  label="Recruiters only"
                  value="recruiters"
                  active={visibility === 'recruiters'}
                  onClick={() => setVisibility('recruiters')}
                />
              </div>
              <small style={{ color: '#90A4AE' }}>
                Public: anyone with your link can view. Recruiters only: hidden from public; visible only to recruiters.
              </small>
            </div>

            {/* keep your existing controls and buttons */}
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
          </div>
        </Dialog>
      )}
    </section>
  );
}

/* ===== helpers unchanged ===== */
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
