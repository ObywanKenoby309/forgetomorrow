// pages/hearth/spotlights/index.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SpotlightFilters from '../../../components/spotlights/SpotlightFilters.js';
import { Card, CardHeader, CardTitle, CardContent, CardSubtle } from '../../../components/ui/Card';

const STORAGE_KEY = 'hearthSpotlights_v1';

function localISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Sample cards to show when no real data exists
const SAMPLE_SPOTLIGHTS = [
  {
    id: 'sample-1',
    name: 'Jordan M.',
    headline: 'Senior Product Manager • PM Coaching',
    specialties: ['Product Strategy', 'Roadmapping', 'Interview Prep'],
    summary:
      'Happy to help you prep for PM interviews, sharpen your product sense, or review your case approach.',
    availability: 'Evenings (ET)',
    rate: 'Free',
    contactEmail: 'mentor+jordan@example.com',
    contactLink: 'https://example.com/jordan',
    createdAt: localISODate(),
  },
  {
    id: 'sample-2',
    name: 'Riley S.',
    headline: 'Staff Engineer • Technical Mentorship',
    specialties: ['System Design', 'Code Reviews', 'Career Growth'],
    summary:
      'Offering mock system design sessions and feedback on career planning for ICs targeting Senior+.',
    availability: 'Weekends',
    rate: 'Sliding scale',
    contactEmail: 'mentor+riley@example.com',
    contactLink: 'https://example.com/riley',
    createdAt: localISODate(),
  },
];

export default function HearthSpotlightsPage() {
  const [ads, setAds] = useState([]);
  const [filters, setFilters] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setAds(Array.isArray(saved) ? saved : []);
    } catch {
      setAds([]);
    }
  }, []);

  const filtered = useMemo(() => {
    let arr = [...ads];
    if (!filters) return arr;

    // Search across name, headline, summary, specialties
    const term = (filters.q || '').trim().toLowerCase();
    if (term) {
      arr = arr.filter((a) =>
        [a.name, a.headline, a.summary, (a.specialties || []).join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(term)
      );
    }

    // Specialties (OR logic)
    if (filters.specialties?.length) {
      arr = arr.filter((a) => (a.specialties || []).some((s) => filters.specialties.includes(s)));
    }

    // Availability
    if (filters.availability && filters.availability !== 'Any') {
      arr = arr.filter((a) => (a.availability || 'Open to discuss') === filters.availability);
    }

    // Rate
    if (filters.rate?.length) {
      arr = arr.filter((a) => filters.rate.includes(a.rate || 'Free'));
    }

    // Sort
    if (filters.sort === 'Name A–Z') {
      arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      // Newest first
      arr.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }

    return arr;
  }, [ads, filters]);

  // If no real data, we’ll show sample cards in the UI (but do not mix them into storage).
  const showSamples = filtered.length === 0 && ads.length === 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr 280px',
        gridTemplateRows: 'auto 1fr',
        gridTemplateAreas: `
          "filters header right"
          "filters content right"
        `,
        gap: 20,
        padding: '120px 20px 20px',
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      }}
    >
      {/* Left: Back + Filters (spans both rows) */}
      <aside style={{ gridArea: 'filters', alignSelf: 'start' }}>
        <Link
          href="/the-hearth"
          style={{
            display: 'block',
            backgroundColor: '#FF7043',
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            textDecoration: 'none',
          }}
        >
          ← Back to The Hearth
        </Link>

        <SpotlightFilters onChange={setFilters} />
      </aside>

      {/* Top middle: compact centered header (kept tight) */}
      <section
        style={{
          gridArea: 'header',
          background: 'white',
          borderRadius: 12,
          padding: '8px 16px',
          border: '1px solid #eee',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            color: '#FF7043',
            margin: 0,
            fontWeight: 700,
          }}
        >
          Hearth Spotlights
        </h1>
        <p
          style={{
            fontSize: '1rem',
            color: '#607D8B',
            margin: '4px 0 0 0',
          }}
        >
          Find a mentor offering help right now.
        </p>
      </section>

      {/* Middle content: center container w/ maxWidth to prevent “pull left” */}
      <main style={{ gridArea: 'content' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gap: 12 }}>
          {/* Results list (stacked, one per row) */}
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 12,
            }}
          >
            {/* Empty state */}
            {filtered.length === 0 && !showSamples && (
              <Card style={{ color: '#90A4AE' }}>
                No spotlights match your filters. Try clearing some options.
              </Card>
            )}

            {/* Real spotlights */}
            {filtered.map((a) => (
              <Card key={a.id}>
                <CardHeader style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <CardSubtle>{a.name}</CardSubtle>
                    <CardTitle style={{ marginTop: 2 }}>{a.headline || 'Mentor'}</CardTitle>
                  </div>
                  <span style={{ fontSize: 12, color: '#90A4AE', alignSelf: 'start' }}>
                    Posted {a.createdAt ? a.createdAt.slice(0, 10) : localISODate()}
                  </span>
                </CardHeader>

                {a.specialties?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    {a.specialties.map((s, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 12,
                          background: '#FFF3E0',
                          color: '#E65100',
                          padding: '2px 6px',
                          borderRadius: 999,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {a.summary && (
                  <CardContent>
                    <p style={{ margin: 0, color: '#455A64' }}>{a.summary}</p>
                  </CardContent>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                  {a.contactEmail && (
                    <Link
                      href={`mailto:${a.contactEmail}?subject=Hearth Spotlight: ${encodeURIComponent(
                        a.headline || a.name || 'Mentor'
                      )}`}
                      style={{
                        background: '#FF7043',
                        color: 'white',
                        borderRadius: 10,
                        padding: '10px 12px',
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      Email
                    </Link>
                  )}
                  {a.contactLink && (
                    <Link
                      href={a.contactLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'white',
                        color: '#FF7043',
                        border: '1px solid #FF7043',
                        borderRadius: 10,
                        padding: '10px 12px',
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      Learn More
                    </Link>
                  )}
                  {a.availability && (
                    <span style={{ alignSelf: 'center', fontSize: 12, color: '#607D8B' }}>
                      Availability: {a.availability}
                    </span>
                  )}
                  {a.rate && (
                    <span style={{ alignSelf: 'center', fontSize: 12, color: '#607D8B' }}>
                      Rate: {a.rate}
                    </span>
                  )}
                </div>
              </Card>
            ))}

            {/* Sample spotlights (only when there’s no real data at all) */}
            {showSamples &&
              SAMPLE_SPOTLIGHTS.map((a) => (
                <Card key={a.id}>
                  <CardHeader style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <CardSubtle>
                        {a.name} • <em style={{ color: '#90A4AE' }}>Sample</em>
                      </CardSubtle>
                      <CardTitle style={{ marginTop: 2 }}>{a.headline}</CardTitle>
                    </div>
                    <span style={{ fontSize: 12, color: '#90A4AE', alignSelf: 'start' }}>
                      Posted {a.createdAt}
                    </span>
                  </CardHeader>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    {a.specialties.map((s, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 12,
                          background: '#FFF3E0',
                          color: '#E65100',
                          padding: '2px 6px',
                          borderRadius: 999,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <CardContent>
                    <p style={{ margin: 0, color: '#455A64' }}>{a.summary}</p>
                  </CardContent>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    <Link
                      href={`mailto:${a.contactEmail}?subject=Hearth Spotlight: ${encodeURIComponent(a.headline)}`}
                      style={{
                        background: '#FF7043',
                        color: 'white',
                        borderRadius: 10,
                        padding: '10px 12px',
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      Email
                    </Link>
                    <Link
                      href={a.contactLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'white',
                        color: '#FF7043',
                        border: '1px solid #FF7043',
                        borderRadius: 10,
                        padding: '10px 12px',
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      Learn More
                    </Link>
                    <span style={{ alignSelf: 'center', fontSize: 12, color: '#607D8B' }}>
                      Availability: {a.availability}
                    </span>
                    <span style={{ alignSelf: 'center', fontSize: 12, color: '#607D8B' }}>
                      Rate: {a.rate}
                    </span>
                  </div>
                </Card>
              ))}
          </section>
        </div>
      </main>

      {/* Right: reserved rail */}
      <aside
        style={{
          gridArea: 'right',
          alignSelf: 'start',
          background: 'white',
          border: '1px solid #eee',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          minHeight: 120,
        }}
      >
        <div style={{ fontWeight: 700, color: '#263238', marginBottom: 6 }}>Coming soon</div>
        <div style={{ color: '#90A4AE', fontSize: 14 }}>
          This space is reserved for future Spotlights features.
        </div>
      </aside>
    </div>
  );
}
