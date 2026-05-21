// components/search/GlobalSearchPageTool.js
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import SearchCategoryScroller from '@/components/search/SearchCategoryScroller';

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

function getGroup(data, key) {
  if (Array.isArray(data?.groups?.[key])) return data.groups[key];
  if (Array.isArray(data?.[key])) return data[key];
  return [];
}

function normalizeResultUrl(url = '') {
  const raw = String(url || '').trim();

  if (raw.startsWith('/portfolio/')) {
    return raw.replace('/portfolio/', '/profile/');
  }

  return raw || '#';
}

function flattenResults(data) {
  const rows = [];

  for (const type of TYPES) {
    if (type.key === 'all') continue;

    for (const item of getGroup(data, type.key)) {
      rows.push({
        ...item,
        groupKey: type.key,
        groupLabel: type.label,
        snippet: cleanSnippet(item?.snippet),
        url: normalizeResultUrl(item?.url),
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
        gridTemplateColumns: '52px minmax(0, 1fr) auto',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <strong
            style={{
              fontSize: 15,
              color: '#132238',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
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
              flexShrink: 0,
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
          flexShrink: 0,
        }}
      >
        {Math.round(item.relevance || 0)}%
      </div>
    </a>
  );
}

export default function GlobalSearchPageTool() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [hasSearched, setHasSearched] = useState(false);

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
      next[type.key] = getGroup(data, type.key).length;
    }

    return next;
  }, [data, rows.length]);

  const visibleRows = useMemo(() => {
    if (activeType === 'all') return rows;
    return rows.filter((r) => r.groupKey === activeType);
  }, [rows, activeType]);

  const runSearch = useCallback(
    async (nextQuery = query) => {
      const q = String(nextQuery || '').trim();

      if (!q) {
        setData({});
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);

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
    },
    [query, router]
  );

  useEffect(() => {
    if (!router.isReady) return;
    const q = typeof router.query.q === 'string' ? router.query.q : '';
    if (q) runSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  return (
    <>
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
              minWidth: 0,
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
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        <SearchCategoryScroller
          types={TYPES}
          activeType={activeType}
          counts={counts}
          onChange={setActiveType}
        />
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
            {hasSearched || query
              ? 'No results found yet.'
              : 'Enter a search to explore the platform.'}
          </div>
        )}
      </section>
    </>
  );
}
