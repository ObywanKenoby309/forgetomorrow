// pages/post-view.js
import { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import PostDetailContent from '@/components/feed/PostDetailContent';
import { getTimeGreeting } from '@/lib/dashboardGreeting';

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

export default function PostViewPage({ initialPost, notFound }) {
  const router = useRouter();
  const { data: session } = useSession();

  const [post, setPost] = useState(initialPost || null);

  const myId = session?.user?.id ? String(session.user.id) : '';

  const chrome = String(router.query?.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const handleBack = () => router.push(withChrome('/feed'));

  const onReply = async (postId, text) => {
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
        setPost((prev) =>
          prev
            ? {
                ...prev,
                ...data.post,
                comments: normalizeComments(data.post.comments, myId, {}),
              }
            : prev
        );
      }
    } catch {
      alert('Could not add comment (network/server).');
    }
  };

  const greeting = getTimeGreeting();

  const HeaderBox = (
    <SeekerTitleCard
      greeting={greeting}
      title="Post Detail"
      subtitle="See the full post, track engagement, and respond without losing context."
    />
  );

  if (notFound || !post) {
    return (
      <>
        <Head>
          <title>ForgeTomorrow — Post</title>
        </Head>

        <SeekerLayout
          title="Post | ForgeTomorrow"
          right={<RightRailPlacementManager surfaceId="post_view" />}
          rightVariant="light"
          activeNav="feed"
          header={HeaderBox}
        >
          <div className="relative overflow-hidden rounded-[20px] border border-white/40 bg-[linear-gradient(160deg,rgba(255,255,255,0.22),rgba(255,180,130,0.18))] backdrop-blur-[26px] backdrop-saturate-[160%] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_20px_50px_-24px_rgba(50,20,10,0.3)] p-8 w-full text-center">
            <h2 className="text-lg font-extrabold text-[#3a2418]">Post not found</h2>
            <p className="mt-2 text-sm text-[#8a5d44]">
              This post may have been deleted or is no longer available.
            </p>
            <button
              type="button"
              onClick={handleBack}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#FF7043] to-[#E55A2B] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(255,112,67,0.55)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-10px_rgba(255,112,67,0.65)]"
            >
              Back to Feed
            </button>
          </div>
        </SeekerLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>ForgeTomorrow — Post</title>
      </Head>

      <SeekerLayout
        title="Post | ForgeTomorrow"
        right={<RightRailPlacementManager surfaceId="post_view" />}
        rightVariant="light"
        activeNav="feed"
        header={HeaderBox}
      >
        <div className="space-y-4 w-full">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/40 hover:bg-white/60 hover:border-white/60 px-3.5 py-2 text-sm font-bold text-[#6b4a3a] hover:text-[#3a2418] transition-all duration-150"
          >
            <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Feed
          </button>

          <div className="relative overflow-hidden rounded-[20px] border border-white/40 bg-[linear-gradient(160deg,rgba(255,255,255,0.22),rgba(255,180,130,0.18))] backdrop-blur-[26px] backdrop-saturate-[160%] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_20px_50px_-24px_rgba(50,20,10,0.3)] w-full">
            <PostDetailContent post={post} onReply={onReply} variant="page" />
          </div>
        </div>
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
      attachments: true,
    },
  });

  if (!row) {
    return { props: { initialPost: null, notFound: true } };
  }

  let authorAvatar = null;
  if (row.authorId) {
    const u = await prisma.user.findUnique({
      where: { id: row.authorId },
      select: { avatarUrl: true, image: true },
    });
    authorAvatar = u?.avatarUrl || u?.image || null;
  }

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

  const { body } = parseContent(row.content);
  const attachments = Array.isArray(row.attachments)
    ? row.attachments
    : safeJsonArray(row.attachments);

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