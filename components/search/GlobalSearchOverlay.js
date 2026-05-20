// components/search/GlobalSearchOverlay.js
// ForgeTomorrow Global Search Overlay
// Opens from header/search icon. Supports Ctrl/Cmd+K.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';

const SECTION_LABELS = {
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

function flattenGroups(groups = {}) {
  return Object.entries(groups).flatMap(([section, items]) =>
    (Array.isArray(items) ? items : []).map((item) => ({ ...item, section }))
  );
}

export default function GlobalSearchOverlay({ open, onClose }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});

  const flatResults = useMemo(() => flattenGroups(results), [results]);

  useEffect(() => {
    function handleKeyDown(event) {
      const isSearchShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (isSearchShortcut) {
        event.preventDefault();
        if (!open) return;
        inputRef.current?.focus();
      }

      if (event.key === 'Escape' && open) {
        onClose?.();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const q = query.trim();

    if (q.length < 2) {
      setResults({});
      setLoading(false);
      return;
    }

    let alive = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/search/global', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, limit: 5 }),
        });

        const data = await response.json();
        if (alive) setResults(data.groups || {});
      } catch (error) {
        console.error('[GlobalSearchOverlay] search failed', error);
        if (alive) setResults({});
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  function goToResult(item) {
    if (!item?.url) return;
    onClose?.();
    router.push(item.url);
  }

  function goToFullSearch() {
    const q = query.trim();
    if (!q) return;
    onClose?.();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/45 px-4 pt-20 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/25 bg-white/90 shadow-2xl backdrop-blur-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-200/80 p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') goToFullSearch();
              }}
              placeholder="Search ForgeTomorrow..."
              className="w-full bg-transparent text-base font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              Esc
            </button>
          </div>
        </div>

        <div className="max-h-[62vh] overflow-y-auto p-3">
          {query.trim().length < 2 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Search members, companies, posts, groups, pages, and newsletters.
            </div>
          ) : loading ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">Searching...</div>
          ) : flatResults.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No results found.</div>
          ) : (
            Object.entries(results).map(([section, items]) => {
              if (!Array.isArray(items) || items.length === 0) return null;

              return (
                <div key={section} className="mb-4">
                  <div className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    {SECTION_LABELS[section] || section}
                  </div>

                  <div className="space-y-1">
                    {items.map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        onClick={() => goToResult(item)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-orange-50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-sm font-black text-slate-600">
                          {item.avatar ? (
                            <img src={item.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            item.type?.slice(0, 1)?.toUpperCase() || '•'
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-black text-slate-900">{item.title}</div>
                          {item.subtitle ? <div className="truncate text-xs font-semibold text-slate-500">{item.subtitle}</div> : null}
                          {item.snippet ? <div className="truncate text-xs text-slate-500">{item.snippet}</div> : null}
                        </div>

                        <div className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
                          {item.relevance}%
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200/80 px-4 py-3">
          <div className="text-xs font-semibold text-slate-500">Ctrl/⌘ K opens search • Enter opens full results</div>
          <button
            type="button"
            onClick={goToFullSearch}
            disabled={!query.trim()}
            className="rounded-xl bg-[#FF7043] px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Full Search
          </button>
        </div>
      </div>
    </div>
  );
}
