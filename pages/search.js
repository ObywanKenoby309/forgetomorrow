// pages/search.js
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import InternalLayout from '@/components/layouts/InternalLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

const ORANGE = '#FF7043';

const GLASS = {
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const TYPES = [
  { key: 'all', label: 'All' },
  { key: 'members', label: 'Members' },
  { key: 'companies', label: 'Companies' },
  { key: 'pages', label: 'Pages' },
  { key: 'groups', label: 'Groups' },
  { key: 'posts', label: 'Posts' },
  { key: 'newsletters', label: 'Newsletters' },
  { key: 'events', label: 'Events' },
  { key: 'faqs', label: 'FAQs' },
  { key: 'knowledgeBase', label: 'Knowledge Base' },
  { key: 'forums', label: 'Forums' },
];

function cleanSnippet(value) {
  if (!value) return '';

  let text = String(value);

  try {
    const parsed = JSON.parse(text);
    if (parsed?.body) text = parsed.body;
    else if (parsed?.content) text = parsed.content;
    else if (parsed?.text) text = parsed.text;
  } catch {}

  return text
    .replace(/"attachments"\s*:\s*\[\]/gi, '')
    .replace(/[{}[\]]/g, '')
    .replace(/"body"\s*:\s*/gi, '')
    .replace(/\\"/g, '"')
    .replace(/"\s*,?\s*$/g, '')
    .trim()
    .slice(0, 220);
}

function flattenResults(data) {
  const rows = [];

  for (const type of TYPES) {
    if (type.key === 'all') continue;
    const group = Array.isArray(data?.[type.key]) ? data[type.key] : [];

    for (const item of group) {
      rows.push({
        ...item,
        groupKey: type.key,
        groupLabel: type.label,
        snippet: cleanSnippet(item?.snippet),
      });
    }
  }

  return rows;
}

function ResultCard({ item }) {
  return (
    <a
      href={item.url || '#'}
      style={{
        ...GLASS,
        display: 'grid',
        gridTemplateColumns: '52px 1fr auto',
        gap: 14,
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        color: '#263238',
        textDecoration: 'none',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          overflow: 'hidden',
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(255,255,255,0.62)',
          fontWeight: 900,
          color: '#32465A',
        }}
      >
        {item.avatar ? (
          <img
            src={item.avatar}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          String(item.type || item.groupLabel || 'R').charAt(0).toUpperCase()
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong style={{ fontSize: 15, color: '#132238' }}>
            {item.title || 'Untitled'}
          </strong>
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              textTransform: 'uppercase',
              color: '#53677A',
              background: 'rgba(255,255,255,0.62)',
              borderRadius: 999,
              padding: '3px 8px',
            }}
          >
            {item.groupLabel}
          </span>
        </div>

        {item.subtitle ? (
          <div style={{ fontSize: 12, fontWeight: 700, color: '#4F6B86', marginTop: 4 }}>
            {item.subtitle}
          </div>
        ) : null}

        {item.snippet ? (
          <div style={{ fontSize: 13, color: '#53677A', marginTop: 6, lineHeight: 1.45 }}>
            {item.snippet}
          </div>
        ) : null}
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          color: ORANGE,
          background: 'rgba(255,255,255,0.7)',
          borderRadius: 999,
          padding: '6px 10px',
        }}
      >
        {Math.round(item.relevance || 0)}%
      </div>
    </a>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const [collapseSiderails, setCollapseSiderails] = useState(false);
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});

  useEffect(() => {
    if (!router.isReady) return;
    const q = typeof router.query.q === 'string' ? router.query.q : '';
    setQuery(q);
  }, [router.isReady, router.query.q]);

  const rows = useMemo(() => flattenResults(data), [data]);

  const counts = useMemo(() => {
    const next = { all: rows.length };
    for (const type of TYPES) {
      if (type.key === 'all') continue;
      next[type.key] = Array.isArray(data?.[type.key]) ? data[type.key].length : 0;
    }
    return next;
  }, [data, rows.length]);

  const visibleRows = useMemo(() => {
    if (activeType === 'all') return rows;
    return rows.filter((r) => r.groupKey === activeType);
  }, [rows, activeType]);

  const runSearch = async (nextQuery = query) => {
    const q = String(nextQuery || '').trim();

    if (!q) {
      setData({});
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/search/global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: q, limit: 10 }),
      });

      const json = await res.json();
      setData(json || {});

      const nextQueryParams = { ...router.query, q };
      router.replace(
        { pathname: '/search', query: nextQueryParams },
        undefined,
        { shallow: true, scroll: false }
      );
    } catch (err) {
      console.error('[search page] failed:', err);
      setData({});
    } finally {
      setLoading(false);
    }
  };

const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

  useEffect(() => {
    if (!router.isReady) return;
    const q = typeof router.query.q === 'string' ? router.query.q : '';
    if (q) runSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

if (!mounted) {
  return null;
}

  const greeting = getTimeGreeting();

  return (
    <InternalLayout
      title="Search ForgeTomorrow"
      activeNav="search"
      right={<RightRailPlacementManager />}
      rightVariant="light"
      collapseSiderails={collapseSiderails}
      onToggleSiderails={() => setCollapseSiderails((v) => !v)}
    >
      <SeekerTitleCard
        greeting={greeting}
        title="Search ForgeTomorrow"
        subtitle="Find members, companies, posts, groups, pages, newsletters, and platform resources. Career/job intelligence stays on the Jobs page."
      />

      <section
        style={{
          ...GLASS,
          borderRadius: 18,
          padding: 18,
          display: 'grid',
          gap: 16,
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 12,
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, companies, posts, groups, events..."
            style={{
              height: 46,
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.48)',
              background: 'rgba(255,255,255,0.86)',
              padding: '0 16px',
              fontWeight: 800,
              color: '#132238',
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 46,
              border: 'none',
              borderRadius: 14,
              background: ORANGE,
              color: '#fff',
              padding: '0 22px',
              fontWeight: 900,
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: '0 10px 22px rgba(255,112,67,0.28)',
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {TYPES.map((type) => {
            const active = activeType === type.key;
            const count = counts[type.key] || 0;

            return (
              <button
                key={type.key}
                type="button"
                onClick={() => setActiveType(type.key)}
                style={{
                  border: 'none',
                  borderRadius: 999,
                  padding: '8px 13px',
                  background: active ? ORANGE : 'rgba(255,255,255,0.78)',
                  color: active ? '#fff' : '#34495E',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: active
                    ? '0 10px 20px rgba(255,112,67,0.22)'
                    : '0 6px 14px rgba(0,0,0,0.08)',
                }}
              >
                {type.label} {count ? `(${count})` : ''}
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ display: 'grid', gap: 12 }}>
        {loading ? (
          <div style={{ ...GLASS, borderRadius: 16, padding: 18, color: '#425B73' }}>
            Searching ForgeTomorrow...
          </div>
        ) : visibleRows.length ? (
          visibleRows.map((item, index) => (
            <ResultCard key={`${item.groupKey}-${item.id}-${index}`} item={item} />
          ))
        ) : (
          <div style={{ ...GLASS, borderRadius: 16, padding: 22, color: '#425B73' }}>
            {query ? 'No results found yet.' : 'Enter a search to explore the platform.'}
          </div>
        )}
      </section>
    </InternalLayout>
  );
}