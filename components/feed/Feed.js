// components/feed/Feed.js
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import PostComposer from './PostComposer';
import PostList from './PostList';

// ✅ MIN ADD: use the same avatar resolver as the header system
import { useCurrentUserAvatar } from '@/hooks/useCurrentUserAvatar';

export default function Feed() {
  const { data: session, status } = useSession(); // ✅ MIN CHANGE: include status
  const [filter, setFilter] = useState('both'); // both | business | personal
  const [showComposer, setShowComposer] = useState(false);
  const [posts, setPosts] = useState([]);
  const [blockedAuthorIds, setBlockedAuthorIds] = useState([]); // ✅ NEW: track blocked authors client-side

  const currentUserId = session?.user?.id || 'me';
  const currentUserName =
    session?.user?.name ||
    [session?.user?.firstName, session?.user?.lastName].filter(Boolean).join(' ') ||
    (session?.user?.email?.split('@')[0] ?? '');

  const currentUserAvatar = session?.user?.avatarUrl || session?.user?.image || null;

  // ✅ MIN ADD: preferred avatarUrl from your “working” system (DB-backed)
  // IMPORTANT: only use this hook for avatarUrl, not initials (prevents Y → S flicker)
  // ✅ MIN CHANGE: also read loading so we don't "resolve no avatar" too early on refresh
  const { avatarUrl: resolvedAvatarUrl, loading: resolvedAvatarLoading } = useCurrentUserAvatar();

  // ✅ Prefer session avatar first (will become "immediate" after NextAuth update), then DB resolver
  const composerAvatarUrl = currentUserAvatar || resolvedAvatarUrl || null;

  // ✅ Stable initial derived from session name (never changes Y → S)
  const composerInitial = useMemo(() => {
    return (currentUserName || '?').trim().charAt(0).toUpperCase();
  }, [currentUserName]);

  // ✅ Sticky avatar so once we have an image, we never regress
  const [stickyAvatarUrl, setStickyAvatarUrl] = useState(null);

  useEffect(() => {
    if (composerAvatarUrl) setStickyAvatarUrl(composerAvatarUrl);
  }, [composerAvatarUrl]);

  // ✅ RULE: no letter until we KNOW there is no avatar
  // - If we have sticky avatar: resolved (avatar exists)
  // - If session not authenticated yet: unknown -> skeleton
  // - If authenticated and either:
  //     - session has avatar OR DB hook has avatar: resolved (avatar exists)
  //     - DB hook still loading: unknown -> skeleton
  //     - DB hook finished and no avatar anywhere: resolved (no avatar) -> show initial
  const avatarResolved = useMemo(() => {
    if (stickyAvatarUrl) return true; // avatar exists
    if (status !== 'authenticated') return false; // unknown, keep skeleton

    // If session already has avatar, we are resolved immediately
    if (currentUserAvatar) return true;

    // Authenticated but session has no avatar:
    // If resolver still loading, we are NOT resolved yet (keep skeleton)
    if (resolvedAvatarLoading) return false;

    // Resolver finished: if it found one, we resolve (avatar exists)
    if (resolvedAvatarUrl) return true;

    // Resolver finished and nothing found -> resolved "no avatar"
    return true;
  }, [stickyAvatarUrl, status, currentUserAvatar, resolvedAvatarLoading, resolvedAvatarUrl]);

  // ✅ Derived: do we know we have an avatar image to show?
  const hasAvatarImage = !!stickyAvatarUrl;

  // ✅ NEW: best-effort interaction logger (server dedupes + ignores self)
  const logPostInteraction = async (postId, source) => {
    try {
      if (!postId && postId !== 0) return;
      await fetch('/api/feed/post-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          source: source || 'interaction',
        }),
      });
    } catch {
      // best-effort only
    }
  };

  // Normalize community post shape
  const normalizeCommunityPost = (row) => {
    if (!row) return null;

    let body = row.content || row.text || row.body || '';
    let attachments = [];

    try {
      const parsed = typeof row.content === 'string' ? JSON.parse(row.content) : null;
      if (parsed?.body) body = parsed.body;
      if (Array.isArray(parsed?.attachments)) attachments = parsed.attachments;
    } catch {}

    let reactions = [];
    const rawReactions = row.reactions;

    if (Array.isArray(rawReactions)) {
      reactions = rawReactions;
    } else if (typeof rawReactions === 'string') {
      try {
        const parsed = JSON.parse(rawReactions);
        if (Array.isArray(parsed)) reactions = parsed;
      } catch {}
    } else if (rawReactions && typeof rawReactions === 'object') {
      reactions = Array.isArray(rawReactions) ? rawReactions : [];
    }

    const reactionCount = Array.isArray(reactions)
      ? reactions.reduce((sum, r) => sum + (typeof r.count === 'number' ? r.count : 0), 0)
      : 0;

    const comments = Array.isArray(row.comments) ? row.comments : [];

    return {
      id: row.id,
      authorId: row.authorId ?? null,
      author: row.authorName || row.author || 'Member',
      authorAvatar: row.authorAvatar || null,
      body,
      type: row.type ?? 'business',
      createdAt: new Date(row.createdAt).toISOString(),
      likes: reactionCount,
      comments,
      attachments,
      reactions,
      isJob: false,
    };
  };

  // Main loader – only community posts
  const reloadFeed = async () => {
    try {
      const feedRes = await fetch('/api/feed');
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        const community = (feedData.posts || []).map(normalizeCommunityPost).filter(Boolean);
        setPosts(community);
      }
    } catch (err) {
      console.error('Feed load error:', err);
    }
  };

  // ✅ Load blocked from DB, merge with optimistic
  const loadBlockedAuthors = async () => {
    try {
      const res = await fetch('/api/signal/blocked');
      if (res.ok) {
        const data = await res.json();
        const dbIds = data.blocked?.map((b) => b.id) || [];
        setBlockedAuthorIds((prev) => {
          const merged = new Set([...prev, ...dbIds]);
          return Array.from(merged);
        });
      }
    } catch (err) {
      console.error('load blocked error', err);
    }
  };

  useEffect(() => {
    reloadFeed();
    loadBlockedAuthors();
    const interval = setInterval(reloadFeed, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleNewPost = async (postFromComposer) => {
    const body = postFromComposer.body ?? '';
    const payload = {
      content: JSON.stringify({
        body,
        attachments: postFromComposer.attachments ?? [],
      }),
      text: body,
      type: postFromComposer.type,
      attachments: postFromComposer.attachments ?? [],
    };

    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await reloadFeed();
        setShowComposer(false);

        try {
          const feedRes = await fetch('/api/feed');
          if (feedRes.ok) {
            const feedData = await feedRes.json();
            const community = (feedData.posts || []).map(normalizeCommunityPost).filter(Boolean);
            const mine = community.find((p) => String(p?.authorId || '') === String(currentUserId));
            if (mine?.id) {
              await logPostInteraction(mine.id, 'post_create');
            }
          }
        } catch {}
      } else {
        console.error('Post failed', await res.text());
      }
    } catch (err) {
      console.error('Post failed', err);
    }
  };

  const handleReply = async (postId, text) => {
    if (!postId || !text || !text.trim()) return;
    const trimmed = text.trim();

    try {
      const res = await fetch('/api/feed/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, text: trimmed }),
      });

      if (!res.ok) {
        console.error('Comment failed', await res.text());
        return;
      }

      await logPostInteraction(postId, 'comment');
    } catch (err) {
      console.error('Comment error:', err);
      return;
    }

    const newComment = {
      userId: currentUserId || null,
      byUserId: currentUserId || null,
      by: currentUserName || 'You',
      text: trimmed,
      avatarUrl: currentUserAvatar || null,
      at: new Date().toISOString(),
    };

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: Array.isArray(p.comments) ? [...p.comments, newComment] : [newComment],
            }
          : p
      )
    );
  };

  const handleReact = async (postId, emoji) => {
    if (!emoji) return;
    if (!postId && postId !== 0) return;

    try {
      const res = await fetch('/api/feed/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, emoji }),
      });

      if (!res.ok) {
        console.error('React failed', await res.text());
        return;
      }

      const data = await res.json();
      const reactions = Array.isArray(data.reactions) ? data.reactions : [];
      const reactionCount = reactions.reduce(
        (sum, r) => sum + (typeof r.count === 'number' ? r.count : 0),
        0
      );

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                reactions,
                likes: reactionCount,
              }
            : p
        )
      );

      await logPostInteraction(postId, 'react');
    } catch (err) {
      console.error('React error:', err);
    }
  };

  const handleDelete = async (postId) => {
    if (!postId) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    try {
      await fetch(`/api/feed/${postId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleBlockAuthor = (authorId) => {
    if (!authorId) return;

    setBlockedAuthorIds((prev) => {
      if (prev.includes(authorId)) return prev;
      return [...prev, authorId];
    });

    loadBlockedAuthors();
  };

  const filteredPosts = posts.filter((p) => !blockedAuthorIds.includes(p.authorId));

  return (
    <div className="w-full max-w-none px-2 sm:px-6 pt-6 pb-10">
      {/* Filter */}
      <div className="mb-4 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <span className="bg-white/80 backdrop-blur px-3 py-1 rounded-lg text-sm font-semibold text-gray-800 shadow-sm border border-gray-200">
            Showing
          </span>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm bg-white/80 backdrop-blur border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="both">Business & Personal</option>
            <option value="business">Business</option>
            <option value="personal">Personal</option>
          </select>
        </div>
      </div>

      {/* Composer trigger (polished) */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 shadow-sm p-4 mb-6 w-full">
        <div className="flex items-center gap-3">
          {/* ✅ RULE: no letter until we KNOW there is no avatar */}
          <div className="shrink-0">
            {!avatarResolved ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-200 animate-pulse" />
            ) : hasAvatarImage ? (
              <img
                src={stickyAvatarUrl}
                alt={currentUserName || 'You'}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 border border-gray-200">
                {composerInitial}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowComposer(true)}
            className="flex-1 text-left text-gray-600 px-4 py-3 border border-gray-300 rounded-xl hover:bg-white transition shadow-inner"
          >
            Start a post…
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600 pl-[52px]">
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true">📷</span> Photo
          </span>
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true">🎥</span> Video
          </span>
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true">🔗</span> Link
          </span>
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true">🙂</span> Emoji
          </span>
        </div>
      </div>

      <PostList
        posts={filteredPosts}
        filter={filter}
        onReply={handleReply}
        onDelete={handleDelete}
        onReact={handleReact}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onBlockAuthor={handleBlockAuthor}
      />

      {showComposer && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 pt-16 sm:pt-24"
          onClick={() => setShowComposer(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-[92vw] max-w-2xl p-0 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white rounded-t-2xl">
              <div className="font-extrabold text-gray-900">Create post</div>
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="text-sm font-bold text-[#FF7043] hover:opacity-80"
              >
                Cancel
              </button>
            </div>

            <div className="p-4 bg-white rounded-b-2xl">
              <PostComposer
                onPost={handleNewPost}
                onCancel={() => setShowComposer(false)}
                currentUserName={currentUserName}
                // ✅ MIN FIX: pass best-known avatar, not session-only
                currentUserAvatar={stickyAvatarUrl || composerAvatarUrl || null}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}