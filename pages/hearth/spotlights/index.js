// pages/hearth/spotlights/index.js
import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import SpotlightFilters from '@/components/spotlights/SpotlightFilters';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardSubtle,
} from '@/components/ui/Card';

import { useUserWallpaper } from '@/hooks/useUserWallpaper';

// headers
import SeekerHeader from '@/components/seeker/SeekerHeader';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';

// support
import SupportFloatingButton from '@/components/SupportFloatingButton';

export default function HearthSpotlightsPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const Header =
    chrome === 'coach'
      ? CoachingHeader
      : chrome === 'recruiter-smb' || chrome === 'recruiter-ent'
      ? RecruiterHeader
      : SeekerHeader;

  const { wallpaperUrl } = useUserWallpaper();

  const backgroundStyle = wallpaperUrl
    ? {
        minHeight: '100vh',
        backgroundImage: `url(${wallpaperUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }
    : {
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      };

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
        const res = await fetch('/api/hearth/spotlights');
        if (!res.ok) throw new Error('Failed to load spotlights');

        const data = await res.json();
        const list =
          data?.spotlights ||
          data?.items ||
          (Array.isArray(data) ? data : []);

        if (!mounted) return;

        const normalized = list.map((a) => ({
          id: a.id,
          name: a.name || '',
          headline: a.headline || '',
          summary: a.summary || '',
          specialties: Array.isArray(a.specialties) ? a.specialties : [],
          rate: a.rate || '',
          availability: a.availability || '',
        }));

        setAds(normalized);
        if (normalized.length > 0) {
          setSelectedSpotlight(normalized[0]);
        }
      } catch (e) {
        console.error(e);
        if (mounted) setError('Unable to load Hearth Spotlights.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let arr = [...ads];
    if (!filters) return arr;

    const term = (filters.q || '').trim().toLowerCase();
    if (term) {
      arr = arr.filter((a) =>
        [a.name, a.headline, a.summary, a.specialties.join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(term)
      );
    }

    if (filters.specialties?.length) {
      arr = arr.filter((a) =>
        a.specialties.some((s) => filters.specialties.includes(s))
      );
    }

    return arr;
  }, [ads, filters]);

  return (
    <>
      <Head>
        <title>Hearth Spotlight | ForgeTomorrow</title>
      </Head>

      <div style={backgroundStyle}>
        <Header />

        <div style={{ padding: 16 }}>
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '220px minmax(0,1fr)',
              gap: 24,
            }}
          >
            {/* LEFT SIDEBAR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Link
                href={withChrome('/the-hearth')}
                style={{
                  background: '#FF7043',
                  color: 'white',
                  fontWeight: 700,
                  textAlign: 'center',
                  padding: 14,
                  borderRadius: 10,
                  textDecoration: 'none',
                }}
              >
                ← Back to The Hearth
              </Link>
            </div>

            {/* MAIN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* TITLE */}
              <Card style={{ textAlign: 'center' }}>
                <CardHeader>
                  <CardTitle
                    style={{ fontSize: 28, fontWeight: 800, color: '#FF7043' }}
                  >
                    Hearth Spotlight
                  </CardTitle>
                  <CardSubtle>
                    Find a mentor or guide who is actively offering help.
                  </CardSubtle>
                </CardHeader>
              </Card>

              {/* FILTERS */}
              <SpotlightFilters onChange={setFilters} />

              {/* ERROR / LOADING */}
              {error && (
                <Card>
                  <CardContent>{error}</CardContent>
                </Card>
              )}

              {loading && (
                <Card>
                  <CardContent>Loading spotlights…</CardContent>
                </Card>
              )}

              {!loading && !error && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1.8fr)',
                    gap: 16,
                    alignItems: 'flex-start',
                  }}
                >
                  {/* LEFT LIST */}
                  <div
                    style={{
                      maxHeight: '75vh',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {filtered.map((a) => {
                      const isSelected =
                        selectedSpotlight && selectedSpotlight.id === a.id;

                      return (
                        <Card
                          key={a.id}
                          onClick={() => setSelectedSpotlight(a)}
                          style={{
                            cursor: 'pointer',
                            border: isSelected
                              ? '2px solid #FF7043'
                              : '1px solid #E0E0E0',
                          }}
                        >
                          <CardHeader>
                            <CardSubtle>{a.name}</CardSubtle>
                            <CardTitle>{a.headline || 'Mentor'}</CardTitle>
                          </CardHeader>
                          {a.summary && (
                            <CardContent>
                              {a.summary.length > 120
                                ? `${a.summary.slice(0, 120)}…`
                                : a.summary}
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>

                  {/* RIGHT DETAIL */}
                  <div>
                    <Card
                      style={{
                        position: 'sticky',
                        top: 0,
                      }}
                    >
                      {selectedSpotlight ? (
                        <>
                          <CardHeader>
                            <CardTitle>{selectedSpotlight.headline}</CardTitle>
                            <CardSubtle>{selectedSpotlight.name}</CardSubtle>
                          </CardHeader>
                          <CardContent style={{ display: 'grid', gap: 12 }}>
                            {selectedSpotlight.summary && (
                              <p>{selectedSpotlight.summary}</p>
                            )}

                            {selectedSpotlight.specialties.length > 0 && (
                              <div>
                                <strong>Specialties</strong>
                                <ul>
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
                                <strong>Availability:</strong>{' '}
                                {selectedSpotlight.availability}
                              </div>
                            )}
                          </CardContent>
                        </>
                      ) : (
                        <CardContent>
                          Select a mentor to view details.
                        </CardContent>
                      )}
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <SupportFloatingButton />
      </div>
    </>
  );
}
