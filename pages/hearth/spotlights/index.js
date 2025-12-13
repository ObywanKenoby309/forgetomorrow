import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SpotlightFilters from '../../../components/spotlights/SpotlightFilters.js';
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

function localISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const { Layout, activeNav } = makeLayout(chrome);

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

    if (filters.availability && filters.availability !== 'Any') {
      arr = arr.filter(
        (a) => (a.availability || 'Open to discuss') === filters.availability
      );
    }

    if (filters.rate?.length) {
      arr = arr.filter((a) => filters.rate.includes(a.rate || 'Free'));
    }

    if (filters.sort === 'Name A–Z') {
      arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      arr.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
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
          gridTemplateColumns: '280px minmax(0,1fr) 280px',
          gap: 20,
          padding: '20px 0',
          minHeight: '60vh',
        }}
      >
        {/* LEFT */}
        <aside>
          <Link
            href={withChrome('/the-hearth')}
            style={{
              display: 'block',
              backgroundColor: '#FF7043',
              color: 'white',
              fontWeight: 700,
              textAlign: 'center',
              padding: '10px 14px',
              borderRadius: 8,
              marginBottom: 16,
              textDecoration: 'none',
            }}
          >
            ← Back to The Hearth
          </Link>

          <SpotlightFilters onChange={setFilters} />
        </aside>

        {/* CENTER */}
        <main style={{ display: 'grid', gap: 16 }}>
          {/* Header card */}
          <Card style={{ textAlign: 'center' }}>
            <CardHeader>
              <CardTitle
                style={{
                  fontSize: 28,
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

          {/* Content card */}
          {filtered.length === 0 && !hasAnyReal && (
            <Card>
              <CardHeader style={{ textAlign: 'center' }}>
                <CardTitle>No Hearth Spotlights yet</CardTitle>
                <CardSubtle>
                  This is where community mentors and helpers will appear.
                </CardSubtle>
              </CardHeader>
              <CardContent style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#607D8B' }}>
                  As mentors join The Hearth and opt in, you’ll be able to browse and
                  connect with them here.
                </p>
              </CardContent>
            </Card>
          )}

          {filtered.length === 0 && hasAnyReal && (
            <Card>
              <CardContent>
                No spotlights match your filters. Try adjusting your search.
              </CardContent>
            </Card>
          )}

          {filtered.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <CardSubtle>{a.name}</CardSubtle>
                <CardTitle>{a.headline || 'Mentor'}</CardTitle>
              </CardHeader>
              {a.summary && (
                <CardContent>
                  <p>{a.summary}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </main>

        {/* RIGHT */}
        <aside>
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: 16 }}>Coming soon</CardTitle>
            </CardHeader>
            <CardContent style={{ fontSize: 14, color: '#90A4AE' }}>
              This space is reserved for future Spotlights tools, including posting and
              managing mentorship offers.
            </CardContent>
          </Card>
        </aside>
      </div>
    </Layout>
  );
}
