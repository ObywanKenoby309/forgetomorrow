import React, { useEffect, useState } from 'react';
import ProfileBannerSelector from '@/components/profile/ProfileBannerSelector';

const NAME_KEY = 'profile_name_v2';
const PRONOUNS_KEY = 'profile_pronouns_v2';
const HEADLINE_KEY = 'profile_headline_v2';
const LOC_KEY = 'profile_location_v2';
const STATUS_KEY = 'profile_status_v2';
const AVATAR_KEY = 'profile_avatar_v2';
const COVER_KEY = 'profile_cover_v2';
const BANNER_H_KEY = 'profile_banner_h_v1';
const BANNER_MODE_KEY = 'profile_banner_mode_v1';   // 'cover' | 'fit'
const BANNER_FOCALY_KEY = 'profile_banner_focalY_v1'; // 0..100

export default function ProfileHeader() {
  const [name, setName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('/demo-profile.jpg');
  const [coverUrl, setCoverUrl] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const [bannerH, setBannerH] = useState(120);
  const [bannerMode, setBannerMode] = useState('cover'); // 'cover' | 'fit'
  const [focalY, setFocalY] = useState(50);              // 0..100

  // Load
  useEffect(() => {
    try {
      setName(localStorage.getItem(NAME_KEY) || 'Unnamed');
      setPronouns(localStorage.getItem(PRONOUNS_KEY) || '');
      setHeadline(localStorage.getItem(HEADLINE_KEY) || '');
      setLocation(localStorage.getItem(LOC_KEY) || '');
      setStatus(localStorage.getItem(STATUS_KEY) || '');
      setAvatarUrl(localStorage.getItem(AVATAR_KEY) || '/demo-profile.jpg');
      setCoverUrl(localStorage.getItem(COVER_KEY) || '');

      const h = parseInt(localStorage.getItem(BANNER_H_KEY) || '120', 10);
      if (!Number.isNaN(h)) setBannerH(clamp(h, 80, 220));

      setBannerMode(localStorage.getItem(BANNER_MODE_KEY) || 'cover');

      const fy = parseInt(localStorage.getItem(BANNER_FOCALY_KEY) || '50', 10);
      if (!Number.isNaN(fy)) setFocalY(clamp(fy, 0, 100));
    } catch {}
  }, []);

  // Persist
  useEffect(() => { try { localStorage.setItem(NAME_KEY, name); } catch {} }, [name]);
  useEffect(() => { try { localStorage.setItem(PRONOUNS_KEY, pronouns); } catch {} }, [pronouns]);
  useEffect(() => { try { localStorage.setItem(HEADLINE_KEY, headline); } catch {} }, [headline]);
  useEffect(() => { try { localStorage.setItem(LOC_KEY, location); } catch {} }, [location]);
  useEffect(() => { try { localStorage.setItem(STATUS_KEY, status); } catch {} }, [status]);
  useEffect(() => { try { localStorage.setItem(AVATAR_KEY, avatarUrl); } catch {} }, [avatarUrl]);
  useEffect(() => { try { localStorage.setItem(COVER_KEY, coverUrl); } catch {} }, [coverUrl]);
  useEffect(() => { try { localStorage.setItem(BANNER_H_KEY, String(bannerH)); } catch {} }, [bannerH]);
  useEffect(() => { try { localStorage.setItem(BANNER_MODE_KEY, bannerMode); } catch {} }, [bannerMode]);
  useEffect(() => { try { localStorage.setItem(BANNER_FOCALY_KEY, String(focalY)); } catch {} }, [focalY]);

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
      {/* Banner */}
      {coverUrl && (
        bannerMode === 'cover'
          ? <BannerCover url={coverUrl} height={bannerH} focalY={focalY} />
          : <BannerFit   url={coverUrl} height={bannerH} />
      )}

      {/* Header row */}
      <div style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <img
          src={avatarUrl}
          alt="Profile avatar"
          style={{
            width: 96, height: 96, borderRadius: '50%',
            border: '3px solid #FF7043', objectFit: 'cover'
          }}
        />
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: '#263238' }}>{name}</h2>
          {pronouns && <p style={{ margin: 0, fontSize: 14, color: '#607D8B' }}>{pronouns}</p>}
          {headline && <p style={{ margin: 0, fontSize: 15, color: '#455A64' }}>{headline}</p>}
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#455A64' }}>
            {location && `📍 ${location}`} {status && `• ${status}`}
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
        <Dialog title="Edit Profile Header" onClose={() => setEditOpen(false)}>
          <div style={{ display: 'grid', gap: 10 }}>
            <LabeledInput label="Name" value={name} onChange={setName} />
            <LabeledInput label="Pronouns" value={pronouns} onChange={setPronouns} />
            <LabeledInput label="Headline" value={headline} onChange={setHeadline} />
            <LabeledInput label="Location" value={location} onChange={setLocation} />
            <LabeledInput label="Status" value={status} onChange={setStatus} />
            <LabeledInput label="Avatar URL" value={avatarUrl} onChange={setAvatarUrl} />

            <LabeledInput label="Cover URL (optional)" value={coverUrl} onChange={setCoverUrl} />
            <ProfileBannerSelector value={coverUrl} onChange={setCoverUrl} />

            {/* Mode */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Banner mode</span>
              <ModeToggle value={bannerMode} onChange={setBannerMode} />
            </div>

            {/* Height */}
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

            {/* Focal Y only for cover */}
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

            {/* Live preview */}
            {coverUrl && (
              <div style={{ display: 'grid', gap: 8 }}>
                <small style={{ color: '#607D8B' }}>Preview</small>
                <div
                  style={{
                    width: '100%',
                    border: '1px solid #eee',
                    borderRadius: 6,
                    overflow: 'hidden'
                  }}
                >
                  {bannerMode === 'cover'
                    ? <BannerCover url={coverUrl} height={120} focalY={focalY} />
                    : <BannerFit   url={coverUrl} height={120} />}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => setEditOpen(false)}
                style={{
                  background: 'white', color: '#455A64',
                  border: '1px solid #cfd8dc', padding: '6px 12px',
                  borderRadius: 6, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setEditOpen(false)}
                style={{
                  background: '#FF7043', color: 'white',
                  border: 'none', padding: '6px 12px',
                  borderRadius: 6, cursor: 'pointer', fontWeight: 700,
                }}
              >
                Save
              </button>
            </div>

            <small style={{ color: '#90A4AE' }}>
              Tip: For best results upload a wide banner (~1280×320 or 1600×400).
              Use <b>Fit</b> to avoid cropping, or <b>Cover</b> with the vertical focus slider to crop gracefully.
            </small>
          </div>
        </Dialog>
      )}
    </section>
  );
}

/* ---------- Banner renderers ---------- */

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
      {/* Soft backdrop to avoid bars */}
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
          objectPosition: 'center',
        }}
      />
    </div>
  );
}

/* ---------- UI bits ---------- */

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

function LabeledInput({ label, value, onChange }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ border: '1px solid #ddd', borderRadius: 6, padding: 8 }}
      />
    </label>
  );
}

/* Wider + scrollable dialog */
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
        padding: 16, // keep space at very small viewports
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 8,
          padding: 16,
          width: 720,           // wider editor on desktop
          maxWidth: '98vw',
          maxHeight: '92vh',    // enable vertical scrolling when tall
          overflowY: 'auto',
          display: 'grid',
          gap: 10,
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
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
