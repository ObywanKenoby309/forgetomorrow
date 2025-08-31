import React, { useEffect, useState } from 'react';

const NAME_KEY = 'profile_name_v2';
const PRONOUNS_KEY = 'profile_pronouns_v2';
const HEADLINE_KEY = 'profile_headline_v2';
const LOC_KEY = 'profile_location_v2';
const STATUS_KEY = 'profile_status_v2';
const AVATAR_KEY = 'profile_avatar_v2';
const COVER_KEY = 'profile_cover_v2';

export default function ProfileHeader() {
  const [name, setName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('/demo-profile.jpg');
  const [coverUrl, setCoverUrl] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  // Load from storage
  useEffect(() => {
    try {
      setName(localStorage.getItem(NAME_KEY) || 'Unnamed');
      setPronouns(localStorage.getItem(PRONOUNS_KEY) || '');
      setHeadline(localStorage.getItem(HEADLINE_KEY) || '');
      setLocation(localStorage.getItem(LOC_KEY) || '');
      setStatus(localStorage.getItem(STATUS_KEY) || '');
      setAvatarUrl(localStorage.getItem(AVATAR_KEY) || '/demo-profile.jpg');
      setCoverUrl(localStorage.getItem(COVER_KEY) || '');
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

  return (
    <section style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
      {coverUrl && (
        <div style={{ height: 140, backgroundSize: 'cover', backgroundImage: `url(${coverUrl})` }} />
      )}
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
          style={{ border: '1px solid #FF7043', padding: '6px 12px', borderRadius: 8, color: '#FF7043' }}
        >
          Edit
        </button>
      </div>

      {editOpen && (
        <Dialog title="Edit Profile Header" onClose={() => setEditOpen(false)}>
          <LabeledInput label="Name" value={name} onChange={setName} />
          <LabeledInput label="Pronouns" value={pronouns} onChange={setPronouns} />
          <LabeledInput label="Headline" value={headline} onChange={setHeadline} />
          <LabeledInput label="Location" value={location} onChange={setLocation} />
          <LabeledInput label="Status" value={status} onChange={setStatus} />
          <LabeledInput label="Avatar URL" value={avatarUrl} onChange={setAvatarUrl} />
          <LabeledInput label="Cover URL" value={coverUrl} onChange={setCoverUrl} />
        </Dialog>
      )}
    </section>
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

function Dialog({ children, title, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        display: 'grid', placeItems: 'center', zIndex: 50
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 8, padding: 16, width: 400, display: 'grid', gap: 8 }}
      >
        <h3 style={{ margin: 0 }}>{title}</h3>
        {children}
        <button onClick={onClose} style={{ marginTop: 8, background: '#FF7043', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6 }}>Close</button>
      </div>
    </div>
  );
}
