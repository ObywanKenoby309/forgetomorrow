// components/feed/Feed.js
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import PostComposer from './PostComposer';
import PostList from './PostList';

export default function Feed() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState('both'); // both | business | personal | remote
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

  // Normalize community post shape (matches your DB feedPost rows)
  const normalizeCommunityPost = (row) => {
    if (!row) return null;
    let body = row.content || row.text || row.body || '';
    let attachments = [];
    try {
      const parsed =
        typeof row.content === 'string' ? JSON.parse(row.content) : null;
      if (parsed?.body) body = parsed.body;
      if (Array.isArray(parsed?.attachments)) attachments = parsed.attachments;
    } catch {
      // not JSON – just fall back to raw body above
    }
    // Reactions from API (Json field)
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
    // Comments
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

  // Normalize remote job shape
  const normalizeJob = (job) => ({
    id: `job-${job.id}`,
    author: job.company,
    authorAvatar: null,
    body: `${job.title}\n\n${job.location || 'Remote'}\n${job.url}`,
    type: 'business',
    createdAt: new Date(job.fetchedAt || job.postedAt).toISOString(),
    likes: 0,
    comments: [],
    attachments: [],
    isJob: true,
    jobData: job,
  });

  // Main loader — pulls community posts OR remote jobs (or both)
  const reloadFeed = async () => {
    try {
      let community = [];
      let remoteJobs = [];
      // 1. Always get community posts
      const feedRes = await fetch('/api/feed');
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        community = (feedData.posts || [])
          .map(normalizeCommunityPost)
          .filter(Boolean);
      }
      // 2. Get remote jobs if we want them
      if (filter === 'both' || filter === 'remote') {
        const jobsRes = await fetch('/api/jobs/remote');
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          remoteJobs = (jobsData.jobs || []).map(normalizeJob);
        }
      }
      // Combine & sort by date
      const combined = [...community, ...remoteJobs].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setPosts(combined);
    } catch (err) {
      console.error('Feed load error:', err);
    }
  };

  useEffect(() => {
    reloadFeed();
    const interval = setInterval(reloadFeed, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // New post from composer → saved via /api/feed
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

  // Replies (text) — hit /api/feed/comments AND update state
  const handleReply = async (postId, text) => {
    if (!postId || !text || !text.trim()) return;
    const trimmed = text.trim();
    if (String(postId).startsWith('job-')) return;
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
              comments: Array.isArray(p.comments)
                ? [...p.comments, newComment]
                : [newComment],
            }
          : p
      )
    );
  };

  // Emoji reactions — already fully DB-backed
  const handleReact = async (postId, emoji) => {
    if (!emoji) return;
    if (!postId && postId !== 0) return;
    if (String(postId).startsWith('job-')) return;
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
    if (String(postId).startsWith('job-')) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await fetch(`/api/feed/${postId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="mx-auto w-full max-w-none px-2 sm:px-6 pt-6 pb-10">
      {/* Filter bar with white pill behind "Showing" */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* White pill only on "Showing" */}
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
            <option value="both">Community + Remote Jobs</option>
            <option value="business">Community (Professional)</option>
            <option value="personal">Community (Personal)</option>
            <option value="remote">Remote Jobs Only</option>
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