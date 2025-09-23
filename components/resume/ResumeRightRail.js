// components/resume/ResumeRightRail.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const ORANGE = '#FF7043';

// Lightweight Card used only inside this rail
function Card({ children, style }) {
  return (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        padding: 16,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

/**
 * ResumeRightRail
 * Reusable “Continue where you left off” rail with optional Tips panel.
 *
 * Props:
 * - storageKey: localStorage key to read recent items from (default 'ft_saved_resumes')
 * - title: title for the recent section (default 'Continue where you left off')
 * - onContinueHref: href for the “Continue” CTA per item (default '/resume/create')
 * - viewAllHref: href for the “View all” link under the list (default '/resume/create')
 * - limit: max items to show (default 3)
 * - tips: optional ReactNode to replace the default Tips card
 */
export default function ResumeRightRail({
  storageKey = 'ft_saved_resumes',
  title = 'Continue where you left off',
  onContinueHref = '/resume/create',
  viewAllHref = '/resume/create',
  limit = 3,
  tips,
}) {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      const list = raw ? JSON.parse(raw) : [];
      const sorted = Array.isArray(list)
        ? [...list].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
        : [];
      setRecent(sorted.slice(0, limit));
    } catch {
      setRecent([]);
    }
  }, [storageKey, limit]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>

        {recent.length ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {recent.map((r) => (
              <div
                key={r.id || r.updatedAt || Math.random()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  border: '1px solid #eee',
                  borderRadius: 10,
                  padding: '8px 10px',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={r.fullName || 'Untitled Resume'}
                  >
                    {r.fullName || 'Untitled Resume'}
                  </div>
                  <div style={{ color: '#78909C', fontSize: 12 }}>
                    Last updated{' '}
                    {new Date(r.updatedAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>

                <Link
                  href={onContinueHref}
                  style={{
                    background: ORANGE,
                    color: 'white',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 10,
                    padding: '8px 10px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Continue
                </Link>
              </div>
            ))}

            <Link
              href={viewAllHref}
              style={{ color: ORANGE, fontWeight: 700, textDecoration: 'none' }}
            >
              View all saved versions
            </Link>
          </div>
        ) : (
          <div style={{ color: '#78909C', fontSize: 14 }}>No saved resumes yet.</div>
        )}
      </Card>

      {/* Tips card (default content unless a custom `tips` node is passed) */}
      {tips ? (
        <Card>{tips}</Card>
      ) : (
        <Card>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Tips</div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              color: '#607D8B',
              fontSize: 14,
              display: 'grid',
              gap: 6,
            }}
          >
            <li>
              We recommend <strong>Reverse</strong> or <strong>Hybrid</strong> for best ATS results.
            </li>
            <li>Upload an existing resume if you’d rather improve it.</li>
          </ul>
        </Card>
      )}
    </div>
  );
}
