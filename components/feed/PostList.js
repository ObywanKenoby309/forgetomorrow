// components/feed/PostList.js
import { useEffect, useMemo, useState } from 'react';
import PostCard from './PostCard';
import PostCommentsModal from './PostCommentsModal';

const STORAGE_KEY = 'feed_posts_v1';

const seed = [
  {
    id: 'p1',
    author: 'Alex T.',
    createdAt: Date.now() - 1000 * 60 * 40,
    body: 'First day using ForgeTomorrow — loving the vibe 🔥',
    type: 'business',
    likes: 4,
    comments: [
      { by: 'Jane', text: 'Welcome aboard!', ts: Date.now() - 1000 * 60 * 35 },
      { by: 'Sam', text: 'Same here — UI is clean!', ts: Date.now() - 1000 * 60 * 30 },
      { by: 'Mo', text: 'Let’s connect!', ts: Date.now() - 1000 * 60 * 25 },
    ],
  },
  {
    id: 'p2',
    author: 'Priya N.',
    createdAt: Date.now() - 1000 * 60 * 90,
    body: 'Wrapped a mock interview. Sharing notes later.',
    type: 'personal',
    likes: 2,
    comments: [{ by: 'Lee', text: 'Would love to see those!', ts: Date.now() - 1000 * 60 * 80 }],
  },
];

export default function PostList({ filter = 'all' }) {
  const [posts, setPosts] = useState(seed);
  const [openPost, setOpenPost] = useState(null);

  // (optional) hydrate from storage for demo persistence
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (Array.isArray(saved) && saved.length) setPosts(saved);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); } catch {}
  }, [posts]);

  // Filter visible posts
  const visible = useMemo(() => {
    if (filter === 'all') return posts;
    return posts.filter((p) => p.type === filter);
  }, [posts, filter]);

  // Handlers
  const handleReply = (postId, text) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id !== postId
          ? p
          : {
              ...p,
              comments: [...p.comments, { by: 'You', text, ts: Date.now() }],
            }
      )
    );
  };

  const openComments = (post) => setOpenPost(post);
  const closeComments = () => setOpenPost(null);

  const addCommentFromModal = (postId, text) => {
    handleReply(postId, text);
    // keep modal open and reflect new comment
    setOpenPost((curr) =>
      curr && curr.id === postId
        ? { ...curr, comments: [...curr.comments, { by: 'You', text, ts: Date.now() }] }
        : curr
    );
  };

  return (
    <>
      <div className="space-y-3">
        {visible.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onReply={handleReply}
            onOpenComments={openComments}
            previewCount={2} // show 2 in preview
          />
        ))}
      </div>

      {openPost && (
        <PostCommentsModal
          post={openPost}
          onClose={closeComments}
          onAddComment={addCommentFromModal}
        />
      )}
    </>
  );
}
