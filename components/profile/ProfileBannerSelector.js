'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { profileBanners } from '@/lib/profileBanners';

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

function getSelectedName(items, selectedSrc) {
  if (!selectedSrc) return 'No banner';
  return items.find((item) => item.src === selectedSrc)?.name || 'Custom selection';
}

export default function ProfileBannerSelector({ value, onChange }) {
  const [selected, setSelected] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const pickerRef = useRef(null);

  useEffect(() => {
    setSelected(value || '');
  }, [value]);

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

  const categories = useMemo(() => getAssetCategoryList(profileBanners), []);

  const filteredBanners = useMemo(() => {
    return profileBanners.filter((banner) => {
      const categoryMatches = activeCategory === 'All' || banner.category === activeCategory;
      return categoryMatches && assetMatchesSearch(banner, query);
    });
  }, [activeCategory, query]);

  const handleSelect = (src) => {
    setSelected(src);
    onChange(src);
    setOpen(false);
  };

  const selectedName = getSelectedName(profileBanners, selected);

  return (
    <div ref={pickerRef} style={{ display: 'grid', gap: 10, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#455A64' }}>
            Choose banner image
          </div>
          <div style={{ fontSize: 11, color: '#78909C', marginTop: 2 }}>
            Pick from saved ForgeTomorrow banner options.
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          style={{
            borderRadius: 999,
            padding: '7px 14px',
            border: `1px solid ${open ? ORANGE : '#e0e0e0'}`,
            background: open ? '#FFF3E0' : 'white',
            color: open ? ORANGE : '#455A64',
            fontSize: 12,
            fontWeight: 800,
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
          borderRadius: 12,
          border: '1px solid #eceff1',
          background: '#fafafa',
          padding: 8,
        }}
      >
        <div
          style={{
            height: 52,
            borderRadius: 10,
            border: '1px solid #e0e0e0',
            background: '#eceff1',
            overflow: 'hidden',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {selected ? (
            <img
              src={selected}
              alt={selectedName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <span style={{ fontSize: 11, color: '#78909C', fontWeight: 800 }}>
              None
            </span>
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
            {selected ? 'Selected banner' : 'No banner selected'}
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
            borderRadius: 14,
            border: '1px solid #e0e0e0',
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
              placeholder="Search banners…"
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
                border: !selected ? `2px solid ${ORANGE}` : '1px solid #e0e0e0',
                background: !selected ? '#FFF3E0' : 'white',
                color: !selected ? ORANGE : '#455A64',
                padding: '8px 11px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              None
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
            {filteredBanners.map((banner) => {
              const active = selected === banner.src;

              return (
                <button
                  key={banner.key}
                  type="button"
                  onClick={() => handleSelect(banner.src)}
                  title={banner.desc || banner.name}
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
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid #eceff1',
                      height: 54,
                      background: '#eceff1',
                    }}
                  >
                    <img
                      src={banner.src}
                      alt={banner.name}
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
                    {banner.name}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredBanners.length === 0 && (
            <div style={{ fontSize: 12, color: '#78909C', padding: '6px 0' }}>
              No banners match that search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
