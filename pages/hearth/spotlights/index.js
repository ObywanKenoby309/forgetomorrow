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

  // DB source of truth (no localStorage)
  const [ads, setAds] = useState([]);
  const [filters, setFilters] = useState(null);

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

        if (!res.ok) {
          throw new Error('Failed to load spotlights');
        }

        const data = await res.json();
        const list =
          (Array.isArray(data?.spotlights) && data.spotlights) ||
          (Array.isArray(data?.items) && data.items) ||
          (Array.isArray(data) && data) ||
          [];

        if (!mounted) return;

        // Normalize minimal shape expected by UI
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

    return arr;
  }, [ads, filters]);

  const hasAnyReal = ads.length > 0;

  return (
    <>
      <Head>
        <title>Hearth Spotlight | ForgeTomorrow</title>
      </Head>

      <div style={backgroundStyle}>
        <Header />

        {/* ===== PAGE CONTAINER ===== */}
        <div style={{ padding: 16 }}>
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '220px minmax(0,1fr) 300px',
              gap: 24,
              alignItems: 'start',
            }}
          >
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Link
                href={withChrome('/the-hearth')}
                style={{
                  width: '100%',
                  background: '#FF7043',
                  color: 'white',
                  fontWeight: 700,
                  textAlign: 'center',
                  padding: '14px',
                  borderRadius: 10,
                  textDecoration: 'none',
                }}
              >
                ← Back to The Hearth
              </Link>

              <SpotlightFilters onChange={setFilters} />
            </div>

            {/* CENTER COLUMN */}
            <div style={{ display: 'grid', gap: 16 }}>
              {/* TITLE CARD – SAME WIDTH AS CONTENT */}
              <Card style={{ textAlign: 'center' }}>
                <CardHeader>
                  <CardTitle
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: '#FF7043',
                    }}
                  >
                    Hearth Spotlight
                  </CardTitle>
                  <CardSubtle>
                    Find a mentor or guide who is actively offering help.
                  </CardSubtle>
                </CardHeader>
              </Card>

              {/* Error banner */}
              {error && (
                <Card>
                  <CardContent style={{ color: '#6D4C41' }}>{error}</CardContent>
                </Card>
              )}

              {/* Loading */}
              {loading && (
                <Card>
                  <CardContent style={{ color: '#90A4AE' }}>
                    Loading spotlights…
                  </CardContent>
                </Card>
              )}

              {/* CONTENT */}
              {!loading && !error && !hasAnyReal && (
                <Card>
                  <CardHeader style={{ textAlign: 'center' }}>
                    <CardTitle>No Hearth Spotlights yet</CardTitle>
                    <CardSubtle>
                      This is where community mentors and helpers will appear.
                    </CardSubtle>
                  </CardHeader>
                  <CardContent style={{ textAlign: 'center' }}>
                    As mentors join The Hearth and opt in, you’ll be able to browse and
                    connect with them here.
                  </CardContent>
                </Card>
              )}

              {!loading && !error && hasAnyReal && filtered.length === 0 && (
                <Card>
                  <CardContent>No spotlights match your filters.</CardContent>
                </Card>
              )}

              {!loading &&
                !error &&
                filtered.map((a) => (
                  <Card key={a.id}>
                    <CardHeader>
                      <CardSubtle>{a.name}</CardSubtle>
                      <CardTitle>{a.headline || 'Mentor'}</CardTitle>
                    </CardHeader>
                    {a.summary && <CardContent>{a.summary}</CardContent>}
                  </Card>
                ))}
            </div>

            {/* RIGHT COLUMN */}
            <Card>
              <CardHeader>
                <CardTitle style={{ fontSize: 16 }}>Coming soon</CardTitle>
              </CardHeader>
              <CardContent>
                Tools for posting and managing mentorship offers.
                <div style={{ marginTop: 10 }}>
                  <Link
                    href={withChrome('/resources/mentors/spotlight/new')}
                    style={{ color: '#FF7043', fontWeight: 700, textDecoration: 'none' }}
                  >
                    Post a Spotlight
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SUPPORT FLOATING BUTTON — RESTORED */}
        <SupportFloatingButton />
      </div>
    </>
  );
}
