// pages/search.js
// ForgeTomorrow Full Platform Search Page
// Deep platform discovery page. This is separate from job/career intelligence search.

import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

const ORANGE = '#FF7043';

const SECTION_LABELS = {
  all: 'All',
  members: 'Members',
  companies: 'Companies',
  pages: 'Pages',
  groups: 'Groups',
  posts: 'Posts',
  newsletters: 'Newsletters',
  events: 'Events',
  faqs: 'FAQs',
  knowledgeBase: 'Knowledge Base',
  forums: 'Forums',
};

const SECTIONS = ['all', 'members', 'companies', 'pages', 'groups', 'posts', 'newsletters', 'events', 'faqs', 'knowledgeBase', 'forums'];

function flattenGroups(groups = {}) {
  return Object.entries(groups).flatMap(([section, items]) =>
    (Array.isArray(items) ? items : []).map((item) => ({ ...item, section }))
  );
}

export default function PlatformSearchPage() {
  const router = useRouter();
  const initialQuery = typeof router.query.q === 'string' ? router.query.q : '';

  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [activeSection, setActiveSection] = useState('all');
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof router.query.q === 'string') {
      setQuery(router.query.q);
      setSubmittedQuery(router.query.q);
    }
  }, [router.query.q]);

  useEffect(() => {
    const q = submittedQuery.trim();

    if (q.length < 2) {
      setGroups({});
      return;
    }

    let alive = true;

    async function runSearch() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/search/global', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, limit: 12 }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Search failed');
        }

        if (alive) setGroups(data.groups || {});
      } catch (err) {
        console.error('[search page] search failed', err);
        if (alive) {
          setError('Search failed. Please try again.');
          setGroups({});
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    runSearch();

    return () => {
      alive = false;
    };
  }, [submittedQuery]);

  const allResults = useMemo(() => flattenGroups(groups).sort((a, b) => Number(b.relevance || 0) - Number(a.relevance || 0)), [groups]);

  const visibleResults = activeSection === 'all'
    ? allResults
    : Array.isArray(groups[activeSection])
      ? groups[activeSection]
      : [];

  function submitSearch(event) {
    event?.preventDefault?.();
    const q = query.trim();
    if (q.length < 2) return;
    setSubmittedQuery(q);
    setActiveSection('all');
    router.replace(`/search?q=${encodeURIComponent(q)}`, undefined, { shallow: true });
  }

  return (
    <>
      <Head>
        <title>Search ForgeTomorrow</title>
      </Head>

      <main className="min-h-screen px-6 py-8 text-slate-900">
        <section className="mx-auto max-w-6xl rounded-3xl border border-white/25 bg-white/70 p-6 shadow-xl backdrop-blur-xl">
          <div className="mb-6">
            <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-slate-500">Platform Search</p>
            <h1 className="text-3xl font-black" style={{ color: ORANGE }}>Search ForgeTomorrow</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-600">
              Find members, companies, posts, groups, pages, newsletters, and platform resources. Career/job intelligence stays on the Jobs page.
            </p>
          </div>

          <form onSubmit={submitSearch} className="mb-5 flex gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people, companies, posts, groups..."
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm font-bold outline-none focus:border-orange-300"
            />
            <button
              type="submit"
              className="rounded-2xl px-5 py-3 text-sm font-black text-white shadow"
              style={{ background: ORANGE }}
            >
              Search
            </button>
          </form>

          <div className="mb-6 flex flex-wrap gap-2">
            {SECTIONS.map((section) => {
              const count = section === 'all' ? allResults.length : (groups[section] || []).length;
              const active = activeSection === section;

              return (
                <button
                  key={section}
                  type="button"
                  onClick={() => setActiveSection(section)}
                  className="rounded-full border px-3 py-1.5 text-xs font-black"
                  style={{
                    borderColor: active ? ORANGE : 'rgba(15,23,42,0.12)',
                    background: active ? ORANGE : 'rgba(255,255,255,0.75)',
                    color: active ? 'white' : '#475569',
                  }}
                >
                  {SECTION_LABELS[section]} {count ? `(${count})` : ''}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white/75 p-10 text-center text-sm font-black text-slate-500">Searching...</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">{error}</div>
          ) : submittedQuery.trim().length < 2 ? (
            <div className="rounded-2xl border border-slate-200 bg-white/75 p-10 text-center text-sm font-semibold text-slate-500">Enter at least 2 characters to search the platform.</div>
          ) : visibleResults.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white/75 p-10 text-center text-sm font-semibold text-slate-500">No results found.</div>
          ) : (
            <div className="grid gap-3">
              {visibleResults.map((item) => (
                <a
                  key={`${item.type}-${item.id}`}
                  href={item.url || '#'}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-sm font-black text-slate-600">
                    {item.avatar ? <img src={item.avatar} alt="" className="h-full w-full object-cover" /> : item.type?.slice(0, 1)?.toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-black text-slate-900">{item.title}</h2>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
                        {item.type}
                      </span>
                    </div>
                    {item.subtitle ? <p className="truncate text-xs font-bold text-slate-500">{item.subtitle}</p> : null}
                    {item.snippet ? <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.snippet}</p> : null}
                  </div>

                  <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black" style={{ color: ORANGE }}>
                    {item.relevance}%
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
