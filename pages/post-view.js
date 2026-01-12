// pages/post-view.js
import { useEffect, useMemo, useState } from 'react';
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

  return comments.map((c) => {
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
  });
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
        >
          <div
            style={{
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.58)',
              boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              padding: '24px 16px',
            }}
          >
            <div className="text-sm text-gray-600">This post could not be found.</div>
            <button
              className="mt-4 px-4 py-2 rounded-md bg-[#FF7043] text-white font-semibold"
              onClick={() => router.push(withChrome('/feed'))}
            >
              Back to Feed
            </button>
          </div>
        </SeekerLayout>
      </>
    );
  }

  if (!post) return null;

  const createdAtLabel = (() => {
    try {
      return new Date(post.createdAt).toLocaleString();
    } catch {
      return '';
    }
  })();

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
          <section
            aria-label="Post header"
            style={{
              borderRadius: 14,
              padding: '24px 16px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.58)',
              boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              margin: '0 auto',
              maxWidth: 1320,
            }}
          >
            <h1 style={{ margin: 0, color: '#FF7043', fontSize: 32, fontWeight: 800 }}>
              Post
            </h1>

            <p style={{ margin: '8px auto 0', color: '#546E7A', maxWidth: 720, fontSize: 16 }}>
              Full post view
            </p>
          </section>
        }
      >
        <div
          style={{
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.22)',
            background: 'rgba(255,255,255,0.58)',
            boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '24px 16px',
            margin: '24px 0 0',
            width: '100%',
            maxWidth: 'none',
            minHeight: '60vh',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <button
              className="px-3 py-2 rounded-md border border-gray-200 bg-white/60 text-sm font-semibold text-gray-700 hover:bg-white"
              onClick={() => router.push(withChrome('/feed'))}
            >
              ← Back
            </button>

            <button
              className="px-3 py-2 rounded-md border border-gray-200 bg-white/60 text-sm font-semibold text-gray-700 hover:bg-white"
              onClick={() => setOpenComments(true)}
            >
              Comments ({visibleComments.length})
            </button>
          </div>

          <div className="mt-5 bg-white rounded-lg shadow p-5">
            <header className="mb-4 flex items-center gap-3">
              {post.authorAvatar ? (
                <img
                  src={post.authorAvatar}
                  alt={post.author || 'Author'}
                  className="w-10 h-10 rounded-full object-cover bg-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  {post.author?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}

              <div>
                <div className="font-semibold">{post.author}</div>
                <div className="text-xs text-gray-500">
                  {createdAtLabel} • {post.type || 'business'}
                </div>
              </div>
            </header>

            <p className="whitespace-pre-wrap">{post.body}</p>

            {Array.isArray(post.attachments) && post.attachments.length > 0 ? (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-semibold text-gray-600">Attachments</div>
                {post.attachments.map((a, idx) => (
                  <div key={idx} className="text-sm text-gray-700 break-all">
                    {typeof a === 'string' ? a : JSON.stringify(a)}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-5 text-sm text-gray-600">
              {visibleComments.length} comment{visibleComments.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>

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
