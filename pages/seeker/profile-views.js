// pages/seeker/profile-views.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import ContactCenterToolbar from '@/components/contact-center/ContactCenterToolbar'; // ✅ NEW import

function HeaderBox() {
  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          margin: 0,
          color: '#FF7043',
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        Profile Views
      </h1>
      <p
        style={{
          margin: '6px auto 0',
          color: '#607D8B',
          maxWidth: 720,
        }}
      >
        See who has viewed your profile and when. No gatekeeping, no upgrades —
        just transparency.
      </p>
    </section>
  );
}

export default function ProfileViewsPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadViews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile/views?limit=50');
      if (!res.ok) {
        console.error('profile/views full failed', await res.text());
        setViews([]);
        return;
      }
      const data = await res.json();
      setViews(data.views || []);
    } catch (err) {
      console.error('profile/views full error', err);
      setViews([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadViews();
  }, []);
  const formatDateTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return '';
    }
  };
  const handleOpenViewerProfile = (view) => {
    if (!view.viewer?.id) return;
    const params = new URLSearchParams();
    params.set('userId', view.viewer.id);
    router.push(withChrome(`/member-profile?${params.toString()}`));
  };
  return (
    <SeekerLayout
      title="Profile Views | ForgeTomorrow"
      header={<HeaderBox />}
      right={<RightRailPlacementManager surfaceId="profile_views" />}
      activeNav="contacts"
    >
      {/* ✅ Toolbar component added */}
      <ContactCenterToolbar currentTab="profileViews" />

      <section
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #eee',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <h2 style={{ margin: 0, color: '#FF7043' }}>Who&apos;s looking at you</h2>
          <Link
            href={withChrome('/seeker/contact-center')}
            style={{ color: '#FF7043', fontWeight: 700, fontSize: 13 }}
          >
            ← Back to Contact Center
          </Link>
        </div>
        {loading ? (
          <p style={{ color: '#607D8B', fontSize: 14 }}>Loading profile views…</p>
        ) : views.length === 0 ? (
          <p style={{ color: '#607D8B', fontSize: 14 }}>
            No profile views yet. Once recruiters, coaches, or peers visit your profile,
            you&apos;ll see them listed here.
          </p>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gap: 8,
            }}
          >
            {views.map((v) => (
              <li
                key={v.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: '#F9FAFB',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontWeight: 600,
                      color: v.viewer?.name ? '#111827' : '#6B7280',
                      fontSize: 14,
                    }}
                  >
                    {v.viewer?.name || 'Anonymous ForgeTomorrow member'}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: '#6B7280',
                    }}
                  >
                    Viewed your profile • {formatDateTime(v.createdAt)}
                  </span>
                </div>
                {v.viewer?.id && (
                  <button
                    type="button"
                    onClick={() => handleOpenViewerProfile(v)}
                    style={{
                      fontSize: 12,
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      cursor: 'pointer',
                      color: '#374151',
                      fontWeight: 600,
                    }}
                  >
                    View profile
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </SeekerLayout>
  );
}
