// pages/seeker/the-hearth/forums.js
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

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

function fmtDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '';
  }
}

function Avatar({ src, name }) {
  const initial = String(name || 'M').trim().charAt(0).toUpperCase() || 'M';
  if (src) {
    return <img src={src} alt={name || 'Member'} className="h-10 w-10 rounded-full object-cover border border-gray-200" />;
  }
  return (
    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 border border-gray-200 font-bold">
      {initial}
    </div>
  );
}

export default function HearthForumsPage() {
  const router = useRouter();
  const chrome = String(router.query.chrome || 'seeker').toLowerCase();
  const selectedThreadId = typeof router.query.thread === 'string' ? router.query.thread : '';

  const { Layout, activeNav } = makeLayout(chrome);
  const [threads, setThreads] = useState([]);
  const [thread, setThread] = useState(null);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const selectedId = selectedThreadId || threads[0]?.id || '';

  const loadThreads = async () => {
    setLoadingThreads(true);
    setError('');
    try {
      const res = await fetch('/api/hearth/forums');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to load Hearth discussions.');
      setThreads(Array.isArray(data.threads) ? data.threads : []);
    } catch (err) {
      setError(err.message || 'Unable to load Hearth discussions.');
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadThread = async (id) => {
    if (!id) {
      setThread(null);
      return;
    }
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/hearth/forums/${encodeURIComponent(id)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to load this discussion.');
      setThread(data.thread || null);
    } catch (err) {
      setError(err.message || 'Unable to load this discussion.');
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadThread(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedThreadId && threads[0]?.id) {
      router.replace(withChrome(`/seeker/the-hearth/forums?thread=${threads[0].id}`), undefined, { shallow: true });
    }
  }, [selectedThreadId, threads]);

  const handleSelectThread = (id) => {
    router.push(withChrome(`/seeker/the-hearth/forums?thread=${id}`), undefined, { shallow: true });
  };

  const handleReply = async () => {
    const body = replyText.trim();
    if (!body || !thread?.id || replying) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/hearth/forums/${encodeURIComponent(thread.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to post your reply.');
      setThread((prev) => ({
        ...prev,
        replies: [...(Array.isArray(prev?.replies) ? prev.replies : []), data.reply],
      }));
      setThreads((prev) =>
        prev.map((item) =>
          item.id === thread.id ? { ...item, replyCount: Number(item.replyCount || 0) + 1, updatedAt: new Date().toISOString() } : item
        )
      );
      setReplyText('');
    } catch (err) {
      alert(err.message || 'Unable to post your reply.');
    } finally {
      setReplying(false);
    }
  };

  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <RightRailPlacementManager surfaceId="seeker/the-hearth/forums" slot="right_rail_1" />
    </div>
  );

  const Header = (
    <section className="rounded-2xl border border-white/50 bg-white/75 backdrop-blur-xl shadow-[0_14px_40px_rgba(15,23,42,0.08)] p-5 text-center">
      <h1 className="m-0 text-[#FF7043] text-[clamp(22px,5vw,28px)] font-black leading-tight">
        Hearth Discussions
      </h1>
      <p className="mt-2 mx-auto max-w-3xl text-gray-600 text-sm sm:text-[15px] leading-relaxed">
        Feed conversations recommended by the community can continue here as deeper, searchable discussions.
      </p>
    </section>
  );

  const filteredThreads = useMemo(() => threads, [threads]);

  return (
    <Layout
      title="Forums | ForgeTomorrow"
      header={Header}
      right={RightRail}
      activeNav={activeNav}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.7fr)]">
        <section className="rounded-2xl border border-white/50 bg-white/78 backdrop-blur-xl shadow-[0_14px_40px_rgba(15,23,42,0.08)] p-4 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div className="text-sm font-black text-gray-900">Community branches</div>
              <div className="text-xs text-gray-500">Discussions continued from the Feed</div>
            </div>
            <button
              type="button"
              onClick={loadThreads}
              className="text-xs font-bold text-[#FF7043] hover:opacity-80"
            >
              Refresh
            </button>
          </div>

          {loadingThreads ? (
            <div className="text-sm text-gray-500 py-6">Loading discussions...</div>
          ) : error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : filteredThreads.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white/80 p-4 text-sm text-gray-600 leading-relaxed">
              No Hearth discussions yet. When a feed post receives 5 Hearth recommendations, the original poster can continue it here.
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredThreads.map((item) => {
                const active = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectThread(item.id)}
                    className={`text-left rounded-2xl border p-3 transition ${active ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[11px] font-bold text-gray-700">
                        {item.category || 'General'}
                      </span>
                      {item.sourcePostId && (
                        <span className="rounded-full bg-orange-100 border border-orange-200 px-2 py-0.5 text-[11px] font-bold text-orange-700">
                          Branched from Feed
                        </span>
                      )}
                    </div>
                    <div className="font-extrabold text-gray-900 text-sm leading-snug line-clamp-2">{item.title}</div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500">
                      <span>{item.replyCount} {item.replyCount === 1 ? 'reply' : 'replies'}</span>
                      <span>{fmtDate(item.updatedAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/50 bg-white/82 backdrop-blur-xl shadow-[0_14px_40px_rgba(15,23,42,0.08)] p-4 sm:p-5 min-w-0">
          {!selectedId ? (
            <div className="text-sm text-gray-500">Select a discussion to read.</div>
          ) : loadingThread ? (
            <div className="text-sm text-gray-500 py-8">Loading discussion...</div>
          ) : !thread ? (
            <div className="text-sm text-gray-500">Discussion not found.</div>
          ) : (
            <div className="grid gap-5">
              <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="rounded-full bg-orange-50 border border-orange-200 px-2.5 py-1 text-xs font-bold text-orange-700">
                    🔥 Hearth discussion
                  </span>
                  {thread.sourcePostId && (
                    <Link
                      href={withChrome(`/post-view?id=${thread.sourcePostId}`)}
                      className="rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100"
                    >
                      View original feed post
                    </Link>
                  )}
                </div>

                <h2 className="text-2xl font-black text-gray-950 leading-tight m-0">{thread.title}</h2>

                <div className="mt-4 flex items-center gap-3">
                  <Avatar src={thread.authorAvatar} name={thread.authorName} />
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 truncate">{thread.authorName}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {thread.authorHeadline || 'ForgeTomorrow member'} • {fmtDate(thread.createdAt)}
                    </div>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">{thread.body}</p>
              </article>

              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-black text-gray-900">Replies</div>
                  <div className="text-xs text-gray-500">{thread.replies?.length || 0} total</div>
                </div>

                {(thread.replies || []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-4 text-sm text-gray-600">
                    No replies yet. Keep the discussion constructive and useful.
                  </div>
                ) : (
                  thread.replies.map((reply) => (
                    <div key={reply.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Avatar src={reply.authorAvatar} name={reply.authorName} />
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 truncate">{reply.authorName}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {reply.authorHeadline || 'ForgeTomorrow member'} • {fmtDate(reply.createdAt)}
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-gray-800">{reply.body}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Add a thoughtful reply..."
                  className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">Useful discussion beats noise.</div>
                  <button
                    type="button"
                    onClick={handleReply}
                    disabled={replying || !replyText.trim()}
                    className="rounded-xl bg-[#FF7043] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {replying ? 'Posting...' : 'Post reply'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
