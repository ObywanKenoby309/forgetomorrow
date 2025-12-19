import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

/**
 * SpotlightResourceCard
 *
 * Decides whether the coach should CREATE or EDIT a Hearth Spotlight
 * based on whether one exists on the server.
 *
 * This component owns:
 * - server check
 * - label + description
 * - routing
 *
 * It does NOT own:
 * - form logic
 * - schema
 * - styling outside this card
 */
export default function SpotlightResourceCard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hasSpotlight, setHasSpotlight] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSpotlight() {
      try {
        const res = await fetch('/api/spotlight/me', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          // Endpoint may not exist yet — fail closed (assume none)
          throw new Error('Spotlight check failed');
        }

        const data = await res.json();
        if (!active) return;

        setHasSpotlight(Boolean(data?.exists));
      } catch (err) {
        console.warn('[SpotlightResourceCard] unable to verify spotlight', err);
        if (!active) return;
        setHasSpotlight(false);
        setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    checkSpotlight();
    return () => {
      active = false;
    };
  }, []);

  const handleClick = () => {
    router.push(
      hasSpotlight
        ? '/resources/mentors/spotlight/edit'
        : '/resources/mentors/spotlight/new'
    );
  };

  const title = loading
    ? 'Checking Hearth Spotlight…'
    : hasSpotlight
    ? 'Edit Your Hearth Spotlight'
    : 'Create a Hearth Spotlight';

  const description = loading
    ? 'Verifying your spotlight status.'
    : hasSpotlight
    ? 'Update or remove your existing mentor spotlight.'
    : 'Highlight your coaching or mentorship offering.';

  return (
    <div
      onClick={!loading ? handleClick : undefined}
      style={{
        display: 'block',
        background: '#F5F5F5',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 16,
        textDecoration: 'none',
        color: '#263238',
        cursor: loading ? 'default' : 'pointer',
        flex: '1 1 18%',
        minWidth: 150,
        opacity: loading ? 0.7 : 1,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ color: '#607D8B' }}>
        {description}
        {error && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#B71C1C' }}>
            Status unavailable — defaulting to create.
          </div>
        )}
      </div>
    </div>
  );
}
