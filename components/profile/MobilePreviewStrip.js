// components/profile/MobilePreviewStrip.js
import React from 'react';

export default function MobilePreviewStrip({
  avatarUrl,
  name,
  headline,
  location,
  status,
  initials,
  coverUrl,
  bannerPos,
  wallpaperUrl,
}) {
  const NAVY = '#0D1B2A';
  const bannerImage = coverUrl ? `url(${coverUrl})` : null;

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#90A4AE',
          marginBottom: 8,
        }}
      >
        Live preview
      </div>

      <div
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          maxWidth: 320,
          margin: '0 auto',
          border: '1px solid rgba(255,255,255,0.16)',
          background: wallpaperUrl
            ? `url(${wallpaperUrl}) center/cover no-repeat`
            : `linear-gradient(135deg, ${NAVY} 0%, #1a3048 100%)`,
        }}
      >
        <div
          style={{
            background:
              'linear-gradient(180deg,rgba(13,27,42,0.5) 0%,rgba(13,27,42,0.65) 100%)',
            padding: 10,
          }}
        >
          {bannerImage && (
            <div
              style={{
                height: 40,
                borderRadius: 7,
                overflow: 'hidden',
                marginBottom: 8,
                position: 'relative',
                background: NAVY,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: bannerImage,
                  backgroundSize: 'cover',
                  backgroundPosition: bannerPos,
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                flexShrink: 0,
                border: '2px solid #FF7043',
                overflow: 'hidden',
                background: '#162336',
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
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
                    background: 'linear-gradient(135deg,#FF7043,#F4511E)',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: 11,
                  }}
                >
                  {initials}
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#F8F4EF' }}>
                {name || 'Your Name'}
              </div>

              {headline && (
                <div
                  style={{
                    fontSize: 9,
                    color: 'rgba(248,244,239,0.65)',
                    marginTop: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {headline}
                </div>
              )}

              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
                {location && (
                  <span
                    style={{
                      fontSize: 8,
                      padding: '1px 6px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.10)',
                      color: 'rgba(248,244,239,0.75)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    {location}
                  </span>
                )}

                {status && (
                  <span
                    style={{
                      fontSize: 8,
                      padding: '1px 6px',
                      borderRadius: 999,
                      background: 'rgba(255,112,67,0.18)',
                      color: '#FF7043',
                      border: '1px solid rgba(255,112,67,0.30)',
                    }}
                  >
                    {status}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
