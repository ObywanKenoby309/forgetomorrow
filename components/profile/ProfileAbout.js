// components/profile/ProfileAbout.js
import React, { useEffect, useState } from 'react';

const PROFILE_ABOUT_BACKUP_KEY = 'ft_profile_about_backup_v1';

function safeGetBackup() {
  try {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(PROFILE_ABOUT_BACKUP_KEY) || '';
  } catch {
    return '';
  }
}

function safeSetBackup(val) {
  try {
    if (typeof window === 'undefined') return;
    const v = (val || '').trim();
    if (v) window.localStorage.setItem(PROFILE_ABOUT_BACKUP_KEY, v);
  } catch {
    // ignore
  }
}

export default function ProfileAbout({ about, setAbout }) {
  const [headline, setHeadline] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [summaryValue, setSummaryValue] = useState(about || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // On first mount, if parent about is empty, hydrate from local backup (prevents refresh wipe)
  useEffect(() => {
    if (typeof about === 'string' && about.trim().length > 0) return;
    if (summaryValue && summaryValue.trim().length > 0) return;

    const backup = safeGetBackup();
    if (backup) setSummaryValue(backup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep summaryValue in sync ONLY when parent about is a real (non-empty) value.
  // This prevents "about === ''" from wiping out what we already have.
  useEffect(() => {
    if (typeof about !== 'string') return;

    const incoming = about.trim();
    if (!incoming) return;

    setSummaryValue(incoming);
    safeSetBackup(incoming);
  }, [about]);

  // Load headline + pronouns from /api/profile/header
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/profile/header');
        if (!res.ok) throw new Error('Failed to load profile header');
        const data = await res.json();
        const user = data.user || data;
        if (!user || cancelled) return;

        setHeadline(user.headline || '');
        setPronouns(user.pronouns || '');
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load headline/pronouns', err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load About Me from /api/profile/details if needed
  useEffect(() => {
    // Only skip fetch if about is a non-empty string
    if (typeof about === 'string' && about.trim().length > 0) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/profile/details');
        if (!res.ok) throw new Error('Failed to load profile details');
        const data = await res.json();
        const serverAbout = (data?.user?.aboutMe || '').trim();

        if (cancelled) return;

        // Only apply serverAbout if it's real. Never overwrite with empty.
        if (serverAbout) {
          setSummaryValue(serverAbout);
          safeSetBackup(serverAbout);
          if (typeof setAbout === 'function') setAbout(serverAbout);
        } else {
          // If server returns empty, keep what we already have (including backup)
          const backup = safeGetBackup();
          if (!summaryValue?.trim() && backup) {
            setSummaryValue(backup);
          }
        }
      } catch (err) {
        if (!cancelled) console.error('Failed to load About Me', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [about, setAbout, summaryValue]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // 1) Save headline + pronouns
      const resHeader = await fetch('/api/profile/header', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline,
          pronouns,
        }),
      });

      let headerData = {};
      if (!resHeader.ok) {
        try {
          headerData = await resHeader.json();
        } catch (_) {}
        throw new Error(headerData.error || 'Failed to save headline/pronouns');
      }

      // 2) Save About Me summary
      const resDetails = await fetch('/api/profile/details', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aboutMe: summaryValue,
        }),
      });

      let detailsData = {};
      if (!resDetails.ok) {
        try {
          detailsData = await resDetails.json();
        } catch (_) {}
        throw new Error(detailsData.error || 'Failed to save About Me');
      }

      if (typeof setAbout === 'function') setAbout(summaryValue);
      safeSetBackup(summaryValue);
    } catch (err) {
      console.error('Failed to save About Me', err);
      setError(err.message || 'Failed to save About Me');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setError(null);

    try {
      // Reload server truth for header + details
      const [h, d] = await Promise.all([
        fetch('/api/profile/header'),
        fetch('/api/profile/details'),
      ]);

      if (h.ok) {
        const hd = await h.json();
        const user = hd.user || hd;
        setHeadline(user?.headline || '');
        setPronouns(user?.pronouns || '');
      }

      if (d.ok) {
        const dd = await d.json();
        const serverAbout = (dd?.user?.aboutMe || '').trim();

        if (serverAbout) {
          setSummaryValue(serverAbout);
          safeSetBackup(serverAbout);
          if (typeof setAbout === 'function') setAbout(serverAbout);
        }
      }
    } catch (err) {
      console.error('Failed to reset About Me', err);
      // keep silent; user can keep editing
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
      }}
      aria-label="About Me editor"
    >
      <h3
        style={{
          margin: 0,
          color: '#FF7043',
          fontWeight: 700,
          fontSize: '1.1rem',
          marginBottom: 10,
        }}
      >
        About Me
      </h3>

      <div style={{ display: 'grid', gap: 12 }}>
        <LabeledInput
          label="Headline"
          value={headline}
          onChange={setHeadline}
          placeholder="What you do / your focus"
        />

        <LabeledInput
          label="Pronouns"
          value={pronouns}
          onChange={setPronouns}
          placeholder="she/her, he/him, they/them"
        />

        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#455A64' }}>
            Summary
          </span>
          <textarea
            value={summaryValue}
            onChange={(e) => {
              const v = e.target.value;
              setSummaryValue(v);
              safeSetBackup(v);
            }}
            placeholder="Add a short summary about yourself..."
            rows={5}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #cbd5e0',
              fontSize: '1rem',
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </label>

        {error && <small style={{ color: '#d32f2f' }}>{error}</small>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={handleCancel}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #cbd5e0',
              background: 'white',
              color: '#4a5568',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: '#FF7043',
              color: 'white',
              fontWeight: 600,
              cursor: saving ? 'default' : 'pointer',
              fontSize: '0.875rem',
              opacity: saving ? 0.8 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </section>
  );
}

function LabeledInput({ label, value, onChange, placeholder }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#455A64' }}>
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          border: '1px solid #ddd',
          borderRadius: 6,
          padding: 10,
          fontSize: 14,
          outline: 'none',
        }}
      />
    </label>
  );
}
