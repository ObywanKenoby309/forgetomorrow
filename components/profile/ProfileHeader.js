// components/profile/ProfileHeader.js
'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

  const [avatarUrl, setAvatarUrl] = useState('/profile-avatars/demo-avatar.png');
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
          user.name || [user.firstName, user.lastName].filter(Boolean).join(' ');

        setName(fullName || 'Unnamed');
        setSlug(user.slug || null);
        setSlugValue(user.slug || '');

        setPronouns(user.pronouns || '');
        setHeadline(user.headline || '');

        setAvatarUrl(user.avatarUrl || '/profile-avatars/demo-avatar.png');

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
          avatarUrl,
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
        border: 'none',
        borderTop: 'none',
        borderRadius: 12,
        overflow: 'visible',
        background: 'transparent',
      }}
    >
      {coverUrl &&
        (bannerMode === 'cover' ? (
          <BannerCover url={coverUrl} height={bannerH} focalY={focalY} />
        ) : (
          <BannerFit url={coverUrl} height={bannerH} />
        ))}

      {/* Header Row (GLASS) */}
      <div
        style={{
          padding: 16,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.22)',
          background: 'rgba(255,255,255,0.58)',
          boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
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

          {pronouns && <p style={{ margin: 0, fontSize: 14, color: '#607D8B' }}>{pronouns}</p>}
          {headline && <p style={{ margin: 0, fontSize: 15, color: '#455A64' }}>{headline}</p>}

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
            background: 'rgba(255,255,255,0.75)',
            cursor: 'pointer',
            fontWeight: 800,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
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
                <VisibilityPill label="Private" active={visibility === 'private'} onClick={() => setVisibility('private')} />
                <VisibilityPill label="Public" active={visibility === 'public'} onClick={() => setVisibility('public')} />
                <VisibilityPill label="Recruiters only" active={visibility === 'recruiters'} onClick={() => setVisibility('recruiters')} />
              </div>
              <small style={{ color: '#90A4AE' }}>
                Public: anyone with your link can view. Recruiters only: hidden from public; visible only to approved recruiters.
              </small>
            </div>

            <ProfileAvatarSelector value={avatarUrl} onChange={setAvatarUrl} />

            {/* Banner + wallpaper UI unchanged below */}
            {/* ... your existing banner/wallpaper controls remain exactly as-is ... */}

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
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
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
