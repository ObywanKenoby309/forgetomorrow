// components/feed/Feed.js – full script with correct filter (no remote jobs)
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import PostComposer from './PostComposer';
import PostList from './PostList';

export default function Feed() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState('both'); // both | business | personal
  const [showComposer, setShowComposer] = useState(false);
  const [posts, setPosts] = useState([]);
  const currentUserId = session?.user?.id || 'me';
  const currentUserName =
    session?.user?.name ||
    [session?.user?.firstName, session?.user?.lastName]
      .filter(Boolean)
      .join(' ') ||
    (session?.user?.email?.split('@')[0] ?? '');
  const currentUserAvatar =
    session?.user?.avatarUrl || session?.user?.image || null;

  // Normalize community post shape (keep as-is)
  const normalizeCommunityPost = (row) => {
    if (!row) return null;
    let body = row.content || row.text || row.body || '';
    let attachments = [];
    try {
      const parsed =
        typeof row.content === 'string' ? JSON.parse(row.content) : null;
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
      ? reactions.reduce(
          (sum, r) => sum + (typeof r.count === 'number' ? r.count : 0),
          0
        )
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

  // Main loader – only community posts (no remote jobs)
  const reloadFeed = async () => {
    try {
      const feedRes = await fetch('/api/feed');
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        const community = (feedData.posts || [])
          .map(normalizeCommunityPost)
          .filter(Boolean);
        setPosts(community);
      }
    } catch (err) {
      console.error('Feed load error:', err);
    }
  };

  useEffect(() => {
    reloadFeed();
    const interval = setInterval(reloadFeed, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [filter]);

  // ... (keep handleNewPost, handleReply, handleReact, handleDelete as-is)

  return (
    <div className="mx-auto w-full max-w-none px-2 sm:px-6 pt-6 pb-10">
      {/* Filter – correct options only */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="bg-white px-3 py-1 rounded-lg text-sm font-semibold text-gray-800 shadow-sm border border-gray-200"
          >
            Showing
          </span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm bg-white border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="both">Community + Business & Personal</option>
            <option value="business">Community (Business)</option>
            <option value="personal">Community (Personal)</option>
          </select>
        </div>
      </div>

      {/* Composer trigger */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <button
          onClick={() => setShowComposer(true)}
          className="w-full text-left text-gray-600 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
        >
          Start a post…
        </button>
      </div>

      <PostList
        posts={posts}
        filter={filter}
        onReply={handleReply}
        onDelete={handleDelete}
        onReact={handleReact}
        currentUserId={currentUserId}
      />

      {showComposer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowComposer(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <PostComposer
              onPost={handleNewPost}
              onCancel={() => setShowComposer(false)}
              currentUserName={currentUserName}
              currentUserAvatar={currentUserAvatar}
            />
          </div>
        </div>
      )}
    </div>
  );
}