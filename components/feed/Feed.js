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
    [session?.user?.firstName, session?.user?.lastName].filter(Boolean).join(' ') ||
    (session?.user?.email?.split('@')[0] ?? 'You');
  const currentUserAvatar = session?.user?.avatarUrl || session?.user?.image || null;

  // Normalize community post shape
  const normalizeCommunityPost = (row) => {
    if (!row) return null;

    // pull body from any of the likely fields
    let body = row.content || row.text || row.body || '';
    let attachments = [];

    try {
      // if content is JSON with { body, attachments }
      const parsed = JSON.parse(row.content);
      if (parsed?.body) body = parsed.body;
      if (Array.isArray(parsed?.attachments)) attachments = parsed.attachments;
    } catch {
      // not JSON – just fall back to the raw body above
    }

    return {
      id: row.id,
      authorId: row.authorId ?? currentUserId,
      author: row.authorName ?? currentUserName,
      authorAvatar: row.authorAvatar ?? (row.authorId === currentUserId ? currentUserAvatar : null),
      body,
      type: row.type ?? 'business',
      createdAt: new Date(row.createdAt).toISOString(),
      likes: row.likes ?? 0,
      comments: Array.isArray(row.comments) ? row.comments : [],
      attachments,
      isJob: false,
    };
  };

  // Normalize remote job shape (so PostList can display it)
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
        community = (feedData.posts || []).map(normalizeCommunityPost).filter(Boolean);
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
    // Refresh every 5 minutes for fresh jobs
    const interval = setInterval(reloadFeed, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Composer & reply handlers stay the same (only affect community posts)
  const handleNewPost = async (postFromComposer) => {
    const body = postFromComposer.body ?? '';

    // send both "content" and "text" so the API + DB are happy
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
    // unchanged – implement if/when needed
  };

  const handleDelete = async (postId) => {
    // unchanged – implement if/when needed
  };

  return (
    <div className="mx-auto w-full max-w-none px-2 sm:px-6 pt-6 pb-10">
      {/* Filter — added "remote" option */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">Showing</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm bg-white border rounded-md px-3 py-1"
          >
            <option value="both">Community + Remote Jobs</option>
            <option value="business">Community (Professional)</option>
            <option value="personal">Community (Personal)</option>
            <option value="remote">Remote Jobs Only</option>
          </select>
        </div>
      </div>

      {/* Composer trigger */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <button
          onClick={() => setShowComposer(true)}
          className="w-full text-left text-gray-600 px-3 py-2 border rounded-md hover:bg-gray-50"
        >
          Start a post…
        </button>
      </div>

      <PostList
        posts={posts}
        filter={filter}
        onReply={handleReply}
        onDelete={handleDelete}
        currentUserId={currentUserId}
      />

      {showComposer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowComposer(false)} // click backdrop to close
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-4"
            onClick={(e) => e.stopPropagation()} // keep clicks inside from closing
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
