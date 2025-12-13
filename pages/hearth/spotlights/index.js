// pages/hearth/spotlights/index.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SpotlightFilters from '../../../components/spotlights/SpotlightFilters';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardSubtle,
} from '../../../components/ui/Card';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';

const STORAGE_KEY = 'hearthSpotlights_v1';

function makeLayout(chromeRaw) {
  let Layout = SeekerLayout;
  let activeNav = 'the-hearth';

  if (chromeRaw === 'coach') {
    Layout = CoachingLayout;
    activeNav = 'hearth';
  } else if (chromeRaw === 'recruiter-smb' || chromeRaw === 'recruiter-ent') {
    Layout = RecruiterLayout;
    activeNav = 'hearth';
  }

  return { Layout, activeNav };
}

export default function HearthSpotlightsPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();
  const { Layout, activeNav } = makeLayout(chrome);

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
    if (!filters) return ads;
    let arr = [...ads];
    const term = (filters.q || '').toLowerCase();
    if (term) {
      arr = arr.filter((a) =>
        [a.name, a.headline, a.summary].join(' ').toLowerCase().includes(term)
      );
    }
    return arr;
  }, [ads, filters]);

  const hasAnyReal = ads.length > 0;

  return (
    <Layout
      title="Hearth Spotlights | ForgeTomorrow"
      header={null}
      right={null}
      activeNav={activeNav}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px minmax(0,1fr) 260px',
          gridTemplateRows: 'auto 1fr',
          gap: 20,
          padding: '20px 0',
        }}
      >
        {/* HEADER ROW */}
        <div>
          <Link
            href={withChrome('/the-hearth')}
            style={{
              display: 'block',
              background: '#FF7043',
              color: 'white',
              fontWeight: 700,
              textAlign: 'center',
              padding: '10px',
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            ← Back to The Hearth
          </Link>
        </div>

        <Card style={{ textAlign: 'center' }}>
          <CardHeader>
            <CardTitle style={{ color: '#FF7043', fontSize: 28 }}>
              Hearth Spotlight
            </CardTitle>
            <CardSubtle>
              Find a mentor or guide who is actively offering help.
            </CardSubtle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: 16 }}>Coming soon</CardTitle>
          </CardHeader>
          <CardContent style={{ fontSize: 14, color: '#90A4AE' }}>
            This space is reserved for future Spotlights tools.
          </CardContent>
        </Card>

        {/* CONTENT ROW */}
        <div>
          <SpotlightFilters onChange={setFilters} />
        </div>

        <Card>
          {!hasAnyReal && (
            <>
              <CardHeader style={{ textAlign: 'center' }}>
                <CardTitle>No Hearth Spotlights yet</CardTitle>
                <CardSubtle>
                  This is where community mentors and helpers will appear.
                </CardSubtle>
              </CardHeader>
            </>
          )}

          {filtered.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle>{a.headline || 'Mentor'}</CardTitle>
              </CardHeader>
              {a.summary && <CardContent>{a.summary}</CardContent>}
            </Card>
          ))}
        </Card>

        <div /> {/* empty right column */}
      </div>
    </Layout>
  );
}
