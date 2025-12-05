// components/feed/Feed.js
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import PostComposer from './PostComposer';
import PostList from './PostList';

export default function Feed() {
  const { data: session } = useSession();

  const [filter, setFilter] = useState('both');
  const [showComposer, setShowComposer] = useState(false);
  const [posts, setPosts] = useState([]);

  const currentUserId = session?.user?.id || 'me';
  const currentUserName =
    session?.user?.name ||
    [session?.user?.firstName, session?.user?.lastName].filter(Boolean).join(' ') ||
    (session?.user?.email ? session.user.email.split('@')[0] : 'You');

  // Load posts on mount
  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      try {
        const res = await fetch('/api/feed');
        if (!res.ok) {
          console.error('Feed GET failed:', await res.text());
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setPosts(Array.isArray(data.posts) ? data.posts : []);
        }
      } catch (err) {
        console.error('Feed GET error:', err);
      }
    }

    loadFeed();
    return () => {
      cancelled = true;
    };
  }, []);

  // Lock scroll when composer open
  useEffect(() => {
    if (!showComposer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showComposer]);

  // New post coming from PostComposer → send to API as { text, type }
  const handleNewPost = async (postFromComposer) => {
    // postFromComposer: { id, author, createdAt, body, type, attachments[] }
    const payload = {
      text: (postFromComposer.body ?? '').toString(),
      type: postFromComposer.type,
    };

    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error('Feed POST failed:', await res.text());
        alert("Sorry — we couldn't save that post. Please try again.");
        return;
      }

      const data = await res.json();
      const saved = data.post;

      // Ensure the shape matches what PostList/PostCard expect
      const safePost = {
        id: saved.id,
        authorId: saved.authorId ?? currentUserId,
        author: saved.author ?? saved.authorName ?? currentUserName,
        body: saved.body ?? saved.content ?? payload.text,
        type: saved.type ?? postFromComposer.type,
        createdAt: saved.createdAt ?? new Date().toISOString(),
        likes: saved.likes ?? 0,
        comments: saved.comments ?? [],
      };

      setPosts((prev) => [safePost, ...prev]);
      setShowComposer(false);
    } catch (err) {
      console.error('Feed POST error:', err);
      alert("Sorry — we couldn't save that post. Please try again.");
    }
  };

  const handleReply = (postId, text) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [...(p.comments || []), { by: currentUserName, text }],
            }
          : p
      )
    );
    // (optional) later: POST /api/feed/:id/comments
  };

  const handleDelete = (postId) => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    // (optional) later: DELETE /api/feed/:id
  };

  return (
    <div className="mx-auto w-full max-w-none px-2 sm:px-6 pt-6 pb-10">
      {/* filter row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">Showing</span>
          <div className="inline-flex items-center gap-2 bg-white border border-gray-300 rounded-md shadow-sm px-2 py-1">
            <select
              id="feedFilter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm bg-white outline-none pr-8 appearance-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 20 20'><path fill='%236b7280' d='M5 7l5 6 5-6H5z'/></svg>\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '12px 12px',
              }}
            >
              <option value="both">Both</option>
              <option value="business">Professional</option>
              <option value="personal">Personal</option>
            </select>
          </div>
        </div>
        <span className="text-xs text-gray-500">Showing most recent</span>
      </div>

      {/* start a post */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <button
          onClick={() => setShowComposer(true)}
          className="w-full text-left text-gray-600 px-3 py-2 border rounded-md hover:bg-gray-50"
        >
          Start a post…
        </button>
      </div>

      {/* feed list */}
      <PostList
        posts={posts}
        filter={filter}
        onReply={handleReply}
        onDelete={handleDelete}
        currentUserId={currentUserId}
      />

      {/* composer overlay */}
      {showComposer && (
        <div
          className="fixed inset-0 z-[60]"
          onKeyDown={(e) => e.key === 'Escape' && setShowComposer(false)}
          tabIndex={-1}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowComposer(false)}
            aria-hidden="true"
          />
          <div className="relative h-full w-full flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl ring-1 ring-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="font-semibold text-gray-800">Create post</h3>
                <button
                  onClick={() => setShowComposer(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close composer"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <PostComposer onPost={handleNewPost} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
