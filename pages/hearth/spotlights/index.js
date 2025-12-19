// pages/hearth/spotlights/index.js
import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import InternalLayout from '@/components/layouts/InternalLayout';
import SpotlightFilters from '@/components/spotlights/SpotlightFilters';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardSubtle,
} from '@/components/ui/Card';

// support
import SupportFloatingButton from '@/components/SupportFloatingButton';

// ──────────────────────────────────────────────────────────────
// Header card (Jobs-style)
// ──────────────────────────────────────────────────────────────
function PageHeader() {
  return (
    <header
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: '20px 24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}
    >
      <h1 style={{ color: '#FF7043', fontSize: 28, fontWeight: 800, margin: 0 }}>
        Hearth Spotlight
      </h1>
      <p style={{ margin: '8px 0 0', color: '#546E7A', fontSize: 14 }}>
        Find a mentor or guide who is actively offering help.
      </p>
    </header>
  );
}

export default function HearthSpotlightsPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // DB-backed state
  const [ads, setAds] = useState([]);
  const [filters, setFilters] = useState(null);
  const [selectedSpotlight, setSelectedSpotlight] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch('/api/hearth/spotlights', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.status === 401) {
          router.push('/login');
          return;
        }

        if (!res.ok) throw new Error('Failed to load spotlights');

        const data = await res.json();
        const list =
          (Array.isArray(data?.spotlights) && data.spotlights) ||
          (Array.isArray(data?.items) && data.items) ||
          (Array.isArray(data) && data) ||
          [];

        if (!mounted) return;

        const normalized = list.map((a) => ({
          id: a.id,
          name: a.name || '',
          headline: a.headline || '',
          summary: a.summary || '',
          specialties: Array.isArray(a.specialties) ? a.specialties : [],
          rate: a.rate || '',
          availability: a.availability || '',
          contactEmail: a.contactEmail || '',
          contactLink: a.contactLink || '',
          createdAt: a.createdAt || null,
        }));

        setAds(normalized);
        if (normalized.length > 0) setSelectedSpotlight(normalized[0]);
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setAds([]);
        setError(
          'Spotlights are unavailable right now. This page is DB-only, so the /api/hearth/spotlights GET route must be wired.'
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [router]);

  const filtered = useMemo(() => {
    let arr = [...ads];
    if (!filters) return arr;

    const term = (filters.q || '').trim().toLowerCase();
    if (term) {
      arr = arr.filter((a) =>
        [a.name, a.headline, a.summary, (a.specialties || []).join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(term)
      );
    }

    if (filters.specialties?.length) {
      arr = arr.filter((a) =>
        (a.specialties || []).some((s) => filters.specialties.includes(s))
      );
    }

    if (filters.availability && filters.availability !== 'Any') {
      arr = arr.filter((a) => (a.availability || '') === filters.availability);
    }

    if (filters.rate?.length) {
      arr = arr.filter((a) => filters.rate.includes(a.rate));
    }

    if (filters.sort === 'Name A–Z') {
      arr.sort((x, y) => (x.name || '').localeCompare(y.name || ''));
    } else if (filters.sort === 'Newest') {
      arr.sort((x, y) => {
        const ax = x.createdAt ? new Date(x.createdAt).getTime() : 0;
        const by = y.createdAt ? new Date(y.createdAt).getTime() : 0;
        return by - ax;
      });
    }

    return arr;
  }, [ads, filters]);

  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 14 }}>Sponsored</CardTitle>
        </CardHeader>
        <CardContent style={{ fontSize: 13, color: '#546E7A' }}>
          Mentor promotions, featured coaches, and community tools will appear here.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 14 }}>Become a Mentor</CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            href={withChrome('/resources/mentors/spotlight/new')}
            style={{ color: '#FF7043', fontWeight: 700, textDecoration: 'none' }}
          >
            Post a Hearth Spotlight
          </Link>
        </CardContent>
      </Card>
    </div>
  );

  const hasAnyReal = ads.length > 0;

  return (
    <InternalLayout
      title="Hearth Spotlight | ForgeTomorrow"
      activeNav="hearth"
      right={RightRail}
      header={<PageHeader />}
    >
      <Head>
        <title>Hearth Spotlight | ForgeTomorrow</title>
      </Head>

      {/* ✅ Jobs-style spacing block: restores middle width + adds breathing */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20, // ✅ matches Jobs rhythm
          maxWidth: 1200, // ✅ matches Jobs inner width (prevents shrink)
        }}
      >
        {/* FILTER BAR */}
        <SpotlightFilters onChange={setFilters} />

        {/* Error banner */}
        {error && (
          <Card>
            <CardContent style={{ color: '#6D4C41' }}>{error}</CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <Card>
            <CardContent style={{ color: '#90A4AE' }}>Loading spotlights…</CardContent>
          </Card>
        )}

        {/* Empty */}
        {!loading && !error && !hasAnyReal && (
          <Card>
            <CardHeader style={{ textAlign: 'center' }}>
              <CardTitle>No Hearth Spotlights yet</CardTitle>
              <CardSubtle>
                This is where community mentors and helpers will appear.
              </CardSubtle>
            </CardHeader>
            <CardContent style={{ textAlign: 'center' }}>
              As mentors join The Hearth and opt in, you’ll be able to browse and connect
              with them here.
            </CardContent>
          </Card>
        )}

        {!loading && !error && hasAnyReal && filtered.length === 0 && (
          <Card>
            <CardContent>No spotlights match your filters.</CardContent>
          </Card>
        )}

        {/* LIST + DETAIL (Jobs-style two column inside content area) */}
        {!loading && !error && filtered.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.5fr)', // ✅ match Jobs proportions
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            {/* LEFT: list */}
            <section
              aria-label="Spotlight results"
              style={{
                maxHeight: '78vh',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  paddingRight: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {filtered.map((a) => {
                  const isSelected = selectedSpotlight && selectedSpotlight.id === a.id;

                  return (
                    <Card
                      key={a.id}
                      onClick={() => setSelectedSpotlight(a)}
                      style={{
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #FF7043' : '1px solid #E0E0E0',
                      }}
                    >
                      <CardHeader>
                        <CardSubtle>{a.name}</CardSubtle>
                        <CardTitle>{a.headline || 'Mentor'}</CardTitle>
                      </CardHeader>
                      {a.summary && (
                        <CardContent>
                          {a.summary.length > 120 ? `${a.summary.slice(0, 120)}…` : a.summary}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* RIGHT: sticky detail */}
            <section aria-label="Selected spotlight details">
              <Card
                style={{
                  position: 'sticky',
                  top: 0,
                  maxHeight: '78vh',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {selectedSpotlight ? (
                  <>
                    <CardHeader>
                      <CardTitle>{selectedSpotlight.headline || 'Mentor'}</CardTitle>
                      <CardSubtle>{selectedSpotlight.name}</CardSubtle>
                    </CardHeader>

                    <CardContent style={{ display: 'grid', gap: 12 }}>
                      {selectedSpotlight.summary && (
                        <p style={{ margin: 0 }}>{selectedSpotlight.summary}</p>
                      )}

                      {selectedSpotlight.specialties?.length > 0 && (
                        <div>
                          <strong>Specialties</strong>
                          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                            {selectedSpotlight.specialties.map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedSpotlight.rate && (
                        <div>
                          <strong>Rate:</strong> {selectedSpotlight.rate}
                        </div>
                      )}

                      {selectedSpotlight.availability && (
                        <div>
                          <strong>Availability:</strong> {selectedSpotlight.availability}
                        </div>
                      )}

                      {(selectedSpotlight.contactEmail || selectedSpotlight.contactLink) && (
                        <div style={{ display: 'grid', gap: 6 }}>
                          <strong>Contact</strong>
                          {selectedSpotlight.contactEmail && (
                            <div style={{ fontSize: 13, color: '#455A64' }}>
                              {selectedSpotlight.contactEmail}
                            </div>
                          )}
                          {selectedSpotlight.contactLink && (
                            <Link
                              href={selectedSpotlight.contactLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                width: 'fit-content',
                                padding: '8px 10px',
                                borderRadius: 10,
                                border: '1px solid #FF7043',
                                color: '#FF7043',
                                fontWeight: 700,
                                textDecoration: 'none',
                                background: 'white',
                              }}
                            >
                              Open contact link
                            </Link>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </>
                ) : (
                  <CardContent>Select a mentor to view details.</CardContent>
                )}
              </Card>
            </section>
          </div>
        )}
      </div>

      <SupportFloatingButton />
    </InternalLayout>
  );
}
