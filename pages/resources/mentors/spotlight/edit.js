import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CoachingLayout from '@/components/layouts/CoachingLayout';

/**
 * Hearth Spotlight Editor
 *
 * This page is explicitly an EDITOR:
 * - Update existing spotlight
 * - Delete spotlight
 *
 * It assumes exactly ONE spotlight per coach.
 */
export default function EditHearthSpotlightPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    headline: '',
    summary: '',
    specialties: [],
    rate: 'Free',
    availability: 'Open to discuss',
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ---- Load existing spotlight ----
  useEffect(() => {
    let active = true;

    async function loadSpotlight() {
      try {
        const res = await fetch('/api/spotlight/me', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) throw new Error('Failed to load spotlight');

        const data = await res.json();
        if (!active) return;

        if (!data?.spotlight) {
          // No spotlight exists — redirect to NEW
          router.replace('/resources/mentors/spotlight/new');
          return;
        }

        setForm({
          name: data.spotlight.name || '',
          headline: data.spotlight.headline || '',
          summary: data.spotlight.summary || '',
          specialties: data.spotlight.specialties || [],
          rate: data.spotlight.rate || 'Free',
          availability: data.spotlight.availability || 'Open to discuss',
        });
      } catch (err) {
        console.error(err);
        if (!active) return;
        setError('Unable to load your spotlight.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSpotlight();
    return () => {
      active = false;
    };
  }, [router]);

  // ---- Update spotlight ----
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/spotlight/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Update failed');

      router.push('/hearth/spotlights');
    } catch (err) {
      console.error(err);
      setError('Failed to update spotlight.');
    } finally {
      setSaving(false);
    }
  };

  // ---- Delete spotlight ----
  const destroy = async () => {
    const ok = confirm(
      'Are you sure you want to delete your Hearth Spotlight?\n\nThis cannot be undone.'
    );
    if (!ok) return;

    try {
      const res = await fetch('/api/spotlight/me', {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');

      router.push('/dashboard/coaching/resources');
    } catch (err) {
      console.error(err);
      alert('Unable to delete spotlight.');
    }
  };

  return (
    <CoachingLayout
      title="Edit Hearth Spotlight | ForgeTomorrow"
      activeNav="resources"
      headerTitle="Edit Hearth Spotlight"
      headerDescription="You are editing a live spotlight visible to the community."
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      <section
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(10px)',
          borderRadius: 12,
          padding: 20,
          border: '1px solid #eee',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          maxWidth: 900,
        }}
      >
        {loading ? (
          <div style={{ color: '#607D8B' }}>Loading spotlight…</div>
        ) : (
          <form onSubmit={save} style={{ display: 'grid', gap: 14 }}>
            {error && (
              <div
                style={{
                  background: '#FDECEA',
                  border: '1px solid #FFCDD2',
                  borderRadius: 8,
                  padding: 10,
                  color: '#C62828',
                }}
              >
                {error}
              </div>
            )}

            <Field label="Your name">
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                style={input}
              />
            </Field>

            <Field label="Headline">
              <input
                value={form.headline}
                onChange={(e) => update('headline', e.target.value)}
                required
                style={input}
              />
            </Field>

            <Field label="Summary">
              <textarea
                rows={5}
                value={form.summary}
                onChange={(e) => update('summary', e.target.value)}
                required
                style={{ ...input, resize: 'vertical' }}
              />
            </Field>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                disabled={saving}
                style={btnPrimary}
              >
                {saving ? 'Saving…' : 'Update Spotlight'}
              </button>

              <button
                type="button"
                onClick={destroy}
                style={btnDanger}
              >
                Delete Spotlight
              </button>
            </div>
          </form>
        )}
      </section>
    </CoachingLayout>
  );
}

/* ---------- helpers ---------- */

function Field({ label, children }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 700,
          color: '#607D8B',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const input = {
  width: '100%',
  border: '1px solid #ddd',
  borderRadius: 10,
  padding: '10px 12px',
  background: 'white',
};

const btnPrimary = {
  background: '#FF7043',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  padding: '10px 14px',
  fontWeight: 700,
  cursor: 'pointer',
};

const btnDanger = {
  background: 'white',
  color: '#C62828',
  border: '1px solid #C62828',
  borderRadius: 10,
  padding: '10px 14px',
  fontWeight: 700,
  cursor: 'pointer',
};
