// components/feed/Feed.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import PostComposer from './PostComposer';
import PostList from './PostList';

import { useCurrentUserAvatar } from '@/hooks/useCurrentUserAvatar';

export default function Feed() {
  const { data: session, status } = useSession();
  const [filter, setFilter] = useState('both'); // both | business | personal
  const [showComposer, setShowComposer] = useState(false);
  const [posts, setPosts] = useState([]);
  const [blockedAuthorIds, setBlockedAuthorIds] = useState([]);

  const [newPostsAvailable, setNewPostsAvailable] = useState(0);
  const newestPostIdRef = useRef(null);

  const currentUserId = session?.user?.id || 'me';
  const currentUserName =
    session?.user?.name ||
    [session?.user?.firstName, session?.user?.lastName].filter(Boolean).join(' ') ||
    (session?.user?.email?.split('@')[0] ?? '');

  const currentUserAvatar = session?.user?.avatarUrl || session?.user?.image || null;

  const { avatarUrl: resolvedAvatarUrl, loading: resolvedAvatarLoading } = useCurrentUserAvatar();

  const composerAvatarUrl = currentUserAvatar || resolvedAvatarUrl || null;

  const composerInitial = useMemo(() => {
    return (currentUserName || '?').trim().charAt(0).toUpperCase();
  }, [currentUserName]);

  const [stickyAvatarUrl, setStickyAvatarUrl] = useState(null);

  useEffect(() => {
    if (composerAvatarUrl) setStickyAvatarUrl(composerAvatarUrl);
  }, [composerAvatarUrl]);

  const avatarResolved = useMemo(() => {
    if (stickyAvatarUrl) return true;
    if (status !== 'authenticated') return false;
    if (currentUserAvatar) return true;
    if (resolvedAvatarLoading) return false;
    if (resolvedAvatarUrl) return true;
    return true;
  }, [stickyAvatarUrl, status, currentUserAvatar, resolvedAvatarLoading, resolvedAvatarUrl]);

  const hasAvatarImage = !!stickyAvatarUrl;

  const userCapabilities = useMemo(() => {
    const roleValues = [
      session?.user?.role,
      session?.user?.userType,
      ...(Array.isArray(session?.user?.roles) ? session.user.roles : []),
    ]
      .filter(Boolean)
      .map((value) => String(value).trim().toUpperCase());

    const roleSet = new Set(roleValues);

    return {
      canPostHiring: roleSet.has('RECRUITER'),
      canPostCoachingOffer: roleSet.has('COACH'),
    };
  }, [session]);

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

  const normalizeCommunityPost = (row) => {
    if (!row) return null;

    let body = row.content || row.text || row.body || '';
    let attachments = [];

    try {
      const parsed = typeof row.content === 'string' ? JSON.parse(row.content) : null;
      if (parsed?.body) body = parsed.body;
      if (Array.isArray(parsed?.attachments)) attachments = parsed.attachments;
    } catch {}

    if (Array.isArray(row.attachments) && row.attachments.length > 0) {
      attachments = row.attachments;
    }

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
      authorSlug: row.authorSlug || null,
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

  const reloadFeed = async () => {
    if (document.visibilityState === 'hidden') return;
    try {
      const feedRes = await fetch('/api/feed');
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        const community = (feedData.posts || []).map(normalizeCommunityPost).filter(Boolean);
        setPosts(community);
        setNewPostsAvailable(0);
        if (community.length > 0) {
          newestPostIdRef.current = community[0].id;
        }
      }
    } catch (err) {
      console.error('Feed load error:', err);
    }
  };

  const checkForNewPosts = async () => {
    if (document.visibilityState === 'hidden') return;
    if (!newestPostIdRef.current) return;
    try {
      const feedRes = await fetch('/api/feed?limit=5');
      if (!feedRes.ok) return;
      const feedData = await feedRes.json();
      const latest = (feedData.posts || []).map(normalizeCommunityPost).filter(Boolean);
      if (!latest.length) return;

      const newCount = latest.filter((p) => p.id > newestPostIdRef.current).length;

      if (newCount > 0) {
        setNewPostsAvailable((prev) => Math.max(prev, newCount));
      }
    } catch {
      // silent
    }
  };

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
    if (status !== 'authenticated') return;
    reloadFeed();
    loadBlockedAuthors();
  }, [status, filter]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const interval = setInterval(checkForNewPosts, 30 * 1000);
    return () => clearInterval(interval);
  }, [status]);

  const handleNewPost = async ({ body, type, attachments }) => {
    const res = await fetch('/api/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, type, attachments: attachments ?? [] }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Post failed (${res.status})`);
    }

    const { post } = await res.json();

    if (post) {
      const normalized = normalizeCommunityPost(post);
      setPosts((prev) => [normalized, ...prev]);
      if (normalized?.id) newestPostIdRef.current = normalized.id;
    } else {
      await reloadFeed();
    }

    setShowComposer(false);

    if (post?.id) {
      await logPostInteraction(post.id, 'post_create');
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
    <div className="w-full max-w-none px-2 sm:px-4 lg:px-6 pt-2 pb-10">
      <div className="mb-5 rounded-[24px] border border-white/50 bg-white/72 backdrop-blur-xl shadow-[0_14px_40px_rgba(15,23,42,0.08)] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-[18px] sm:text-[20px] font-bold text-gray-900">
              Career Signal Feed
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Share momentum, opportunities, questions, and real career updates.
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
            <div className="flex items-center gap-3">
              <span className="bg-white/85 backdrop-blur px-3 py-1.5 rounded-xl text-sm font-semibold text-gray-800 shadow-sm border border-gray-200">
                Showing
              </span>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm bg-white/90 backdrop-blur border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
              >
                <option value="both">Business & Personal</option>
                <option value="business">Business</option>
                <option value="personal">Personal</option>
              </select>
            </div>

            {newPostsAvailable > 0 && (
              <button
                type="button"
                onClick={reloadFeed}
                className="py-2.5 px-4 rounded-2xl bg-[#ff7043] text-white text-sm font-bold shadow-md hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <span>↑</span>
                {newPostsAvailable === 1
                  ? '1 new post — tap to load'
                  : `${newPostsAvailable}+ new posts — tap to load`}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/78 backdrop-blur-xl rounded-[26px] border border-white/50 shadow-[0_16px_50px_rgba(15,23,42,0.08)] p-4 sm:p-5 mb-6 w-full">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            {!avatarResolved ? (
              <div className="w-11 h-11 rounded-full bg-gray-200 border border-gray-200 animate-pulse" />
            ) : hasAvatarImage ? (
              <img
                src={stickyAvatarUrl}
                alt={currentUserName || 'You'}
                className="w-11 h-11 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 border border-gray-200 font-semibold">
                {composerInitial}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowComposer(true)}
            className="flex-1 text-left text-gray-600 px-4 py-3.5 border border-gray-300 rounded-2xl bg-white/88 hover:bg-white transition shadow-inner text-sm sm:text-[15px]"
          >
            Share a signal, win, opportunity, or question…
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2.5 text-xs text-gray-600 pl-[56px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-gray-200 px-2.5 py-1">
            <span aria-hidden="true">📷</span> Photo
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-gray-200 px-2.5 py-1">
            <span aria-hidden="true">🎥</span> Video
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-gray-200 px-2.5 py-1">
            <span aria-hidden="true">🔗</span> Link
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-gray-200 px-2.5 py-1">
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
            className="relative bg-white rounded-[28px] shadow-2xl w-[92vw] max-w-2xl p-0 border border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
              <div className="font-extrabold text-gray-900 text-[18px]">
                Create post
              </div>
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="text-sm font-bold text-[#FF7043] hover:opacity-80"
              >
                Cancel
              </button>
            </div>

            <div className="p-4 bg-white">
              <PostComposer
                onPost={handleNewPost}
                onCancel={() => setShowComposer(false)}
                currentUserName={currentUserName}
                currentUserAvatar={stickyAvatarUrl || composerAvatarUrl || null}
                canPostHiring={userCapabilities.canPostHiring}
                canPostCoachingOffer={userCapabilities.canPostCoachingOffer}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}