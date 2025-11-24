'use client';

import React, { useEffect, useState } from 'react';
import { profileBanners } from '@/lib/profileBanners';
import { profileWallpapers } from '@/lib/profileWallpapers';

export default function ProfileAppearance() {
  const [selectedBanner, setSelectedBanner] = useState('');
  const [selectedWallpaper, setSelectedWallpaper] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  // Load current values from header API
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/profile/header');
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to load appearance settings.');
        }
        const data = await res.json();
        const user = data.user || {};

        if (cancelled) return;

        setSelectedBanner(user.coverUrl || '');
        setSelectedWallpaper(user.wallpaperUrl || '');
      } catch (err) {
        if (!cancelled) {
          console.error('load /api/profile/header (appearance)', err);
          setError(err.message || 'Failed to load appearance settings.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSavedMessage('');

    try {
      const res = await fetch('/api/profile/header', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Only updating these two; Prisma will ignore undefined for others
          coverUrl: selectedBanner || null,
          wallpaperUrl: selectedWallpaper || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save appearance.');
      }

      setSavedMessage('Appearance updated. Your profile will now use these visuals.');
    } catch (err) {
      console.error('PATCH /api/profile/header (appearance)', err);
      setError(err.message || 'Failed to save appearance.');
    } finally {
      setSaving(false);
    }
  };

  const isBannerSelected = (src) => selectedBanner === src;
  const isWallpaperSelected = (src) => selectedWallpaper === src;

  return (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        display: 'grid',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#FF7043', fontWeight: 700, fontSize: '1.1rem' }}>
          Profile Appearance
        </h3>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            background: '#FF7043',
            color: 'white',
            border: 'none',
            borderRadius: 999,
            padding: '8px 18px',
            fontWeight: 700,
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.8 : 1,
            fontSize: '0.9rem',
          }}
        >
          {saving ? 'Saving…' : 'Save appearance'}
        </button>
      </div>

      <p style={{ margin: 0, color: '#607D8B', fontSize: 13 }}>
        Choose a banner for your profile header and an optional wallpaper to bring the rest
        of the page to life. You can change these any time.
      </p>

      {loading ? (
        <p style={{ margin: 0, color: '#718096', fontSize: '0.9375rem' }}>
          Loading your appearance settings…
        </p>
      ) : (
        <>
          {/* BANNERS */}
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#455A64' }}>Profile banner</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 10,
              }}
            >
              {profileBanners.map((b) => {
                const active = isBannerSelected(b.src);
                return (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => setSelectedBanner(b.src)}
                    style={{
                      borderRadius: 10,
                      padding: 6,
                      border: active ? '2px solid #FF7043' : '1px solid #e0e0e0',
                      background: active ? '#FFF3E0' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'grid',
                      gap: 6,
                    }
                    }
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
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#263238' }}>
                      {b.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#78909C' }}>{b.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* WALLPAPERS */}
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#455A64' }}>
              Page wallpaper (optional)
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 10,
              }}
            >
              {profileWallpapers.map((w) => {
                const active = isWallpaperSelected(w.src);
                return (
                  <button
                    key={w.key}
                    type="button"
                    onClick={() => setSelectedWallpaper(w.src)}
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
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#263238' }}>
                      {w.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#78909C' }}>{w.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {error && (
        <p style={{ margin: 0, color: '#e53e3e', fontSize: 12 }}>
          {error}
        </p>
      )}

      {savedMessage && !error && (
        <p style={{ margin: 0, color: '#2e7d32', fontSize: 12 }}>
          {savedMessage}
        </p>
      )}
    </section>
  );
}
