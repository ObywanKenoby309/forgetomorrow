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

// footer
import InternalFooter from '@/components/InternalFooter';

// support button
import SupportFloatingButton from '@/components/SupportFloatingButton';

const STORAGE_KEY = 'hearthSpotlights_v1';

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

        <div style={{ padding: 16 }}>
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '260px minmax(0,1fr) 260px',
              gap: 24,
              alignItems: 'start',
            }}
          >
            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Link
                href={withChrome('/the-hearth')}
                style={{
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

            {/* CENTER */}
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ maxWidth: 920, margin: '0 auto' }}>
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
              </div>

              <div style={{ maxWidth: 1100, marginLeft: 0 }}>
                {!hasAnyReal && (
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

                {hasAnyReal && filtered.length === 0 && (
                  <Card>
                    <CardContent>No spotlights match your filters.</CardContent>
                  </Card>
                )}

                {filtered.map((a) => (
                  <Card key={a.id}>
                    <CardHeader>
                      <CardSubtle>{a.name}</CardSubtle>
                      <CardTitle>{a.headline || 'Mentor'}</CardTitle>
                    </CardHeader>
                    {a.summary && (
                      <CardContent>{a.summary}</CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <Card>
              <CardHeader>
                <CardTitle style={{ fontSize: 16 }}>Coming soon</CardTitle>
              </CardHeader>
              <CardContent>
                Tools for posting and managing mentorship offers.
              </CardContent>
            </Card>
          </div>
        </div>

        <InternalFooter />
        <SupportFloatingButton />
      </div>
    </>
  );
}
