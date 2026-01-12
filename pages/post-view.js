// pages/post-view.js
import { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import PostCommentsModal from '@/components/feed/PostCommentsModal';

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

// Normalize comments for UI
function normalizeComments(rawComments, viewerId) {
  const vid = viewerId ? String(viewerId) : null;

  const comments = safeJsonArray(rawComments);

  return comments
    .map((c) => {
      if (!c || typeof c !== 'object') return c;

      const likesNum = Number(c.likes);
      const likes = Number.isFinite(likesNum) ? likesNum : 0;

      const likedBy = Array.isArray(c.likedBy) ? c.likedBy.map((x) => String(x)) : [];
      const hasLiked = vid ? likedBy.includes(vid) : false;

      return {
        ...c,
        likes,
        likedBy,
        hasLiked,
        avatarUrl: c.avatarUrl || null,
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
  const [post, setPost] = useState(initialPost || null);
  const [openComments, setOpenComments] = useState(false);

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
    // lightweight preview for the page (still opens modal for full interaction)
    return (visibleComments || []).slice(0, 2);
  }, [visibleComments]);

  const createdAtLabel = post?.createdAt ? formatDateTime(post.createdAt) : '';

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
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (data?.post) {
        setPost(data.post);
      }
    } catch {
      alert('Could not add comment (network/server).');
    }
  };

  const handleBack = () => router.push(withChrome('/feed'));
  const openCommentsModal = () => setOpenComments(true);

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

  const likesCount = Number.isFinite(Number(post.likes)) ? Number(post.likes) : 0;
  const commentsCount = Array.isArray(visibleComments) ? visibleComments.length : 0;

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

              <div style={{ marginTop: 10 }}>
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
          {/* Main card */}
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

                <div>
                  <div style={{ fontWeight: 900, color: '#102027', fontSize: 15 }}>
                    {post.author || 'Member'}
                  </div>
                  <div style={{ fontSize: 12, color: '#607D8B' }}>
                    {createdAtLabel} • {post.type || 'business'}
                  </div>
                </div>
              </div>

              {/* Visual-only stats (no actions) */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <PillStat label="Likes" value={formatCompactNumber(likesCount)} />
                <PillStat label="Comments" value={formatCompactNumber(commentsCount)} />
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
                <div style={{ fontSize: 12, fontWeight: 900, color: '#37474F' }}>
                  Attachments
                </div>

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

            {/* Single engagement CTA */}
            <div
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTop: '1px solid rgba(15,23,42,0.08)',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
            >
              <button
                className="px-3 py-2 rounded-md bg-[#FF7043] text-sm font-semibold text-white hover:opacity-95"
                onClick={openCommentsModal}
              >
                View all comments
              </button>
            </div>
          </div>

          {/* Comment preview (lightweight, encourages engagement without duplicating the modal) */}
          <div style={{ marginTop: 16 }}>
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
              <button
                className="px-3 py-2 rounded-md border border-gray-200 bg-white/70 text-sm font-semibold text-gray-700 hover:bg-white"
                onClick={openCommentsModal}
              >
                View all comments
              </button>
            </div>

            {previewComments.length === 0 ? (
              <div style={{ marginTop: 10, fontSize: 13, color: '#607D8B' }}>
                No comments yet. Be the first to respond.
              </div>
            ) : (
              <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                {previewComments.map((c, idx) => {
                  const name = c?.authorName || c?.author || 'Member';
                  const text = c?.text || c?.body || '';
                  const when = c?.createdAt ? formatDateTime(c.createdAt) : '';
                  const likes = Number.isFinite(Number(c?.likes)) ? Number(c.likes) : 0;

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
                            {String(name || '?')
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 900, color: '#102027', fontSize: 13 }}>
                            {name}
                          </div>
                          <div style={{ fontSize: 12, color: '#78909C' }}>
                            {when ? when : ' '}
                          </div>
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

                      <div style={{ marginTop: 10 }}>
                        <button
                          className="text-sm font-semibold"
                          style={{ color: '#FF7043' }}
                          onClick={openCommentsModal}
                        >
                          Reply in comments →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </GlassPanel>

        {openComments ? (
          <PostCommentsModal
            post={post}
            onClose={() => setOpenComments(false)}
            onReply={handleReply}
          />
        ) : null}
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
    comments: normalizeComments(row.comments, String(session.user.id)),
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
