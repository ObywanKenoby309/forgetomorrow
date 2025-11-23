// components/profile/ProfileAvatarSelector.js
'use client';

import React from 'react';

// Preset avatar options.
// 🔸 You can later drop real PNGs into /public/avatars/... with these names.
// For now they'll just 404 gracefully if not present.
const AVATAR_OPTIONS = [
  {
    label: 'Default',
    url: '/demo-avatar.png', // a neutral placeholder headshot / silhouette
  },
  {
    label: 'Professional',
    url: '/avatars/avatar-professional.png',
  },
  {
    label: 'Creator',
    url: '/avatars/avatar-creator.png',
  },
  {
    label: 'Tech',
    url: '/avatars/avatar-tech.png',
  },
  {
    label: 'Coach',
    url: '/avatars/avatar-coach.png',
  },
];

export default function ProfileAvatarSelector({ value, onChange }) {
  const current = value || '/demo-avatar.png';

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>Choose an avatar</span>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        {AVATAR_OPTIONS.map((opt) => {
          const selected = opt.url === current;
          return (
            <button
              key={opt.url}
              type="button"
              onClick={() => onChange(opt.url)}
              style={{
                borderRadius: 999,
                padding: 2,
                border: selected
                  ? '2px solid #FF7043'
                  : '1px solid #CFD8DC',
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={opt.url}
                alt={opt.label}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            </button>
          );
        })}
      </div>
      <small style={{ fontSize: 12, color: '#90A4AE' }}>
        You can also paste a custom image URL in the Avatar URL field above.
      </small>
    </div>
  );
}
