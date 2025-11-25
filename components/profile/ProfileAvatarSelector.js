// components/profile/ProfileAvatarSelector.js
'use client';

import React, { useRef, useState } from 'react';

// Preset avatar options.
// You can later drop real PNGs into /public/avatars/... with these names.
const AVATAR_OPTIONS = [
  {
    label: 'Default',
    url: '/profile-avatars/avatar-default-forge.png',
  },
  {
    label: 'Professional',
    url: '/profile-avatars/avatar-professional-path.png',
  },
  {
    label: 'Creator',
    url: '/profile-avatars/avatar-creator-spectrum.png',
  },
  {
    label: 'Tech',
    url: '/profile-avatars/avatar-tech-nexus.png',
  },
  {
    label: 'Coach',
    url: '/profile-avatars/avatar-coach-beacon.png',
  },
];

export default function ProfileAvatarSelector({ value, onChange }) {
  const current = value || '/demo-avatar.png';
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handlePresetClick = (url) => {
    onChange(url);
  };

  const handleCustomClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      event.target.value = '';
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const dataUrl = reader.result;
        if (typeof dataUrl !== 'string') {
          throw new Error('Failed to read image file.');
        }

        const res = await fetch('/api/profile/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarDataUrl: dataUrl }),
        });

        const json = await res.json();

        if (!res.ok) {
          console.error('[ProfileAvatarSelector] upload error', json);
          alert(json.error || 'Failed to save avatar.');
          return;
        }

        onChange(json.avatarUrl || null);
      } catch (err) {
        console.error('[ProfileAvatarSelector] upload error', err);
        alert('Something went wrong uploading your avatar.');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    try {
      const res = await fetch('/api/profile/avatar', { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        console.error('[ProfileAvatarSelector] remove error', json);
        alert(json.error || 'Failed to remove avatar.');
        return;
      }
      onChange(null); // fall back to initials everywhere
    } catch (err) {
      console.error('[ProfileAvatarSelector] remove error', err);
      alert('Something went wrong removing your avatar.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>Choose an avatar</span>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
        }}
      >
        {AVATAR_OPTIONS.map((opt) => {
          const selected = opt.url === current;
          return (
            <button
              key={opt.url}
              type="button"
              onClick={() => handlePresetClick(opt.url)}
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
              title={opt.label}
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

        {/* + Custom upload circle */}
        <button
          type="button"
          onClick={handleCustomClick}
          disabled={uploading}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '2px dashed #FF7043',
            background: uploading ? '#FFF3E0' : 'white',
            color: '#FF7043',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: uploading ? 'default' : 'pointer',
          }}
          title="Upload custom avatar"
        >
          {uploading ? '…' : '+ Custom'}
        </button>

        {/* Remove avatar circle (far right) */}
        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '1px solid #CFD8DC',
            background: removing ? '#FFECEF' : 'white',
            color: '#D84315',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: removing ? 'default' : 'pointer',
          }}
          title="Remove avatar (use initials)"
        >
          {removing ? '…' : 'Remove'}
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <small style={{ fontSize: 12, color: '#90A4AE' }}>
        Pick a preset avatar, upload your own, or remove it to use your initials.
      </small>
    </div>
  );
}
