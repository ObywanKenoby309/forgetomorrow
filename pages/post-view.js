// pages/post-view.js
import { useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import { useConnect } from '@/components/actions/useConnect';

// Helper: parse FeedPost.content into { body, attachments[] }
function parseContent(content) {
  let body = content || '';
  let attachments = [];

  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.body === 'string') body = parsed.body;
      if (Array.isArray(parsed.attachments)) attachments = parsed.attachments;
    }
  } catch {
    // content was plain text
  }

  return { body, attachments };
}

// Safely parse Json/JSON-string arrays
function safeJsonArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (v && typeof v === 'object') {
    return Array.isArray(v) ? v : [];
  }
  return [];
}

function normalizeName(u) {
  try {
    if (!u) return '';
    const full =
      u.name ||
      [u.firstName, u.lastName].filter(Boolean).join(' ') ||
      (u.email ? String(u.email).split('@')[0] : '');
    return String(full || '').trim();
  } catch {
    return '';
  }
}

// Normalize comments for UI
function normalizeComments(rawComments, viewerId, userById) {
  const vid = viewerId ? String(viewerId) : null;
  const comments = safeJsonArray(rawComments);

  return comments
    .map((c) => {
      if (!c || typeof c !== 'object') return null;

      const authorId = String(c?.authorId || c?.userId || '').trim();
      const u = authorId && userById ? userById[authorId] : null;

      const likesNum = Number(c.likes);
      const likes = Number.isFinite(likesNum) ? likesNum : 0;

      const likedBy = Array.isArray(c.likedBy) ? c.likedBy.map((x) => String(x)) : [];
      const hasLiked = vid ? likedBy.includes(vid) : Boolean(c?.hasLiked);

      const by = String(
        c?.by || c?.authorName || c?.author || normalizeName(u) || 'Member'
      ).trim();
      const text = String(c?.text || c?.body || '').trim();
      const at = c?.at || c?.createdAt || null;

      const avatarUrl = c?.avatarUrl || (u ? u.avatarUrl || u.image || null : null) || null;

      return {
        ...c,
        authorId: authorId || c?.authorId || null,
        userId: c?.userId || null,
        by,
        text,
        at,
        likes,
        likedBy,
        hasLiked,
        avatarUrl,
      };
    })
    .filter(Boolean);
}

function isLikelyUrl(s) {
  try {
    const str = String(s || '').trim();
    if (!str) return false;
    if (str.startsWith('http://') || str.startsWith('https://')) return true;
    return false;
  } catch {
    return false;
  }
}

function isLikelyImageUrl(s) {
  try {
    const str = String(s || '').toLowerCase();
    if (!isLikelyUrl(str)) return false;
    return (
      str.endsWith('.png') ||
      str.endsWith('.jpg') ||
      str.endsWith('.jpeg') ||
      str.endsWith('.gif') ||
      str.endsWith('.webp')
    );
  } catch {
    return false;
  }
}

function formatCompactNumber(n) {
  try {
    const num = Number(n || 0);
    if (!Number.isFinite(num)) return '0';
    return new Intl.NumberFormat(undefined, { notation: 'compact' }).format(num);
  } catch {
    return String(n ?? 0);
  }
}

function formatDateTime(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return '';
  }
}

function GlassPanel({ children, style }) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.22)',
        background: 'rgba(255,255,255,0.58)',
        boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PillStat({ label, value }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 999,
        border: '1px solid rgba(15,23,42,0.10)',
        background: 'rgba(255,255,255,0.70)',
        fontSize: 12,
        color: '#37474F',
        lineHeight: 1,
      }}
    >
      <span style={{ fontWeight: 800, color: '#263238' }}>{value}</span>
      <span style={{ opacity: 0.9 }}>{label}</span>
    </div>
  );
}

export default function PostViewPage({ initialPost, notFound }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { connectWith } = useConnect();

  const [post, setPost] = useState(initialPost || null);

  // Avatar popovers (post author + comment rows)
  const [authorMenuOpen, setAuthorMenuOpen] = useState(false);
  const [commentMenuKey, setCommentMenuKey] = useState(null);
  const [connectingKey, setConnectingKey] = useState(null);

  // Inline comments UX
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  // ✅ Per-comment reply composers (including root "Add a comment")
  const [activeReplyKey, setActiveReplyKey] = useState(null); // 'root' | commentKey
  const [replyTextByKey, setReplyTextByKey] = useState({});
  const [replyBusyKey, setReplyBusyKey] = useState(null);

  const commentsSectionRef = useRef(null);
  const replyBoxRefs = useRef({}); // key -> textarea element

  const myId = session?.user?.id ? String(session.user.id) : '';
  const myName = useMemo(() => {
    try {
      const u = session?.user || {};
      return (
        u.name ||
        [u.firstName, u.lastName].filter(Boolean).join(' ') ||
        (u.email ? String(u.email).split('@')[0] : '') ||
        'Me'
      );
    } catch {
      return 'Me';
    }
  }, [session]);

  const myAvatar = session?.user?.avatarUrl || session?.user?.image || null;

  // keep chrome param on navigation
  const chrome = String(router.query?.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // Visible comments only (hide soft-deleted)
  const visibleComments = useMemo(() => {
    const all = Array.isArray(post?.comments) ? post.comments : [];
    return all.filter((c) => !(c && c.deleted === true));
  }, [post]);

  const previewComments = useMemo(() => {
    return (visibleComments || []).slice(0, 2);
  }, [visibleComments]);

  const createdAtLabel = post?.createdAt ? formatDateTime(post.createdAt) : '';

  const likesCount = Number.isFinite(Number(post?.likes)) ? Number(post.likes) : 0;
  const commentsCount = Array.isArray(visibleComments) ? visibleComments.length : 0;

  const handleBack = () => router.push(withChrome('/feed'));

  const scrollToComments = () => {
    try {
      commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      // ignore
    }
  };

  const focusReplyBox = (key) => {
    try {
      setTimeout(() => {
        const el = replyBoxRefs.current?.[key];
        el?.focus?.();
      }, 60);
    } catch {
      // ignore
    }
  };

  const handleViewAllComments = () => {
    setCommentsExpanded(true);
    scrollToComments();
  };

  const openRootComposer = () => {
    setActiveReplyKey('root');
    setCommentsExpanded(true);
    scrollToComments();
    focusReplyBox('root');
  };

  const openCommentComposer = (commentKey, prefillName) => {
    setCommentsExpanded(true);
    scrollToComments();

    setActiveReplyKey(commentKey);

    try {
      const n = String(prefillName || '').trim();
      if (n) {
        setReplyTextByKey((prev) => {
          const cur = String(prev?.[commentKey] || '');
          if (cur.trim().length === 0) return { ...prev, [commentKey]: `@${n} ` };
          return prev;
        });
      }
    } catch {
      // ignore
    }

    focusReplyBox(commentKey);
  };

  const closeComposer = () => {
    setActiveReplyKey(null);
  };

  const getReplyText = (key) => String(replyTextByKey?.[key] || '');

  const setReplyText = (key, val) => {
    setReplyTextByKey((prev) => ({ ...(prev || {}), [key]: val }));
  };

  // Minimal: reply handler (uses your existing comment API)
  const handleReply = async (postId, text) => {
    try {
      const res = await fetch('/api/feed/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, text }),
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        alert(msg?.error || 'Could not add comment. Please try again.');
        return null;
      }

      const data = await res.json().catch(() => ({}));
      if (data?.post) return data.post;
      return null;
    } catch {
      alert('Could not add comment (network/server).');
      return null;
    }
  };

  const submitReplyForKey = async (key) => {
    const t = getReplyText(key).trim();
    if (!t) return;
    if (!post?.id) return;
    if (replyBusyKey === key) return;

    setReplyBusyKey(key);

    // Optimistic append (flat comment model)
    try {
      const optimistic = {
        id: `tmp_${Date.now()}`,
        authorId: myId || null,
        userId: myId || null,
        by: myName || 'Member',
        text: t,
        at: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        hasLiked: false,
        avatarUrl: myAvatar,
      };

      setPost((prev) => {
        if (!prev) return prev;
        const current = Array.isArray(prev.comments) ? prev.comments : [];
        return { ...prev, comments: [...current, optimistic] };
      });
    } catch {
      // ignore optimistic
    }

    const updated = await handleReply(post.id, t);

    if (updated) {
      try {
        const nextComments = Array.isArray(updated.comments) ? updated.comments : [];
        const normalized = nextComments
          .map((c) => {
            if (!c || typeof c !== 'object') return null;
            const authorId = String(c?.authorId || c?.userId || '').trim();
            const by = String(
              c?.by ||
                c?.authorName ||
                c?.author ||
                (authorId === myId ? myName : '') ||
                'Member'
            ).trim();
            const text = String(c?.text || c?.body || '').trim();
            const at = c?.at || c?.createdAt || null;

            const avatarUrl = c?.avatarUrl || (authorId === myId ? myAvatar : null) || null;

            return {
              ...c,
              authorId: authorId || c?.authorId || null,
              userId: c?.userId || null,
              by,
              text,
              at,
              likes: Number.isFinite(Number(c?.likes)) ? Number(c.likes) : 0,
              hasLiked: Boolean(c?.hasLiked),
              avatarUrl,
            };
          })
          .filter(Boolean);

        setPost((prev) => {
          if (!prev) return prev;
          return { ...prev, ...updated, comments: normalized };
        });
      } catch {
        setPost((prev) => (prev ? { ...prev, ...updated } : updated));
      }
    }

    setReplyTextByKey((prev) => ({ ...(prev || {}), [key]: '' }));
    setReplyBusyKey(null);
    setActiveReplyKey(null);
  };

  // ─────────────────────────────────────────────────────────────
  // Member actions
  // ─────────────────────────────────────────────────────────────
  const logProfileView = async (targetUserId, source) => {
    try {
      await fetch('/api/profile/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, source: source || 'post_view' }),
      });
    } catch {
      // ignore
    }
  };

  const handleViewProfile = async (targetUserId) => {
    if (!targetUserId) return;

    setAuthorMenuOpen(false);
    setCommentMenuKey(null);

    logProfileView(targetUserId, 'post_view');

    const params = new URLSearchParams();
    params.set('userId', targetUserId);
    router.push(withChrome(`/member-profile?${params.toString()}`));
  };

  const handleConnect = async (targetUserId, key) => {
    if (!targetUserId) return;
    if (connectingKey === key) return;

    setAuthorMenuOpen(false);
    setCommentMenuKey(null);
    setConnectingKey(key);

    const result = await connectWith(targetUserId);

    setConnectingKey(null);

    if (!result?.ok) {
      alert(result?.errorMessage || 'We could not send your connection request. Please try again.');
      return;
    }

    if (result.alreadyConnected || result.status === 'connected') {
      alert('You are already connected.');
      return;
    }

    alert(result.alreadyRequested ? 'Connection request already sent.' : 'Connection request sent.');
  };

  const handleMessage = (targetUserId) => {
    if (!targetUserId) return;

    setAuthorMenuOpen(false);
    setCommentMenuKey(null);

    const params = new URLSearchParams();
    params.set('userId', targetUserId);
    params.set('action', 'message');
    router.push(withChrome(`/seeker/messages?${params.toString()}`));
  };

  const getCommentAuthorId = (c) => {
    try {
      return String(c?.authorId || c?.userId || '').trim();
    } catch {
      return '';
    }
  };

  // If the post was deleted / missing
  if (notFound) {
    return (
      <>
        <Head>
          <title>ForgeTomorrow — Post</title>
        </Head>

        <SeekerLayout
          title="Post | ForgeTomorrow"
          right={<RightRailPlacementManager />}
          activeNav="feed"
          header={
            <GlassPanel
              style={{
                padding: '18px 16px',
                margin: '0 auto',
                maxWidth: 1320,
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#FF7043', fontSize: 26, fontWeight: 900, margin: 0 }}>
                  Post
                </div>
                <div style={{ marginTop: 6, color: '#546E7A', fontSize: 14 }}>
                  This post could not be found.
                </div>
              </div>
            </GlassPanel>
          }
        >
          <GlassPanel style={{ padding: '24px 16px' }}>
            <div className="text-sm text-gray-700">
              This post could not be found. It may have been deleted or is no longer available.
            </div>

            <button
              className="mt-4 px-4 py-2 rounded-md bg-[#FF7043] text-white font-semibold"
              onClick={handleBack}
            >
              Back to Feed
            </button>
          </GlassPanel>
        </SeekerLayout>
      </>
    );
  }

  if (!post) return null;

  const postAuthorId = post?.authorId ? String(post.authorId) : '';
  const canTargetPostAuthor = Boolean(postAuthorId) && Boolean(myId) && postAuthorId !== myId;

  return (
    <>
      <Head>
        <title>ForgeTomorrow — Post</title>
      </Head>

      <SeekerLayout
        title="Post | ForgeTomorrow"
        right={<RightRailPlacementManager />}
        activeNav="feed"
        header={
          <GlassPanel
            style={{
              padding: '18px 16px',
              margin: '0 auto',
              maxWidth: 1320,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#FF7043', fontSize: 26, fontWeight: 900, margin: 0 }}>
                Post detail
              </div>
              <div style={{ marginTop: 4, color: '#546E7A', fontSize: 14 }}>
                A focused view for analytics and deep engagement.
              </div>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                <button
                  className="px-3 py-2 rounded-md border border-gray-200 bg-white/70 text-sm font-semibold text-gray-700 hover:bg-white"
                  onClick={handleBack}
                >
                  ← Back to Feed
                </button>
              </div>
            </div>
          </GlassPanel>
        }
      >
        <GlassPanel
          style={{
            padding: '18px 16px',
            margin: '20px 0 0',
            width: '100%',
            maxWidth: 'none',
            minHeight: '60vh',
          }}
        >
          {/* Main post card */}
          <div
            style={{
              background: 'rgba(255,255,255,0.92)',
              borderRadius: 14,
              border: '1px solid rgba(15,23,42,0.10)',
              boxShadow: '0 10px 24px rgba(0,0,0,0.10)',
              padding: 18,
            }}
          >
            {/* Author row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (!canTargetPostAuthor) return;
                      setAuthorMenuOpen((v) => !v);
                    }}
                    onBlur={() => setAuthorMenuOpen(false)}
                    className="shrink-0"
                    style={{ cursor: canTargetPostAuthor ? 'pointer' : 'default' }}
                    aria-label={canTargetPostAuthor ? 'Open member actions' : 'Author avatar'}
                  >
                    {post.authorAvatar ? (
                      <img
                        src={post.authorAvatar}
                        alt={post.author || 'Author'}
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 999,
                          objectFit: 'cover',
                          background: '#E5E7EB',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 999,
                          background: '#E5E7EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#546E7A',
                          fontWeight: 900,
                        }}
                      >
                        {post.author?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </button>

                  {authorMenuOpen && canTargetPostAuthor ? (
                    <div
                      className="absolute left-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden"
                      role="menu"
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleViewProfile(postAuthorId)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        role="menuitem"
                      >
                        View profile
                      </button>

                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleConnect(postAuthorId, 'post_author')}
                        disabled={connectingKey === 'post_author'}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:text-gray-400 disabled:bg-white"
                        role="menuitem"
                      >
                        {connectingKey === 'post_author' ? 'Sending…' : 'Connect'}
                      </button>

                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleMessage(postAuthorId)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        role="menuitem"
                      >
                        Message
                      </button>
                    </div>
                  ) : null}
                </div>

                <div>
                  <div style={{ fontWeight: 900, color: '#102027', fontSize: 15 }}>
                    {post.author || 'Member'}
                  </div>
                  <div style={{ fontSize: 12, color: '#607D8B' }}>
                    {createdAtLabel} • {post.type || 'business'}
                  </div>
                </div>
              </div>

              {/* Stats + ✅ Add a comment button lives up here now */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <PillStat label="Likes" value={formatCompactNumber(likesCount)} />
                <PillStat label="Comments" value={formatCompactNumber(commentsCount)} />

                <button
                  className="px-3 py-2 rounded-md border border-gray-200 bg-white/70 text-sm font-semibold text-gray-700 hover:bg-white"
                  onClick={openRootComposer}
                >
                  Add a comment
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  fontSize: 16,
                  color: '#102027',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {post.body}
              </div>
            </div>

            {/* Attachments */}
            {Array.isArray(post.attachments) && post.attachments.length > 0 ? (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#37474F' }}>Attachments</div>

                <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                  {post.attachments.map((a, idx) => {
                    const raw = typeof a === 'string' ? a : JSON.stringify(a);
                    const url = typeof a === 'string' ? a : null;
                    const showImage = url && isLikelyImageUrl(url);

                    return (
                      <div
                        key={idx}
                        style={{
                          borderRadius: 12,
                          border: '1px solid rgba(15,23,42,0.10)',
                          background: 'rgba(255,255,255,0.75)',
                          padding: 12,
                        }}
                      >
                        {showImage ? (
                          <div style={{ display: 'grid', gap: 8 }}>
                            <img
                              src={url}
                              alt="Attachment"
                              style={{
                                width: '100%',
                                maxHeight: 360,
                                borderRadius: 10,
                                objectFit: 'cover',
                                background: '#ECEFF1',
                              }}
                            />
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: '#FF7043',
                                wordBreak: 'break-all',
                              }}
                            >
                              Open image
                            </a>
                          </div>
                        ) : isLikelyUrl(url) ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: '#FF7043',
                              wordBreak: 'break-all',
                            }}
                          >
                            {url}
                          </a>
                        ) : (
                          <div style={{ fontSize: 13, color: '#37474F', wordBreak: 'break-all' }}>
                            {raw}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* ✅ Root composer opens under the post card */}
            {activeReplyKey === 'root' ? (
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 14,
                  border: '1px solid rgba(15,23,42,0.10)',
                  background: 'rgba(255,255,255,0.75)',
                  padding: 14,
                }}
              >
                <div style={{ fontWeight: 900, color: '#263238', marginBottom: 8 }}>Reply</div>

                <textarea
                  ref={(el) => {
                    replyBoxRefs.current['root'] = el;
                  }}
                  value={getReplyText('root')}
                  onChange={(e) => setReplyText('root', e.target.value)}
                  rows={3}
                  className="w-full border rounded-md p-3"
                  placeholder="Write your comment…"
                />

                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    className="px-3 py-2 rounded-md border border-gray-200 bg-white/70 text-sm font-semibold text-gray-700 hover:bg-white"
                    onClick={() => {
                      setReplyTextByKey((prev) => ({ ...(prev || {}), root: '' }));
                      closeComposer();
                    }}
                    disabled={replyBusyKey === 'root'}
                  >
                    Cancel
                  </button>

                  <button
                    className="px-4 py-2 rounded-md bg-[#ff8a65] text-white font-semibold disabled:opacity-50"
                    onClick={() => submitReplyForKey('root')}
                    disabled={!getReplyText('root').trim() || replyBusyKey === 'root'}
                  >
                    {replyBusyKey === 'root' ? 'Posting…' : 'Post reply'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Comments section */}
          <div style={{ marginTop: 16 }} ref={commentsSectionRef}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontWeight: 900, color: '#263238' }}>Top comments</div>

              {!commentsExpanded ? (
                <button
                  className="px-3 py-2 rounded-md border border-gray-200 bg-white/70 text-sm font-semibold text-gray-700 hover:bg-white"
                  onClick={handleViewAllComments}
                >
                  View all comments
                </button>
              ) : (
                <button
                  className="px-3 py-2 rounded-md border border-gray-200 bg-white/70 text-sm font-semibold text-gray-700 hover:bg-white"
                  onClick={() => setCommentsExpanded(false)}
                >
                  Collapse
                </button>
              )}
            </div>

            {/* Inline list: preview or expanded */}
            {(commentsExpanded ? visibleComments : previewComments).length === 0 ? (
              <div style={{ marginTop: 10, fontSize: 13, color: '#607D8B' }}>
                No comments yet. Be the first to respond.
              </div>
            ) : (
              <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                {(commentsExpanded ? visibleComments : previewComments).map((c, idx) => {
                  const name = c?.by || 'Member';
                  const text = c?.text || '';
                  const when = c?.at ? formatDateTime(c.at) : '';
                  const likes = Number.isFinite(Number(c?.likes)) ? Number(c.likes) : 0;

                  const targetUserId = getCommentAuthorId(c);
                  const canTarget = Boolean(targetUserId) && Boolean(myId) && targetUserId !== myId;

                  const menuKey = `${post.id}:c:${c?.id || idx}`;
                  const menuOpen = commentMenuKey === menuKey;

                  const commentKey = String(c?.id || `idx_${idx}`);
                  const composerOpen = activeReplyKey === commentKey;

                  return (
                    <div
                      key={c?.id || `${idx}`}
                      style={{
                        borderRadius: 14,
                        border: '1px solid rgba(15,23,42,0.10)',
                        background: 'rgba(255,255,255,0.70)',
                        padding: 14,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              if (!canTarget) return;
                              setCommentMenuKey((v) => (v === menuKey ? null : menuKey));
                            }}
                            onBlur={() => setCommentMenuKey(null)}
                            style={{ cursor: canTarget ? 'pointer' : 'default' }}
                            aria-label={canTarget ? 'Open member actions' : 'Comment author avatar'}
                          >
                            {c?.avatarUrl ? (
                              <img
                                src={c.avatarUrl}
                                alt={name}
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 999,
                                  objectFit: 'cover',
                                  background: '#E5E7EB',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 999,
                                  background: '#E5E7EB',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#546E7A',
                                  fontWeight: 900,
                                  fontSize: 13,
                                }}
                              >
                                {String(name || '?').trim().charAt(0).toUpperCase()}
                              </div>
                            )}
                          </button>

                          {menuOpen && canTarget ? (
                            <div
                              className="absolute left-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden"
                              role="menu"
                            >
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleViewProfile(targetUserId)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                role="menuitem"
                              >
                                View profile
                              </button>

                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleConnect(targetUserId, menuKey)}
                                disabled={connectingKey === menuKey}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:text-gray-400 disabled:bg-white"
                                role="menuitem"
                              >
                                {connectingKey === menuKey ? 'Sending…' : 'Connect'}
                              </button>

                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleMessage(targetUserId)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                role="menuitem"
                              >
                                Message
                              </button>
                            </div>
                          ) : null}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 900, color: '#102027', fontSize: 13 }}>{name}</div>
                          <div style={{ fontSize: 12, color: '#78909C' }}>{when ? when : ' '}</div>
                        </div>

                        <PillStat label="Likes" value={formatCompactNumber(likes)} />
                      </div>

                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 14,
                          color: '#263238',
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.5,
                        }}
                      >
                        {text}
                      </div>

                      {/* ✅ Reply button opens composer under *this* comment */}
                      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          className="text-sm font-semibold"
                          style={{ color: '#FF7043' }}
                          onClick={() => openCommentComposer(commentKey, name)}
                        >
                          Reply →
                        </button>
                      </div>

                      {/* ✅ Per-comment composer */}
                      {composerOpen ? (
                        <div
                          style={{
                            marginTop: 10,
                            borderRadius: 14,
                            border: '1px solid rgba(15,23,42,0.10)',
                            background: 'rgba(255,255,255,0.80)',
                            padding: 12,
                          }}
                        >
                          <div style={{ fontWeight: 900, color: '#263238', marginBottom: 8 }}>
                            Reply
                          </div>

                          <textarea
                            ref={(el) => {
                              replyBoxRefs.current[commentKey] = el;
                            }}
                            value={getReplyText(commentKey)}
                            onChange={(e) => setReplyText(commentKey, e.target.value)}
                            rows={3}
                            className="w-full border rounded-md p-3"
                            placeholder={`Reply to ${name}…`}
                          />

                          <div
                            style={{
                              marginTop: 10,
                              display: 'flex',
                              justifyContent: 'flex-end',
                              gap: 10,
                            }}
                          >
                            <button
                              className="px-3 py-2 rounded-md border border-gray-200 bg-white/70 text-sm font-semibold text-gray-700 hover:bg-white"
                              onClick={() => {
                                setReplyTextByKey((prev) => ({ ...(prev || {}), [commentKey]: '' }));
                                closeComposer();
                              }}
                              disabled={replyBusyKey === commentKey}
                            >
                              Cancel
                            </button>

                            <button
                              className="px-4 py-2 rounded-md bg-[#ff8a65] text-white font-semibold disabled:opacity-50"
                              onClick={() => submitReplyForKey(commentKey)}
                              disabled={!getReplyText(commentKey).trim() || replyBusyKey === commentKey}
                            >
                              {replyBusyKey === commentKey ? 'Posting…' : 'Post reply'}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </GlassPanel>
      </SeekerLayout>
    </>
  );
}

export async function getServerSideProps(ctx) {
  const req = ctx.req;
  const res = ctx.res;

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  const idRaw = ctx.query?.id;
  const idNum = typeof idRaw === 'string' ? parseInt(idRaw, 10) : Number(idRaw);

  if (!idNum || Number.isNaN(idNum)) {
    return { props: { initialPost: null, notFound: true } };
  }

  const row = await prisma.feedPost.findUnique({
    where: { id: idNum },
    select: {
      id: true,
      authorId: true,
      authorName: true,
      content: true,
      type: true,
      createdAt: true,
      likes: true,
      comments: true,
      reactions: true,
    },
  });

  if (!row) {
    return { props: { initialPost: null, notFound: true } };
  }

  // author avatar
  let authorAvatar = null;
  if (row.authorId) {
    const u = await prisma.user.findUnique({
      where: { id: row.authorId },
      select: { avatarUrl: true, image: true },
    });
    authorAvatar = u?.avatarUrl || u?.image || null;
  }

  // Enrich commenters (avatars + names)
  const rawComments = safeJsonArray(row.comments);
  const commenterIds = Array.from(
    new Set(
      rawComments
        .map((c) => (c ? String(c.authorId || c.userId || '').trim() : ''))
        .filter(Boolean)
    )
  );

  let userById = {};
  if (commenterIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: commenterIds } },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        image: true,
      },
    });

    userById = (users || []).reduce((acc, u) => {
      acc[String(u.id)] = u;
      return acc;
    }, {});
  }

  const { body, attachments } = parseContent(row.content);

  const initialPost = {
    id: row.id,
    authorId: row.authorId,
    author: row.authorName,
    authorAvatar,
    body,
    type: row.type || 'business',
    createdAt: row.createdAt,
    likes: row.likes ?? 0,
    comments: normalizeComments(row.comments, String(session.user.id), userById),
    attachments,
    reactions: safeJsonArray(row.reactions),
  };

  return {
    props: {
      initialPost,
      notFound: false,
    },
  };
}
