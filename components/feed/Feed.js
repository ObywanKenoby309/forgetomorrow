// components/feed/Feed.js
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import PostComposer from './PostComposer';
import PostList from './PostList';

export default function Feed() {
  const { data: session } = useSession();
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

  // ✅ Global block handler — optimistic add, then merge DB
  const handleBlockAuthor = (authorId) => {
    if (!authorId) return;

    setBlockedAuthorIds((prev) => {
      if (prev.includes(authorId)) return prev;
      return [...prev, authorId];
    });

    loadBlockedAuthors(); // Merge with DB
  };

  // Filter out blocked authors
  const filteredPosts = posts.filter((p) => !blockedAuthorIds.includes(p.authorId));

  return (
    // ✅ CHANGED: remove mx-auto so content does not “self-center” as a narrower column
    <div className="w-full max-w-none px-2 sm:px-6 pt-6 pb-10">
      {/* Filter */}
      <div className="mb-4 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <span className="bg-white px-3 py-1 rounded-lg text-sm font-semibold text-gray-800 shadow-sm border border-gray-200">
            Showing
          </span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm bg-white border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="both">Business & Personal</option>
            <option value="business">Business</option>
            <option value="personal">Personal</option>
          </select>
        </div>
      </div>

      {/* Composer trigger */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 w-full">
        <button
          onClick={() => setShowComposer(true)}
          className="w-full text-left text-gray-600 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
        >
          Start a post…
        </button>
      </div>

      <PostList
        posts={filteredPosts} // ✅ Use filtered posts
        filter={filter}
        onReply={handleReply}
        onDelete={handleDelete}
        onReact={handleReact}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onBlockAuthor={handleBlockAuthor} // ✅ Pass down
      />

      {showComposer && (
        <div
          className="fixed inset-0 z-50 bg-black/40 overflow-y-auto"
          onClick={() => setShowComposer(false)}
        >
          <div
            className="min-h-full w-full flex items-start justify-center px-3 py-6 sm:py-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ✅ Removed extra white wrapper (PostComposer is already a card)
                ✅ Fixed max width typo (was max-w-2x1)
                ✅ Top-aligned + scroll-safe so there’s no giant dead space */}
            <div className="w-full max-w-2xl">
              <PostComposer
                onPost={handleNewPost}
                onCancel={() => setShowComposer(false)}
                currentUserName={currentUserName}
                currentUserAvatar={currentUserAvatar}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
