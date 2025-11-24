'use client';

import React, { useState } from 'react';
import { profileBanners } from '@/lib/profileBanners';

export default function ProfileBannerSelector({ value, onChange }) {
  const [selected, setSelected] = useState(value || '');

  const handleSelect = (src) => {
    setSelected(src);
    onChange(src);
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#455A64' }}>
        Choose banner image
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
        }}
      >
        {profileBanners.map((b) => {
          const active = selected === b.src;
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => handleSelect(b.src)}
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
              <div style={{ fontSize: 12, fontWeight: 700, color: '#263238' }}>
                {b.name}
              </div>
              <div style={{ fontSize: 11, color: '#78909C' }}>{b.desc}</div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          style={{
            marginTop: 8,
            borderRadius: 8,
            border: '1px solid #ccc',
            overflow: 'hidden',
            maxHeight: 120,
          }}
        >
          <img
            src={selected}
            alt="Selected banner preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
      )}
    </div>
  );
}
