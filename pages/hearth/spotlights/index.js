import React, { useEffect, useMemo, useState } from 'react';
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

import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';

const STORAGE_KEY = 'hearthSpotlights_v1';

function makeLayout(chromeRaw) {
  let Layout = SeekerLayout;

  if (chromeRaw === 'coach') {
    Layout = CoachingLayout;
  } else if (chromeRaw === 'recruiter-smb' || chromeRaw === 'recruiter-ent') {
    Layout = RecruiterLayout;
  }

  return Layout;
}

export default function HearthSpotlightsPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();
  const Layout = makeLayout(chrome);

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

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
    <Layout
      title="Hearth Spotlight | ForgeTomorrow"
      header={null}
      right={null}
      activeNav={null}
    >
      {/* ===== Custom Hearth Layout (breaks default sidebar dominance) ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px minmax(0,1fr) 280px',
          gridTemplateRows: 'auto auto 1fr',
          gap: 20,
          padding: '20px 0',
          alignItems: 'start',
        }}
      >
        {/* ===== HEADER ROW ===== */}

        {/* Back button */}
        <div>
          <Link
            href={withChrome('/the-hearth')}
            style={{
              display: 'block',
              background: '#FF7043',
              color: 'white',
              fontWeight: 700,
              textAlign: 'center',
              padding: '10px 14px',
              borderRadius: 10,
              textDecoration: 'none',
            }}
          >
            ← Back to The Hearth
          </Link>
        </div>

        {/* Title card */}
        <Card style={{ textAlign: 'center' }}>
          <CardHeader>
            <CardTitle
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: '#FF7043',
                marginBottom: 4,
              }}
            >
              Hearth Spotlight
            </CardTitle>
            <CardSubtle>
              Find a mentor or guide who is actively offering help.
            </CardSubtle>
          </CardHeader>
        </Card>

        {/* Coming soon */}
        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: 16 }}>Coming soon</CardTitle>
          </CardHeader>
          <CardContent style={{ fontSize: 14, color: '#90A4AE' }}>
            This space is reserved for future Spotlights tools, such as posting and
            managing your own mentorship offers.
          </CardContent>
        </Card>

        {/* ===== CONTENT ROW ===== */}

        {/* Filters */}
        <div>
          <SpotlightFilters onChange={setFilters} />
        </div>

        {/* Spotlight list / empty state */}
        <Card>
          {!hasAnyReal && (
            <>
              <CardHeader style={{ textAlign: 'center' }}>
                <CardTitle>No Hearth Spotlights yet</CardTitle>
                <CardSubtle>
                  This is where community mentors and helpers will appear.
                </CardSubtle>
              </CardHeader>
              <CardContent style={{ textAlign: 'center', color: '#607D8B' }}>
                As mentors join The Hearth and opt in, you’ll be able to browse and
                connect with them here.
              </CardContent>
            </>
          )}

          {hasAnyReal && filtered.length === 0 && (
            <CardContent style={{ color: '#90A4AE' }}>
              No spotlights match your filters.
            </CardContent>
          )}

          {filtered.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <CardSubtle>{a.name}</CardSubtle>
                <CardTitle>{a.headline || 'Mentor'}</CardTitle>
              </CardHeader>
              {a.summary && (
                <CardContent style={{ color: '#455A64' }}>
                  {a.summary}
                </CardContent>
              )}
            </Card>
          ))}
        </Card>

        {/* Right column spacer */}
        <div />
      </div>
    </Layout>
  );
}
