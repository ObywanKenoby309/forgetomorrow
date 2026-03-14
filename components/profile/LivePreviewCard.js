// components/profile/LivePreviewCard.js
import React from 'react';

export default function LivePreviewCard({
  avatarUrl,
  name,
  pronouns,
  headline,
  location,
  status,
  initials,
  coverUrl,
  bannerPos,
  wallpaperUrl,
  profileUrl,
  skills,
  languages,
  hobbies,
  visibility,
}) {
  const NAVY = '#0D1B2A';
  const bannerImage = coverUrl ? `url(${coverUrl})` : null;

  const skillLabels = (skills || [])
    .map((s) => (typeof s === 'string' ? s : s?.name || s?.label || ''))
    .filter(Boolean)
    .slice(0, 5);

  const langLabels = (languages || [])
    .map((l) => (typeof l === 'string' ? l : l?.name || l?.label || ''))
    .filter(Boolean)
    .slice(0, 3);

  const hobbyLabels = (hobbies || [])
    .map((h) => (typeof h === 'string' ? h : h?.name || h?.label || ''))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.40)',
        background: wallpaperUrl
          ? `url(${wallpaperUrl}) center/cover no-repeat`
          : `linear-gradient(135deg, ${NAVY} 0%, #1a3048 60%, ${NAVY} 100%)`,
      }}
    >
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(13,27,42,0.55) 0%, rgba(13,27,42,0.22) 50%, rgba(13,27,42,0.65) 100%)',
        }}
      >
        <div style={{ padding: 10 }}>
          {/* Banner */}
          <div
            style={{
              height: 60,
              borderRadius: 10,
              overflow: 'hidden',
              marginBottom: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: NAVY,
              position: 'relative',
            }}
          >
            {bannerImage ? (
              <>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: bannerImage,
                    backgroundSize: 'cover',
                    backgroundPosition: bannerPos,
                    filter: 'blur(6px)',
                    transform: 'scale(1.06)',
                    opacity: 0.85,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: bannerImage,
                    backgroundSize: 'cover',
                    backgroundPosition: bannerPos,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg,rgba(13,27,42,0.4),rgba(13,27,42,0.1))',
                  }}
                />
              </>
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.25)',
                    fontWeight: 600,
                  }}
                >
                  No banner
                </span>
              </div>
            )}
          </div>

          {/* Identity block */}
          <div
            style={{
              background: 'rgba(13,27,42,0.72)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 10,
              padding: 10,
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  flexShrink: 0,
                  border: '2px solid #FF7043',
                  overflow: 'hidden',
                  background: '#162336',
                  boxShadow: '0 0 0 2px rgba(13,27,42,0.85)',
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
                      fontSize: 12,
                    }}
                  >
                    {initials}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pe-preview-name">{name || 'Your Name'}</div>

                {pronouns && (
                  <div
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      color: '#FF7043',
                      marginTop: 1,
                    }}
                  >
                    {pronouns}
                  </div>
                )}

                {headline && (
                  <div
                    style={{
                      fontSize: 9,
                      color: 'rgba(248,244,239,0.72)',
                      marginTop: 2,
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {headline}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 7 }}>
              {location && <span className="pe-preview-chip">📍 {location}</span>}
              {status && <span className="pe-preview-chip orange">● {status}</span>}
              {visibility === 'public' && <span className="pe-preview-chip">🌐 Public</span>}
            </div>
          </div>

          {/* Skills */}
          {skillLabels.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,112,67,0.80)',
                  marginBottom: 5,
                }}
              >
                Skills
              </div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {skillLabels.map((s) => (
                  <span key={s} className="pe-preview-skill">
                    {s}
                  </span>
                ))}
                {(skills || []).length > 5 && (
                  <span className="pe-preview-skill" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    +{(skills || []).length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Languages */}
          {langLabels.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,112,67,0.80)',
                  marginBottom: 5,
                }}
              >
                Languages
              </div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {langLabels.map((l) => (
                  <span key={l} className="pe-preview-skill">
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {hobbyLabels.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,112,67,0.80)',
                  marginBottom: 5,
                }}
              >
                Interests
              </div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {hobbyLabels.map((h) => (
                  <span key={h} className="pe-preview-skill">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profileUrl && (
            <div
              style={{
                marginTop: 8,
                fontSize: 8,
                color: 'rgba(255,255,255,0.30)',
                fontWeight: 500,
                wordBreak: 'break-all',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: 7,
              }}
            >
              {profileUrl}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
