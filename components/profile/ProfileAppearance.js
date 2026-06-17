'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { profileBanners } from '@/lib/profileBanners';
import { profileWallpapers } from '@/lib/profileWallpapers';

const ORANGE = '#FF7043';

function getAssetCategoryList(items = []) {
  return Array.from(new Set(items.map((item) => item.category).filter(Boolean)));
}

function assetMatchesSearch(asset, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    asset?.name,
    asset?.desc,
    asset?.category,
    ...(Array.isArray(asset?.tags) ? asset.tags : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(q);
}

function getAssetName(items, selectedSrc, fallback) {
  if (!selectedSrc) return fallback;
  return items.find((item) => item.src === selectedSrc)?.name || 'Custom selection';
}

function CompactAssetPicker({
  label,
  helper,
  items = [],
  selectedSrc,
  onSelect,
  emptyLabel,
  emptyMeta,
  searchPlaceholder,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const pickerRef = useRef(null);

  const categories = useMemo(() => getAssetCategoryList(items), [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const categoryMatches = activeCategory === 'All' || item.category === activeCategory;
      return categoryMatches && assetMatchesSearch(item, query);
    });
  }, [items, activeCategory, query]);

  const selectedName = getAssetName(items, selectedSrc, emptyLabel);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event) {
      if (!pickerRef.current) return;
      if (!pickerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSelect = (src) => {
    onSelect(src);
    setOpen(false);
  };

  return (
    <div ref={pickerRef} style={{ display: 'grid', gap: 8, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#455A64' }}>{label}</div>
          {helper && <div style={{ fontSize: 12, color: '#78909C', marginTop: 2 }}>{helper}</div>}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          style={{
            borderRadius: 999,
            border: `1px solid ${open ? ORANGE : '#e0e0e0'}`,
            background: open ? '#FFF3E0' : 'white',
            color: open ? ORANGE : '#455A64',
            padding: '7px 14px',
            fontWeight: 800,
            fontSize: 12,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {open ? 'Close' : 'More'}
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '96px minmax(0, 1fr)',
          gap: 10,
          alignItems: 'center',
          border: '1px solid #eceff1',
          borderRadius: 12,
          padding: 8,
          background: '#fafafa',
        }}
      >
        <div
          style={{
            height: 52,
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid #e0e0e0',
            background: '#eceff1',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {selectedSrc ? (
            <img
              src={selectedSrc}
              alt={selectedName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <span style={{ fontSize: 11, color: '#78909C', fontWeight: 800 }}>{emptyLabel}</span>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: '#263238',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedName}
          </div>
          <div style={{ fontSize: 11, color: '#78909C', marginTop: 3 }}>
            {selectedSrc ? 'Selected, not saved until you press Save appearance.' : emptyMeta}
          </div>
        </div>
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            zIndex: 30,
            border: '1px solid #e0e0e0',
            borderRadius: 14,
            background: 'white',
            boxShadow: '0 18px 44px rgba(13,27,42,0.18)',
            padding: 12,
            display: 'grid',
            gap: 10,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8 }}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              style={{
                minWidth: 0,
                borderRadius: 10,
                border: '1px solid #e0e0e0',
                padding: '9px 11px',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => handleSelect('')}
              style={{
                borderRadius: 10,
                border: !selectedSrc ? `2px solid ${ORANGE}` : '1px solid #e0e0e0',
                background: !selectedSrc ? '#FFF3E0' : 'white',
                color: !selectedSrc ? ORANGE : '#455A64',
                padding: '8px 11px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {emptyLabel}
            </button>
          </div>

          {categories.length > 0 && (
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setActiveCategory('All')}
                style={{
                  borderRadius: 999,
                  border: activeCategory === 'All' ? `1px solid ${ORANGE}` : '1px solid #e0e0e0',
                  background: activeCategory === 'All' ? '#FFF3E0' : 'white',
                  color: activeCategory === 'All' ? ORANGE : '#607D8B',
                  padding: '5px 10px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                All
              </button>

              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  style={{
                    borderRadius: 999,
                    border: activeCategory === category ? `1px solid ${ORANGE}` : '1px solid #e0e0e0',
                    background: activeCategory === category ? '#FFF3E0' : 'white',
                    color: activeCategory === category ? ORANGE : '#607D8B',
                    padding: '5px 10px',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))',
              gap: 8,
              maxHeight: 290,
              overflowY: 'auto',
              paddingRight: 2,
            }}
          >
            {filteredItems.map((asset) => {
              const active = selectedSrc === asset.src;

              return (
                <button
                  key={asset.key}
                  type="button"
                  onClick={() => handleSelect(asset.src)}
                  title={asset.desc || asset.name}
                  style={{
                    borderRadius: 10,
                    padding: 5,
                    border: active ? `2px solid ${ORANGE}` : '1px solid #e0e0e0',
                    background: active ? '#FFF3E0' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'grid',
                    gap: 5,
                    minHeight: 0,
                  }}
                >
                  <div
                    style={{
                      height: 54,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid #eceff1',
                      background: '#eceff1',
                    }}
                  >
                    <img
                      src={asset.src}
                      alt={asset.name}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#263238',
                      lineHeight: 1.25,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {asset.name}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div style={{ fontSize: 12, color: '#78909C', padding: '6px 0' }}>
              No images match that search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
        overflow: 'visible',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h3 style={{ margin: 0, color: ORANGE, fontWeight: 700, fontSize: '1.1rem' }}>
          Profile Appearance
        </h3>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          style={{
            background: ORANGE,
            color: 'white',
            border: 'none',
            borderRadius: 999,
            padding: '8px 18px',
            fontWeight: 700,
            cursor: saving || loading ? 'default' : 'pointer',
            opacity: saving || loading ? 0.8 : 1,
            fontSize: '0.9rem',
            whiteSpace: 'nowrap',
          }}
        >
          {saving ? 'Saving…' : 'Save appearance'}
        </button>
      </div>

      <p style={{ margin: 0, color: '#607D8B', fontSize: 13 }}>
        Choose a banner for your profile header and an optional wallpaper for the profile background.
        Changes are only saved after you press Save appearance.
      </p>

      {loading ? (
        <p style={{ margin: 0, color: '#718096', fontSize: '0.9375rem' }}>
          Loading your appearance settings…
        </p>
      ) : (
        <>
          <CompactAssetPicker
            label="Profile banner"
            helper="Shown at the top of your profile."
            items={profileBanners}
            selectedSrc={selectedBanner}
            onSelect={setSelectedBanner}
            emptyLabel="No banner"
            emptyMeta="Your profile will use the default header."
            searchPlaceholder="Search banners…"
          />

          <CompactAssetPicker
            label="Page wallpaper"
            helper="Shown behind your profile content."
            items={profileWallpapers}
            selectedSrc={selectedWallpaper}
            onSelect={setSelectedWallpaper}
            emptyLabel="Default"
            emptyMeta="Your profile will use the default wallpaper."
            searchPlaceholder="Search wallpapers…"
          />
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
